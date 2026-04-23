"use client";

import { useEffect, useRef, useState } from "react";
import { geocode, type GeocodeResult } from "./geocoding";

export function useGeocode(query: string, debounceMs = 500) {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      setError(null);
      try {
        const r = await geocode(q, ctrl.signal);
        if (!ctrl.signal.aborted) setResults(r);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Geocoding fehlgeschlagen");
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { results, loading, error };
}
