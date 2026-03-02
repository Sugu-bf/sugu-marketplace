"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import SearchDropdown from "./SearchDropdown";
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "../state/recentSearches.cookie";
import { useSearchSuggestions } from "../hooks/useSearchSuggestions";

interface SearchBarProps {
  popularSearches: string[];
  className?: string;
}

/**
 * SearchBar — search input with dropdown (recent + popular + live suggestions).
 *
 * Desktop: rounded-left input + "Rechercher" button.
 * Manages search focus state, recent searches cookie, live suggestions, and navigation.
 */
export default function SearchBar({ popularSearches, className }: SearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const initializedRef = useRef(false);

  // Live search suggestions
  const { suggestions, isLoading: suggestionsLoading, clear: clearSuggestions } =
    useSearchSuggestions(focused ? query : "");

  // Load recent searches from cookie lazily (on first focus)
  const ensureRecentLoaded = useCallback(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      setRecentSearches(getRecentSearches());
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focused) {
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focused]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;

      setRecentSearches(addRecentSearch(trimmed));
      setFocused(false);
      clearSuggestions();
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [query, router, clearSuggestions]
  );

  const handleSelectTerm = useCallback(
    (term: string) => {
      setQuery(term);
      setRecentSearches(addRecentSearch(term));
      setFocused(false);
      clearSuggestions();
      router.push(`/search?q=${encodeURIComponent(term)}`);
    },
    [router, clearSuggestions]
  );

  const handleSelectProduct = useCallback(
    (slug: string) => {
      setFocused(false);
      clearSuggestions();
      // Save current query as recent search
      const trimmed = query.trim();
      if (trimmed) {
        setRecentSearches(addRecentSearch(trimmed));
      }
      router.push(`/product/${slug}`);
    },
    [query, router, clearSuggestions]
  );

  const handleRemoveRecent = useCallback((term: string) => {
    setRecentSearches(removeRecentSearch(term));
  }, []);

  const handleClearAllRecent = useCallback(() => {
    setRecentSearches(clearRecentSearches());
  }, []);

  return (
    <div ref={containerRef} className={cn("relative flex-1 max-w-xl", className)}>
      <form onSubmit={handleSubmit} className="flex items-center" role="search">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { ensureRecentLoaded(); setFocused(true); }}
            placeholder="Rechercher par nom de produit"
            className="w-full rounded-l-full border-2 border-r-0 border-white/20 bg-white pl-11 pr-5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-white/40 transition-all duration-200"
            aria-label="Rechercher des produits"
            aria-autocomplete="list"
            autoComplete="off"
            id="header-search-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); clearSuggestions(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors"
              aria-label="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-r-full bg-accent px-5 py-2.5 border-2 border-accent text-sm font-bold text-foreground transition-all duration-200 hover:bg-accent-dark active:scale-95 whitespace-nowrap"
          id="header-search-button"
        >
          Rechercher
        </button>
      </form>

      {/* Search Dropdown */}
      {focused && (
        <SearchDropdown
          recentSearches={recentSearches}
          popularSearches={popularSearches}
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          query={query}
          onSelectTerm={handleSelectTerm}
          onSelectProduct={handleSelectProduct}
          onRemoveRecent={handleRemoveRecent}
          onClearAllRecent={handleClearAllRecent}
        />
      )}
    </div>
  );
}
