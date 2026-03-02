"use client";

import { useState, useMemo } from "react";
import type { FaqItem } from "@/features/faq";
import { FaqAccordion, FaqSearch } from "@/features/faq/components/FaqAccordion";

interface FaqSectionProps {
  items: FaqItem[];
  categories: { category: string; slug: string; items: FaqItem[] }[];
}

/**
 * Interactive FAQ section with client-side search filtering.
 * Receives server-fetched data as props (SSR-friendly).
 */
export function FaqSection({ items, categories }: FaqSectionProps) {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;

    const q = search.toLowerCase().trim();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (faq) =>
            faq.question.toLowerCase().includes(q) ||
            faq.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [search, categories]);

  const totalResults = filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Search */}
      <FaqSearch value={search} onChange={setSearch} />

      {/* Results indicator */}
      {search.trim() && (
        <p className="text-xs text-muted-foreground">
          {totalResults === 0
            ? "Aucun résultat trouvé"
            : `${totalResults} résultat${totalResults > 1 ? "s" : ""} trouvé${totalResults > 1 ? "s" : ""}`}
        </p>
      )}

      {/* FAQ by category */}
      {filteredCategories.length > 0 ? (
        filteredCategories.map((cat) => (
          <div key={cat.slug} className="mb-6 last:mb-0">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {cat.category}
            </h3>
            <FaqAccordion items={cat.items} />
          </div>
        ))
      ) : (
        !search.trim() && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">
              Aucune question fréquente pour le moment.
            </p>
          </div>
        )
      )}
    </div>
  );
}
