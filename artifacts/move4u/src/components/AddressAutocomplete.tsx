import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  testId?: string;
}

/**
 * Lightweight UK address autocomplete.
 *
 * Uses postcodes.io (free, no key required, government-backed) to suggest UK
 * postcodes as the user types. Users can also free-type a full street address
 * — suggestions are an aid, not a hard validation.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  testId,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced postcode autocomplete
  useEffect(() => {
    const q = value.trim();
    // Postcodes are 2+ chars and start with a letter
    if (q.length < 2 || !/^[A-Za-z]/.test(q)) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.postcodes.io/postcodes/${encodeURIComponent(q)}/autocomplete`,
        );
        if (!res.ok) throw new Error("autocomplete failed");
        const json = await res.json();
        if (cancelled) return;
        const list: string[] = Array.isArray(json?.result) ? json.result : [];
        setSuggestions(list);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const showDropdown = open && (suggestions.length > 0 || loading);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "Start typing postcode or address..."}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        data-testid={testId}
        autoComplete="off"
      />
      {showDropdown && (
        <ul
          className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-64 overflow-y-auto"
          data-testid={testId ? `${testId}-suggestions` : undefined}
        >
          {loading && suggestions.length === 0 && (
            <li className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching UK postcodes…
            </li>
          )}
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => {
                  onChange(s);
                  setSuggestions([]);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-gray-400 mt-1.5">
        UK postcode suggestions appear as you type. You can also enter a full street address.
      </p>
    </div>
  );
}
