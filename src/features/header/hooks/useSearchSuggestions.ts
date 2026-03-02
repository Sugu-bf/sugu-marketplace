"use client";

/**
 * useSearchSuggestions — live product suggestions as-you-type.
 *
 * Strategy:
 * - Debounced (300ms) client-side fetch to /api/v1/web-products?search=...&per_page=5
 * - AbortController cancels in-flight requests on new input
 * - Minimum 2 characters before firing
 * - Returns product name + slug + thumbnail + price for the dropdown
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api/config";

// ─── Types ───────────────────────────────────────────────────

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  currency: string;
}

interface UseSearchSuggestionsReturn {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  clear: () => void;
}

// ─── Constants ───────────────────────────────────────────────

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 5;
const FALLBACK_THUMBNAIL = "https://cdn.sugu.pro/s/theme/fallback-product.png";

// ─── Hook ────────────────────────────────────────────────────

export function useSearchSuggestions(query: string): UseSearchSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clear = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    // Cancel in-flight
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    // Below minimum → clear
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Cancel previous
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams({
          search: trimmed,
          per_page: String(MAX_RESULTS),
        });
        const url = `${API_BASE_URL}/api/v1/web-products?${params}`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();

        if (!controller.signal.aborted && json.success && json.data?.products) {
          const items: SearchSuggestion[] = json.data.products
            .slice(0, MAX_RESULTS)
            .map((p: Record<string, unknown>) => ({
              id: String(p.id ?? ""),
              name: String(p.name ?? ""),
              slug: String(p.slug ?? ""),
              thumbnail: (p.thumbnail as string) || FALLBACK_THUMBNAIL,
              price: Number(p.price ?? 0),
              currency: String(p.currency ?? "XOF"),
            }));

          setSuggestions(items);
          setError(null);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // Expected
        console.error("[SearchSuggestions] Fetch failed:", (err as Error).message);
        setError("Erreur lors du chargement des suggestions");
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    // Cleanup on unmount / query change
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [query]);

  return { suggestions, isLoading, error, clear };
}
