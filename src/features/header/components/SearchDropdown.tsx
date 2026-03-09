"use client";

import { useCallback } from "react";
import { X, Trash2, Sparkles, Loader2, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/constants";
import type { SearchSuggestion } from "../hooks/useSearchSuggestions";

interface SearchDropdownProps {
  recentSearches: string[];
  popularSearches: string[];
  /** Live product suggestions from API */
  suggestions?: SearchSuggestion[];
  /** Whether suggestions are loading */
  suggestionsLoading?: boolean;
  /** Current query (to show "see all results" link) */
  query?: string;
  onSelectTerm: (term: string) => void;
  onSelectProduct?: (slug: string) => void;
  onRemoveRecent: (term: string) => void;
  onClearAllRecent: () => void;
  className?: string;
}

/**
 * Search Dropdown — shown when the search input is focused.
 *
 * Displays (in priority order):
 * 1. Live product suggestions (when typing ≥ 2 chars)
 * 2. Recent searches (with remove/clear actions)
 * 3. Popular searches (from API / category fallback)
 *
 * Purely presentational — state managed by parent.
 */
export default function SearchDropdown({
  recentSearches,
  popularSearches,
  suggestions = [],
  suggestionsLoading = false,
  query = "",
  onSelectTerm,
  onSelectProduct,
  onRemoveRecent,
  onClearAllRecent,
  className,
}: SearchDropdownProps) {
  const handleRemoveRecent = useCallback(
    (e: React.MouseEvent, term: string) => {
      e.stopPropagation();
      onRemoveRecent(term);
    },
    [onRemoveRecent]
  );

  const hasRecent = recentSearches.length > 0;
  const hasPopular = popularSearches.length > 0;
  const hasSuggestions = suggestions.length > 0;
  const isTyping = query.trim().length >= 2;

  // When user is typing → show suggestions (or loading)
  // When idle → show recent + popular
  const showSuggestionsMode = isTyping;

  if (!showSuggestionsMode && !hasRecent && !hasPopular) return null;

  return (
    <div
      className={cn(
        "absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white border border-gray-100 shadow-xl p-5 z-50 animate-fade-slide-down",
        className
      )}
      role="region"
      aria-label="Suggestions de recherche"
    >
      {showSuggestionsMode ? (
        /* ══════════════════════════════════════════════════
           LIVE SUGGESTIONS MODE (typing ≥ 2 chars)
           ══════════════════════════════════════════════════ */
        <div>
          {/* Loading state */}
          {suggestionsLoading && !hasSuggestions && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span>Recherche en cours…</span>
            </div>
          )}

          {/* Product suggestions */}
          {hasSuggestions && (
            <div>
              <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Produits suggérés
              </h4>
              <ul className="space-y-1">
                {suggestions.map((product) => (
                  <li key={product.id}>
                    <button
                      onClick={() => {
                        if (onSelectProduct) {
                          onSelectProduct(product.slug);
                        } else {
                          onSelectTerm(product.name);
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-200 hover:bg-primary-50 group"
                    >
                      {/* Thumbnail */}
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        <img
                          src={product.thumbnail || undefined}
                          alt={product.name}
                          className="h-full w-full object-contain p-0.5"
                          loading="lazy"
                        />
                      </div>
                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        {product.highlightName ? (
                          /* Typesense native highlight — <mark> tags, XSS-sanitized by backend */
                          <p
                            className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-150 [&_mark]:font-bold [&_mark]:text-primary [&_mark]:bg-transparent"
                            dangerouslySetInnerHTML={{ __html: product.highlightName }}
                          />
                        ) : (
                          /* Client-side fallback highlight */
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-150">
                            {highlightMatch(product.name, query)}
                          </p>
                        )}
                        <p className="text-xs font-semibold text-primary mt-0.5">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      {/* Arrow */}
                      <ArrowRight
                        size={14}
                        className="flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      />
                    </button>
                  </li>
                ))}
              </ul>

              {/* See all results link */}
              <button
                onClick={() => onSelectTerm(query.trim())}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary-50 hover:border-primary/30"
              >
                <Search size={13} />
                Voir tous les résultats pour &quot;{query.trim()}&quot;
              </button>
            </div>
          )}

          {/* No results (done loading, nothing found) */}
          {!suggestionsLoading && !hasSuggestions && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Search size={20} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucun produit trouvé pour &quot;{query.trim()}&quot;
              </p>
              <button
                onClick={() => onSelectTerm(query.trim())}
                className="mt-1 text-xs font-medium text-primary underline underline-offset-2 hover:text-primary-dark transition-colors"
              >
                Lancer la recherche complète
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════
           IDLE MODE (recent + popular)
           ══════════════════════════════════════════════════ */
        <>
          {/* ── Recent Searches ── */}
          {hasRecent && (
            <div className={cn(hasPopular && "mb-5")}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">
                  Recherches récentes
                </h4>
                <button
                  onClick={onClearAllRecent}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
                  title="Tout effacer"
                  aria-label="Effacer toutes les recherches récentes"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <span
                    key={term}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all duration-200 hover:border-primary/30 hover:bg-primary-50"
                  >
                    <button
                      onClick={() => onSelectTerm(term)}
                      className="outline-none"
                      aria-label={`Rechercher ${term}`}
                    >
                      {term}
                    </button>
                    <button
                      onClick={(e) => handleRemoveRecent(e, term)}
                      className="text-muted-foreground hover:text-primary transition-colors duration-150 outline-none"
                      aria-label={`Supprimer ${term} des recherches récentes`}
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Popular Searches ── */}
          {hasPopular && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <h4 className="text-sm font-semibold text-foreground">
                  Recherches populaires
                </h4>
                <Sparkles size={14} className="text-accent" />
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => onSelectTerm(term)}
                    className="rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-foreground/80 transition-all duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary"
                    aria-label={`Rechercher ${term}`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Highlight matching text in product name.
 * Returns React nodes with bold matching portion.
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.trim().toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);

  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.trim().length);
  const after = text.slice(idx + query.trim().length);

  return (
    <>
      {before}
      <span className="font-bold text-primary">{match}</span>
      {after}
    </>
  );
}
