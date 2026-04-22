import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { MapPin, Loader2, X } from "lucide-react";

interface AddressMeta {
  /** True when Google returned a numbered street address (street_number). */
  hasStreetNumber: boolean;
  /** True when the address contains a full UK postcode (e.g. "N22 8HE"). */
  hasFullPostcode: boolean;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string, meta?: AddressMeta) => void;
  placeholder?: string;
  testId?: string;
}

/* ------------------------------------------------------------------ */
/* Minimal type surface for the Google Places JS API we actually use. */
/* ------------------------------------------------------------------ */

interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface PlaceLike {
  formattedAddress?: string;
  displayName?: string | { text?: string };
  addressComponents?: AddressComponent[];
  fetchFields: (opts: { fields: string[] }) => Promise<unknown>;
}

interface PlacePrediction {
  placeId?: string;
  mainText?: { text?: string };
  secondaryText?: { text?: string };
  text?: { text?: string };
  toPlace: () => PlaceLike;
}

interface AutocompleteSuggestion {
  placePrediction?: PlacePrediction;
}

interface AutocompleteRequest {
  input: string;
  sessionToken?: unknown;
  includedRegionCodes?: string[];
  includedPrimaryTypes?: string[];
  locationBias?: unknown;
  language?: string;
  region?: string;
}

interface AutocompleteSuggestionStatic {
  fetchAutocompleteSuggestions: (
    req: AutocompleteRequest,
  ) => Promise<{ suggestions: AutocompleteSuggestion[] }>;
}

interface PlacesLibrary {
  AutocompleteSuggestion?: AutocompleteSuggestionStatic;
  AutocompleteSessionToken?: new () => unknown;
}

declare global {
  interface Window {
    google?: {
      maps: {
        importLibrary?: (name: string) => Promise<unknown>;
        places?: PlacesLibrary;
      };
    };
    __movefourGmapsLoader?: Promise<void>;
  }
}

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as
  | string
  | undefined;

/** London centre + 30km radius — biases suggestions toward Greater London. */
const LONDON_BIAS_CENTER = { lat: 51.5074, lng: -0.1278 };
const LONDON_BIAS_RADIUS_M = 30000;

/**
 * Restrict suggestions to actual buildings/streets/postcodes.
 * Deliberately excludes vague establishments, regions, and points of interest
 * so the user is forced to pick a real, deliverable address.
 *
 * `street_address` and `premise` cover building-level results; `subpremise`
 * covers flat numbers; `postal_code` lets postcode-only searches work; `route`
 * keeps street-level results when the user hasn't typed a number yet.
 */
const ADDRESS_PRIMARY_TYPES = [
  "street_address",
  "premise",
  "subpremise",
  "postal_code",
  "route",
];

