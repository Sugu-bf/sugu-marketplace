"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { fetchGroupBuyOpenCount } from "../api/group-buy.api";

interface GroupBuyNavLinkProps {
  variant: "header" | "menu";
  onNavigate?: () => void;
}

/**
 * "Achats groupés" in the navigation, with the number of groups open right
 * now: a reason to come back and look. The count is public and cached.
 */
export function GroupBuyNavLink({ variant, onNavigate }: GroupBuyNavLinkProps) {
  const { data: openCount } = useQuery({
    queryKey: ["group-buys", "open-count"],
    queryFn: fetchGroupBuyOpenCount,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: false,
  });
  const count = typeof openCount === "number" && openCount > 0 ? openCount : null;
  const label = count ? `Achats groupés, ${count} groupe${count > 1 ? "s" : ""} ouvert${count > 1 ? "s" : ""}` : "Achats groupés";

  if (variant === "menu") {
    return (
      <Link
        href="/achats-groupes"
        onClick={onNavigate}
        aria-label={label}
        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:bg-primary-50 hover:text-primary"
      >
        <span className="inline-flex items-center gap-2">
          <Users size={16} aria-hidden="true" /> Achats groupés
        </span>
        {count && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">{count}</span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/achats-groupes"
      aria-label={label}
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-white transition-all duration-200 hover:text-white/90"
    >
      Achats groupés
      {count && (
        <span className="min-w-[20px] rounded-full bg-accent px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-gray-900 tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
