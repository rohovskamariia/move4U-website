import { useEffect, useRef, useState } from "react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  testId?: string;
}

interface PlaceLike {
  formattedAddress?: string;
  displayName?: string;
  fetchFields: (opts: { fields: string[] }) => Promise<unknown>;
  toJSON: () => Record<string, unknown>;
}

interface PlacePrediction {
  toPlace: () => PlaceLike;
}

interface GmpSelectEvent extends Event {
  placePrediction: PlacePrediction;
}

interface PlaceAutocompleteElementOptions {
  includedRegionCodes?: string[];
  includedPrimaryTypes?: string[];
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

/**
 * Google Places-powered UK address autocomplete using the modern
 * `PlaceAutocompleteElement` web component.
 *
 * The element is rendered inside a host div and styled via CSS variables to
 * match the rest of the form. Restricted to UK addresses. The browser-side
 * key is loaded from VITE_GOOGLE_PLACES_API_KEY — keep it referrer-restricted
 * in Google Cloud Console.
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
  const valueRef = useRef(value);
  valueRef.current = value;

  const [enhanced, setEnhanced] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;
    let cancelled = false;
    let element: HTMLElement | null = null;
    let handler: ((e: Event) => void) | null = null;
    let inputObserver: MutationObserver | null = null;

    (async () => {
      try {
        console.log("[AA] start, key?", !!GOOGLE_KEY);
        await loadGoogleMaps();
        console.log("[AA] maps ok, cancelled?", cancelled, "host?", !!hostRef.current);
        if (cancelled || !hostRef.current) return;
        const lib = window.google?.maps?.places;
        console.log("[AA] places obj keys:", lib ? Object.keys(lib).slice(0,20).join(",") : "null");
        if (!lib?.PlaceAutocompleteElement) {
          throw new Error("PlaceAutocompleteElement not available");
        }

        const el = new lib.PlaceAutocompleteElement({
          includedRegionCodes: ["gb"],
          includedPrimaryTypes: ["geocode"],
        });
        element = el;
        if (placeholder) {
          el.setAttribute("placeholder", placeholder);
        }
        if (testId) {
          el.setAttribute("data-testid", testId);
        }
        el.style.width = "100%";

        // Mirror current value into the inner input once it's available, so
        // navigation back to a step shows the previously chosen address.
        const syncValue = () => {
          const inner = el.querySelector("input");
          if (inner instanceof HTMLInputElement && valueRef.current) {
            inner.value = valueRef.current;
          }
        };
        inputObserver = new MutationObserver(() => syncValue());
        inputObserver.observe(el, { childList: true, subtree: true });

        handler = (e) => {
          const evt = e as GmpSelectEvent;
          const place = evt.placePrediction?.toPlace?.();
          if (!place) return;
          place
            .fetchFields({ fields: ["formattedAddress", "displayName"] })
            .then(() => {
              const text = place.formattedAddress || place.displayName || "";
              if (text) onChangeRef.current(text);
            })
            .catch(() => {
              /* ignore */
            });
        };
        el.addEventListener("gmp-select", handler);

        // Fallback: also handle text input changes so the parent stays in sync
        // even if the user types without picking a suggestion.
        const inputHandler = (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target?.value != null) onChangeRef.current(target.value);
        };
        el.addEventListener("input", inputHandler);

        hostRef.current.appendChild(el);
        setEnhanced(true);
        // Initial sync after first mount
        setTimeout(syncValue, 50);
      } catch (err) {
        console.warn("[AA] failed:", err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (inputObserver) inputObserver.disconnect();
      if (element) {
        try {
          element.remove();
        } catch {
          /* ignore */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          placeholder={placeholder ?? "Start typing UK address..."}
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
