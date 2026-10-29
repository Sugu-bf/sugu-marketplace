"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildSupplierListingUrl,
  type SupplierListingState,
} from "@/features/supplier/utils/queryState";

/**
 * Sort, search and "next page" controls of the vendor listings (/stores and
 * /fournisseurs), both read from GET /api/v1/vendors.
 *
 * That endpoint pages with a cursor and gives no total: the listing moves
 * forward page by page and never shows a count or page numbers it does not
 * have.
 */

const SORT_OPTIONS: { value: SupplierListingState["sort"]; label: string }[] = [
  { value: "popular", label: "Trier : populaires" },
  { value: "newest", label: "Plus récents" },
  { value: "top_rated", label: "Mieux notés" },
];

interface VendorListingToolbarProps {
  basePath: string;
  state: SupplierListingState;
  searchPlaceholder: string;
  /** Pending navigation dims the listing. */
  children: React.ReactNode;
}

export function VendorListingToolbar({ basePath, state, searchPlaceholder, children }: VendorListingToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(state.q);

  const go = (next: Partial<SupplierListingState>) => {
    // A new sort or search starts from the first page.
    const url = buildSupplierListingUrl({ sort: state.sort, q: state.q, ...next, cursor: null }, basePath);
    startTransition(() => router.push(url, { scroll: false }));
  };

  return (
    <div className={cn("transition-opacity duration-200", isPending ? "opacity-60" : "opacity-100")}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 mb-4 animate-fade-slide-up">
        <select
          aria-label="Trier"
          className="rounded-lg border border-border px-3 py-2 text-sm bg-white text-foreground focus:outline-none focus:border-primary"
          value={state.sort}
          onChange={(e) => go({ sort: e.target.value as SupplierListingState["sort"] })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: searchValue.trim() });
          }}
          className="relative"
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchPlaceholder}
            maxLength={200}
            className="rounded-full border border-border bg-white pl-9 pr-4 py-2 text-sm w-[220px] focus:outline-none focus:border-primary transition-colors"
          />
        </form>
      </div>

      {children}
    </div>
  );
}

interface VendorListingPagerProps {
  basePath: string;
  state: SupplierListingState;
  nextCursor: string | null;
  nextLabel: string;
}

export function VendorListingPager({ basePath, state, nextCursor, nextLabel }: VendorListingPagerProps) {
  if (!nextCursor && !state.cursor) return null;

  return (
    <nav aria-label="Pagination" className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
      {state.cursor ? (
        <Link
          href={buildSupplierListingUrl({ sort: state.sort, q: state.q, cursor: null }, basePath)}
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Revenir au début
        </Link>
      ) : (
        <span />
      )}
      {nextCursor && (
        <Link
          href={buildSupplierListingUrl({ sort: state.sort, q: state.q, cursor: nextCursor }, basePath)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          {nextLabel}
          <ArrowRight size={14} />
        </Link>
      )}
    </nav>
  );
}