/* ----------------------------------------------------------------- */
/* Google Maps loader — single shared promise across the whole app.   */
/* ----------------------------------------------------------------- */

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__movefourGmapsLoader) return window.__movefourGmapsLoader;
  if (!GOOGLE_KEY) {
    return Promise.reject(new Error("Google Places API key missing"));
  }
  window.__movefourGmapsLoader = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      "movefour-gmaps-script",
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Maps script error")),
      );
      return;
    }
    const script = document.createElement("script");
    script.id = "movefour-gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_KEY,
    )}&v=weekly&libraries=places&language=en-GB&region=GB`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Maps script error"));
    document.head.appendChild(script);
  });
  return window.__movefourGmapsLoader;
}

/* ---------------- Address normalisation helpers ------------------ */

function pick(components: AddressComponent[] | undefined, type: string): string {
  if (!components) return "";
  const c = components.find((x) => x.types?.includes(type));
  return c?.longText || c?.shortText || "";
}

/** Build a clean full UK address from Place data, falling back gracefully. */
function buildFullAddress(place: PlaceLike): string {
  const components = place.addressComponents;
  // The component-built address is cleaner, but Google's `postal_code`
  // component can be just an outward code (e.g. "N22") for street-level
  // results — which would lose the inward part (e.g. "8HE"). When that
  // happens, prefer the `formattedAddress` from Google because it
  // typically carries the full postcode.
  if (components && components.length) {
    const streetNumber = pick(components, "street_number");
    const route = pick(components, "route");
    const postalTown =
      pick(components, "postal_town") ||
      pick(components, "locality") ||
      pick(components, "administrative_area_level_2");
    const postcode = pick(components, "postal_code");
    const country = pick(components, "country") || "UK";

    const componentPostcodeLooksFull = /\b[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}\b/i.test(postcode);
    const formattedHasFullPostcode = place.formattedAddress
      ? /\b[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}\b/i.test(place.formattedAddress)
      : false;

    // If the formattedAddress carries a fuller postcode than our
    // component-built one, defer to Google's version.
    if (!componentPostcodeLooksFull && formattedHasFullPostcode && place.formattedAddress) {
      return place.formattedAddress;
    }

    const street = [streetNumber, route].filter(Boolean).join(" ");
    const cityPostcode = [postalTown, postcode].filter(Boolean).join(" ");
    const parts = [street, cityPostcode, country].filter(Boolean);
    if (parts.length) return parts.join(", ");
  }
  if (place.formattedAddress) return place.formattedAddress;
  if (typeof place.displayName === "string") return place.displayName;
  return place.displayName?.text ?? "";
}

/* ----------------------------------------------------------------- */
/* Component                                                          */
/* ----------------------------------------------------------------- */

/**
 * Professional UK address autocomplete.
 *
 * - Custom React-rendered dropdown (we own the input + list, not Google).
 * - Restricted to UK postcodes / streets / buildings only — no vague POIs.
 * - Greater London bias for faster, more relevant first results.
 * - Mobile-first: 16px input font (no iOS zoom), large touch rows, smooth
 *   inline dropdown (no fullscreen overlay).
 * - Forces selection: free-typed text is reverted on blur unless the user
 *   picked a suggestion, so only real, resolved addresses reach the parent.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  testId,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [ready, setReady] = useState(false);
  const [resolving, setResolving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<unknown>(null);
  const debounceRef = useRef<number | null>(null);
  // Monotonic request id — every fetch increments this, and we only apply
  // a response if its id is still the latest. Prevents an older slow
  // network response from overwriting newer suggestions.
  const requestIdRef = useRef(0);
  // Tracks the latest query string we asked Google for, so we can ignore
  // responses that no longer match what's in the input.
  const latestQueryRef = useRef("");
  // Tracks whether the latest text in the input came from a real selection.
  // Used to revert free-typed text on blur — guarantees parent only ever
  // receives real, resolved addresses.
  const lastConfirmedRef = useRef<string>(value);

  /* Keep local query in sync if parent value changes (e.g. step reset). */
  useEffect(() => {
    setQuery(value);
    lastConfirmedRef.current = value;
  }, [value]);

  /* Load Google Maps once. */
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Click outside closes the dropdown. */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  /* Cleanup pending debounce on unmount. */
  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const locationBias = useMemo(
    () => ({
      center: LONDON_BIAS_CENTER,
      radius: LONDON_BIAS_RADIUS_M,
    }),
    [],
  );

  const fetchSuggestions = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!ready || trimmed.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      const places = window.google?.maps?.places;
      const SuggestionApi = places?.AutocompleteSuggestion;
      const TokenCtor = places?.AutocompleteSessionToken;
      if (!SuggestionApi || !TokenCtor) return;
      const myId = ++requestIdRef.current;
      latestQueryRef.current = trimmed;
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new TokenCtor();
        }
        setLoading(true);
        const { suggestions: sugg } =
          await SuggestionApi.fetchAutocompleteSuggestions({
            input: trimmed,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ["gb"],
            includedPrimaryTypes: ADDRESS_PRIMARY_TYPES,
            locationBias,
            language: "en-GB",
            region: "gb",
          });
        // Drop stale responses: only apply if this is still the latest
        // in-flight request and the user hasn't typed something different.
        if (
          myId !== requestIdRef.current ||
          latestQueryRef.current !== trimmed
        ) {
          return;
        }
        setSuggestions(Array.isArray(sugg) ? sugg : []);
        setHighlight(0);
      } catch {
        if (myId === requestIdRef.current) setSuggestions([]);
      } finally {
        if (myId === requestIdRef.current) setLoading(false);
      }
    },
    [ready, locationBias],
  );

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setOpen(true);
    // Propagate the raw typed value to the parent immediately so manual
    // entry works without the user having to pick a Google suggestion.
    // We mark `hasStreetNumber: true` so the unit-number prompt isn't
    // forced on manually-typed addresses — we trust the user.
    // `hasFullPostcode` is derived from the text so the parent can
    // require a full UK postcode when one is missing.
    const hasFullPostcode = /\b[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}\b/i.test(q);
    onChange(q, { hasStreetNumber: true, hasFullPostcode });
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void fetchSuggestions(q);
    }, 180);
  };

  const handlePick = async (s: AutocompleteSuggestion) => {
    const pred = s.placePrediction;
    if (!pred) return;
    setResolving(true);
    setOpen(false);
    try {
      const place = pred.toPlace();
      await place.fetchFields({
        fields: ["formattedAddress", "displayName", "addressComponents"],
      });
      const full = buildFullAddress(place);
      const finalText =
        full ||
        pred.text?.text ||
        [pred.mainText?.text, pred.secondaryText?.text]
          .filter(Boolean)
          .join(", ");
      const hasStreetNumber = Boolean(
        pick(place.addressComponents, "street_number"),
      );
      const hasFullPostcode = /\b[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}\b/i.test(finalText);
      if (finalText) {
        setQuery(finalText);
        lastConfirmedRef.current = finalText;
        onChange(finalText, { hasStreetNumber, hasFullPostcode });
      }
      setSuggestions([]);
      // End the autocomplete session — next keystroke starts a new one.
      sessionTokenRef.current = null;
      // Drop focus so mobile keyboard closes after picking.
      inputRef.current?.blur();
    } catch {
      // Do NOT propagate the prediction's short label as a "confirmed"
      // address — it isn't a normalised, verified UK address. Snap the
      // input back to the last confirmed value so the parent never holds
      // an unverified string, and reopen the dropdown so the user can
      // try again.
      setQuery(lastConfirmedRef.current);
      setOpen(true);
    } finally {
      setResolving(false);
    }
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (!open) setOpen(true);
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(suggestions.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && suggestions[highlight]) {
        e.preventDefault();
        void handlePick(suggestions[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleBlur = () => {
    // Defer so a click on a suggestion can fire first. We deliberately
    // do NOT snap the input back to the last picked suggestion any more —
    // manual entry is allowed, and free-typed text is already propagated
    // to the parent by handleQueryChange.
    window.setTimeout(() => {
      setOpen(false);
    }, 180);
  };

  const handleClear = () => {
    setQuery("");
    lastConfirmedRef.current = "";
    onChange("");
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown =
    open && (loading || suggestions.length > 0 || query.trim().length >= 2);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={handleBlur}
          placeholder={placeholder ?? "Start typing postcode or address..."}
          className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          data-testid={testId}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={testId ? `${testId}-listbox` : undefined}
        />
        {(resolving || (loading && open)) && (
          <Loader2 className="w-4 h-4 text-purple-500 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
        )}
        {!resolving && !(loading && open) && query && (
          <button
            type="button"
            onMouseDown={(e) => {
              // Prevent the input from blurring before the click registers.
              e.preventDefault();
            }}
            onClick={handleClear}
            aria-label="Clear address"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            data-testid={testId ? `${testId}-clear` : undefined}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id={testId ? `${testId}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto py-1"
        >
          {loading && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching addresses…
            </li>
          )}
          {!loading && suggestions.length === 0 && query.trim().length >= 2 && (
            <li className="px-4 py-3 text-sm text-gray-500">
              No matching addresses found.
            </li>
          )}
          {suggestions.map((s, i) => {
            const pred = s.placePrediction;
            const main = pred?.mainText?.text ?? pred?.text?.text ?? "";
            const sec = pred?.secondaryText?.text ?? "";
            const active = i === highlight;
            return (
              <li
                key={pred?.placeId ?? i}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  // Prevent input blur from cancelling the selection.
                  e.preventDefault();
                  void handlePick(s);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`px-4 py-3 cursor-pointer flex items-start gap-2.5 border-b border-gray-50 last:border-b-0 ${
                  active ? "bg-purple-50" : "hover:bg-gray-50"
                }`}
                data-testid={
                  testId ? `${testId}-suggestion-${i}` : undefined
                }
              >
                <MapPin
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    active ? "text-purple-600" : "text-gray-400"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 leading-snug truncate">
                    {main}
                  </div>
                  {sec && (
                    <div className="text-xs text-gray-500 leading-snug truncate">
                      {sec}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!ready && !GOOGLE_KEY && (
        <p className="text-[11px] text-amber-600 mt-1.5">
          Address suggestions unavailable. Please enter the full address
          manually.
        </p>
      )}
    </div>
  );
}
