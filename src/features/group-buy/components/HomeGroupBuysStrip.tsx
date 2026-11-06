"use client";

import { useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Container, ScrollArrows, SectionHeader, ViewAllButton } from "@/components/ui";
import { fetchGroupBuys } from "../api/group-buy.api";
import type { GroupBuyListResponse } from "../api/group-buy.schemas";
import { clockOffsetFrom } from "../lib/group-buy-format";
import { GroupBuyCard } from "./GroupBuyCard";

interface HomeGroupBuysStripProps {
  initial: GroupBuyListResponse;
}

const STRIP_SIZE = 8;

/**
 * The open groups on the home page. Drawn from the server render (no layout
 * jump), then read again in the browser: the home is cached for a minute,
 * the counts and the countdowns must not be.
 */
export function HomeGroupBuysStrip({ initial }: HomeGroupBuysStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const query = useQuery({
    queryKey: ["group-buys", "home"],
    queryFn: () => fetchGroupBuys({ sort: "trending", perPage: STRIP_SIZE }),
    initialData: initial,
    initialDataUpdatedAt: 0, // read again at once: the page itself may be a minute old
    refetchInterval: 60_000,
  });

  const items = query.data.data.items;
  if (items.length === 0) return null;
  const offset = query.dataUpdatedAt > 0 ? clockOffsetFrom(query.data.server_now, query.dataUpdatedAt) : 0;

  return (
    <Container as="section" className="pt-8" aria-label="Achats groupés en cours">
      <SectionHeader
        title="Achats groupés en cours"
        subtitle="Rejoignez un groupe : plus on est nombreux, moins on paie."
        action={
          <div className="flex items-center gap-3">
            <ViewAllButton label="Tous les groupes" href="/achats-groupes" />
            <div className="hidden sm:block">
              <ScrollArrows scrollRef={scrollRef} />
            </div>
          </div>
        }
      />
      <div ref={scrollRef} className="-mx-4 flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2 scrollbar-hide sm:gap-4 lg:mx-0 lg:px-0">
        {items.map((group) => (
          <GroupBuyCard key={group.code} group={group} offset={offset} className="w-[280px] flex-shrink-0 sm:w-[300px]" />
        ))}
        <Link
          href="/achats-groupes"
          className="flex w-[160px] flex-shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-50/50 p-4 text-center text-sm font-semibold text-primary hover:bg-primary-50"
        >
          <Users size={22} aria-hidden="true" />
          Voir tous les groupes ouverts
        </Link>
      </div>
    </Container>
  );
}
