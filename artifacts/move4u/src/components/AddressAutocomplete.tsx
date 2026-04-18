import { useEffect, useRef } from "react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  testId?: string;
}

interface PlaceResult {
  formatted_address?: string;
  name?: string;
}

interface PlacesAutocomplete {
  addListener: (event: string, cb: () => void) => void;
  getPlace: () => PlaceResult;
}

interface PlacesAutocompleteOptions {
  componentRestrictions?: { country: string | string[] };
  types?: string[];
  fields?: string[];
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: PlacesAutocompleteOptions,
          ) => PlacesAutocomplete;
        };
        event?: {
          clearInstanceListeners: (instance: unknown) => void;
        };
      };
    };
    __movefourGmapsLoader?: Promise<void>;
  }
}

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined;

/** Load Google Maps JS once across the whole app. */
function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__movefourGmapsLoader) return window.__movefourGmapsLoader;
  if (!GOOGLE_KEY) {
    return Promise.reject(new Error("Google Places API key missing"));
  }
  window.__movefourGmapsLoader = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("movefour-gmaps-script") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Maps script error")));
      return;
    }
    const script = document.createElement("script");
    script.id = "movefour-gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_KEY,
    )}&libraries=places&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Maps script error"));
    document.head.appendChild(script);
  });
  return window.__movefourGmapsLoader;
}

/**
 * Google Places-powered UK address autocomplete.
 *
 * Renders a normal input that's enhanced by Google's Places library when the
 * Maps JS API is available. Restricted to UK addresses. The browser-side key
 * is loaded from VITE_GOOGLE_PLACES_API_KEY — keep it referrer-restricted in
 * Google Cloud Console.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  testId,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!inputRef.current) return;
    let acInstance: PlacesAutocomplete | null = null;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return;
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "gb" },
          types: ["address"],
          fields: ["formatted_address", "name"],
        });
        acInstance = ac;
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const text = place.formatted_address || place.name || "";
          if (text) onChangeRef.current(text);
        });
      })
      .catch(() => {
        // Silent — input still functions as a plain text input.
      });

    return () => {
      cancelled = true;
      if (acInstance && window.google?.maps?.event) {
        try {
          window.google.maps.event.clearInstanceListeners(acInstance);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Start typing UK address..."}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        data-testid={testId}
        autoComplete="off"
      />
      {!GOOGLE_KEY && (
        <p className="text-[11px] text-amber-600 mt-1.5">
          Address suggestions unavailable. Please enter the full address manually.
        </p>
      )}
    </div>
  );
}
