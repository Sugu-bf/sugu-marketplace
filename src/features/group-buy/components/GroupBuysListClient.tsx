"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { fetchGroupBuys, type GroupBuySort } from "../api/group-buy.api";
import type { GroupBuyListResponse } from "../api/group-buy.schemas";
import { clockOffsetFrom } from "../lib/group-buy-format";
import { GROUP_BUY_SORTS } from "../lib/group-buy-sorts";
import { GroupBuyCard } from "./GroupBuyCard";

const PER_PAGE = 12;
const REFRESH_MS = 30_000;

interface GroupBuysListClientProps {
  sort: GroupBuySort;
  initial: GroupBuyListResponse;
}

/**
 * The open groups, kept fresh while the page is in front (every 30 s, paused
 * when the tab is hidden), with "Voir plus" for the next ones.
 */
export function GroupBuysListClient({ sort, initial }: GroupBuysListClientProps) {
  const query = useInfiniteQuery({
    queryKey: ["group-buys", "list", sort],
    queryFn: ({ pageParam }) => fetchGroupBuys({ sort, page: pageParam, perPage: PER_PAGE }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.data.has_more ? pages.length + 1 : undefined),
    initialData: { pages: [initial], pageParams: [1] },
    // The server render may come from a cache: dated by its own server time,
    // an old copy is read again at once, a fresh one is kept.
    initialDataUpdatedAt: Date.parse(initial.server_now) || 0,
    refetchInterval: REFRESH_MS,
    staleTime: 15_000,
  });

  const pages = query.data?.pages ?? [initial];
  const items = pages.flatMap((page) => page.data.items);
  const seen = new Set<string>();
  const unique = items.filter((item) => (seen.has(item.code) ? false : (seen.add(item.code), true)));
  const offset = clockOffsetFrom(pages[0]?.server_now, query.dataUpdatedAt || undefined);

  return (
    <div>
      <nav className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide" aria-label="Trier les groupes">
        {GROUP_BUY_SORTS.map((option) => (
          <Link
            key={option.value}
            href={option.value === "trending" ? "/achats-groupes" : `/achats-groupes?sort=${option.value}`}
            scroll={false}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              option.value === sort
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-foreground hover:border-primary/40 hover:text-primary",
            )}
            aria-current={option.value === sort ? "page" : undefined}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      {unique.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-6 py-12 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary">
            <Users size={24} aria-hidden="true" />
          </span>
          <p className="mt-3 text-base font-semibold text-foreground">Aucun groupe ouvert pour le moment</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-foreground/70">
            Les produits vendus avec des prix de gros proposent « Acheter en groupe » sur leur fiche. Lancez le premier
            groupe et partagez-le.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Search size={16} aria-hidden="true" /> Parcourir les produits
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unique.map((group) => (
              <li key={group.code}>
                <GroupBuyCard group={group} offset={offset} className="h-full" />
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                pill
                onClick={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage && <Loader2 size={16} className="animate-spin" />}
                Voir plus de groupes
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
