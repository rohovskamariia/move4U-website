import { useEffect, useRef, useState } from "react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  testId?: string;
}

interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface PlaceLike {
  formattedAddress?: string;
  displayName?: string;
  addressComponents?: AddressComponent[];
  fetchFields: (opts: { fields: string[] }) => Promise<unknown>;
  toJSON?: () => Record<string, unknown>;
}

interface PlacePrediction {
  toPlace: () => PlaceLike;
}

interface GmpSelectEvent extends Event {
  placePrediction?: PlacePrediction;
  place?: PlaceLike;
}

interface LatLngLiteral {
  lat: number;
  lng: number;
}

interface PlaceAutocompleteElementOptions {
  includedRegionCodes?: string[];
  includedPrimaryTypes?: string[];
  locationBias?: { north: number; south: number; east: number; west: number } | LatLngLiteral;
}

interface PlaceAutocompleteElementCtor {
  new (options?: PlaceAutocompleteElementOptions): HTMLElement;
}

interface PlacesLibrary {
  PlaceAutocompleteElement: PlaceAutocompleteElementCtor;
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

/** Greater London bounding box — used to bias suggestions toward London first. */
const LONDON_BIAS = {
  north: 51.6919,
  south: 51.2868,
  east: 0.3340,
  west: -0.5103,
};

/** Load Google Maps JS (with places library) once across the whole app. */
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
    )}&v=weekly&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Maps script error"));
    document.head.appendChild(script);
  });
  return window.__movefourGmapsLoader;
}

/** Pull a single component value out of Google's address_components array. */
function pick(components: AddressComponent[] | undefined, type: string): string {
  if (!components) return "";
  const c = components.find((x) => x.types?.includes(type));
  return c?.longText || c?.shortText || "";
}

/** Build a clean full UK address from Place data, falling back to formattedAddress. */
function buildFullAddress(place: PlaceLike): string {
  const components = place.addressComponents;
  if (components && components.length) {
    const streetNumber = pick(components, "street_number");
    const route = pick(components, "route");
    const postalTown =
      pick(components, "postal_town") ||
      pick(components, "locality") ||
      pick(components, "administrative_area_level_2");
    const postcode = pick(components, "postal_code");
    const country = pick(components, "country") || "UK";
    const street = [streetNumber, route].filter(Boolean).join(" ");
    const cityPostcode = [postalTown, postcode].filter(Boolean).join(" ");
    const parts = [street, cityPostcode, country].filter(Boolean);
    if (parts.length) return parts.join(", ");
  }
  return place.formattedAddress || place.displayName || "";
}

/**
 * Google Places-powered UK address autocomplete using the modern
 * `PlaceAutocompleteElement` web component.
 *
 * Restricted to UK addresses, biased toward Greater London. On selection we
 * fetch full Place details and build a full address string from
 * `addressComponents` so the parent always receives a complete address such as
 * `233 Alexandra Park Rd, London N22 7BJ, UK` — even for postcode-only searches.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  testId,
}: AddressAutocompleteProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [enhanced, setEnhanced] = useState(false);
  const [failed, setFailed] = useState(false);
  // When a saved address already exists (e.g. user navigated back to this
  // step), show a read-only summary card instead of the autocomplete element.
  // Google's <gmp-place-autocomplete> owns its internal input state and does
  // not reliably accept programmatic prefilling, so we show a "Change" action
  // to reopen the autocomplete when the user wants to edit the address.
  const [editing, setEditing] = useState(!value);

  useEffect(() => {
    if (!hostRef.current || !editing) return;
    let cancelled = false;
    let element: HTMLElement | null = null;

    (async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !hostRef.current) return;
        const lib = window.google?.maps?.places;
        if (!lib?.PlaceAutocompleteElement) {
          throw new Error("PlaceAutocompleteElement not available");
        }

        const el = new lib.PlaceAutocompleteElement({
          includedRegionCodes: ["gb"],
          includedPrimaryTypes: ["geocode"],
          locationBias: LONDON_BIAS,
        });
        element = el;
        if (placeholder) {
          el.setAttribute("placeholder", placeholder);
        }
        if (testId) {
          el.setAttribute("data-testid", testId);
        }
        el.style.width = "100%";

        const handleSelect = async (e: Event) => {
          const evt = e as GmpSelectEvent;
          const place = evt.placePrediction?.toPlace?.() ?? evt.place;
          if (!place) return;
          try {
            await place.fetchFields({
              fields: ["formattedAddress", "displayName", "addressComponents"],
            });
          } catch {
            /* fall through to whatever fields are available */
          }
          const full = buildFullAddress(place);
          if (full) {
            onChangeRef.current(full);
            // Mirror the full address back into the visible input so the user
            // sees the complete selected address (Google sometimes only puts a
            // shorter label after selection).
            const inner = el.querySelector("input");
            if (inner instanceof HTMLInputElement) {
              inner.value = full;
            }
          }
        };
        // Different versions of the API fire slightly different event names.
        el.addEventListener("gmp-select", handleSelect);
        el.addEventListener("gmp-placeselect", handleSelect);

        hostRef.current.appendChild(el);
        setEnhanced(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (element) {
        try {
          element.remove();
        } catch {
          /* ignore */
        }
      }
    };
    // Re-run when entering edit mode so the Google web component is mounted
    // when the user clicks "Change" on a previously-saved address. Parents
    // that need a fresh autocomplete (e.g. switching between pickup and
    // drop-off steps) should pass a unique `key` prop to remount the
    // component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // If a saved address exists and we're not in editing mode, render a
  // read-only summary card with a "Change" button. This guarantees that
  // navigating back to a previously-completed step always shows the saved
  // address — without fighting Google's web component over input ownership.
  if (!editing && value) {
    return (
      <div
        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 flex items-start justify-between gap-3"
        data-testid={testId}
      >
        <div className="text-sm text-gray-900 leading-snug break-words flex-1">
          {value}
        </div>
        <button
          type="button"
          onClick={() => {
            onChange("");
            setEditing(true);
          }}
          className="text-xs font-medium text-purple-700 hover:text-purple-900 underline underline-offset-2 shrink-0"
          data-testid={testId ? `${testId}-change` : undefined}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={hostRef}
        className="movefour-place-host w-full"
        data-enhanced={enhanced ? "true" : "false"}
      />
      {!enhanced && (
        <input
          ref={fallbackInputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Start typing postcode or address..."}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          data-testid={testId}
          autoComplete="off"
        />
      )}
      {failed && !GOOGLE_KEY && (
        <p className="text-[11px] text-amber-600 mt-1.5">
          Address suggestions unavailable. Please enter the full address manually.
        </p>
      )}
    </div>
  );
}
