"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, Loader2, PiggyBank, Rocket, ShoppingBag, UserPlus, Users, Wallet } from "lucide-react";
import { Badge, Button, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useToast } from "@/features/toast/toast-store";
import { fetchMyGroupBuys, openGroupBuyCheckout } from "../api/group-buy.api";
import type { MyGroupBuy, MyGroupBuyStanding, MyGroupBuyStats, MyGroupBuysResponse } from "../api/group-buy.schemas";
import { STATUS_LABELS, clockOffsetFrom, formatCentimes, refusalOf } from "../lib/group-buy-format";
import { GroupBuyThumb } from "./GroupBuyCard";
import { GroupBuyCountdown } from "./GroupBuyCountdown";
import { GroupBuyDeadline } from "./GroupBuyDeadline";
import { GroupBuyStandingCard } from "./GroupBuyStandingCard";

interface MyGroupBuysClientProps {
  stats: MyGroupBuyStats | null;
  initialActive: MyGroupBuysResponse | null;
  /** Level, ceiling and strikes; null when it could not be read. */
  standing?: MyGroupBuyStanding | null;
}

const STATUS_BADGE: Record<MyGroupBuy["status"], "success" | "secondary" | "warning" | "muted"> = {
  open: "secondary",
  confirming: "warning",
  locked: "success",
  failed: "muted",
  finished: "muted",
  cancelled: "muted",
};

type Scope = "active" | "past";

const MEMBER_LABELS: Record<MyGroupBuy["my_membership"]["status"], string> = {
  reserved: "Place réservée",
  ordered: "Commandé",
  left: "Parti",
  expired: "Pas commandé à temps",
  removed: "Retiré",
};

/**
 * The member's status read with the group's: when a group fails or is
 * cancelled the server closes the places too, which says nothing about the
 * member.
 */
function memberLabel(group: Pick<MyGroupBuy, "status" | "my_membership">): string {
  const status = group.my_membership.status;
  if (group.status === "failed" && status === "expired") return "Palier non atteint";
  if (group.status === "cancelled" && status === "removed") return "Groupe annulé";
  return MEMBER_LABELS[status];
}

/** The customer's groups: what they saved, and what each group waits for. */
export function MyGroupBuysClient({ stats, initialActive, standing = null }: MyGroupBuysClientProps) {
  const [scope, setScope] = useState<Scope>("active");
  const router = useRouter();
  const toast = useToast();
  const [ordering, setOrdering] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["group-buys", "mine", scope],
    queryFn: () => fetchMyGroupBuys(scope),
    initialData: scope === "active" && initialActive ? initialActive : undefined,
    refetchInterval: scope === "active" ? 60_000 : false,
    staleTime: 15_000,
  });

  const items = query.data?.data.items ?? [];
  const offset = clockOffsetFrom(query.data?.server_now, query.dataUpdatedAt || undefined);

  const order = async (code: string) => {
    if (ordering) return;
    setOrdering(code);
    try {
      const sessionId = await openGroupBuyCheckout(code);
      router.push(`/checkout?session=${encodeURIComponent(sessionId)}`);
    } catch (err) {
      toast.error(refusalOf(err).message);
      setOrdering(null);
    }
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<PiggyBank size={18} />}
            label="Économisé grâce aux groupes"
            value={formatCentimes(stats.saved_amount)}
            highlight
          />
          <StatCard icon={<Users size={18} />} label="Groupes rejoints" value={String(stats.groups_joined)} />
          <StatCard icon={<Rocket size={18} />} label="Groupes lancés" value={String(stats.groups_launched)} />
          <StatCard icon={<UserPlus size={18} />} label="Personnes invitées" value={String(stats.people_invited)} />
        </div>
      )}

      {standing && <GroupBuyStandingCard standing={standing} />}

      <div className="flex gap-2" role="tablist" aria-label="Mes groupes">
        {(["active", "past"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={scope === value}
            onClick={() => setScope(value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              scope === value ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground hover:border-primary/40",
            )}
          >
            {value === "active" ? "En cours" : "Terminés"}
          </button>
        ))}
      </div>

      {query.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-border-light bg-white p-6 text-center text-sm text-foreground/70">
          Impossible de charger vos groupes.{" "}
          <button type="button" onClick={() => void query.refetch()} className="font-semibold text-primary hover:underline">
            Réessayer
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-6 py-10 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary">
            <Users size={24} aria-hidden="true" />
          </span>
          <p className="mt-3 text-base font-semibold text-foreground">
            {scope === "active" ? "Aucun groupe en cours" : "Aucun groupe terminé"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-foreground/70">
            Rejoignez un groupe ouvert : plus on est nombreux, moins on paie.
          </p>
          <Link
            href="/achats-groupes"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Voir les groupes ouverts <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((group) => (
            <MyGroupRow
              key={group.code}
              group={group}
              offset={offset}
              ordering={ordering === group.code}
              disabled={ordering !== null}
              onOrder={() => void order(group.code)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function MyGroupRow({
  group,
  offset,
  ordering,
  disabled,
  onOrder,
}: {
  group: MyGroupBuy;
  offset: number;
  ordering: boolean;
  disabled: boolean;
  onOrder: () => void;
}) {
  const mine = group.my_membership;
  const name = group.product?.name ?? "Produit";
  const confirming = group.status === "confirming";
  // Pays first, online, before the others: the row says so and how long is left.
  const payFirst = confirming && mine.status === "reserved" && mine.must_confirm === true && mine.can_order;
  const waiting = confirming && mine.status === "reserved" && !mine.must_confirm;

  return (
    <li className="rounded-2xl border border-border-light bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <GroupBuyThumb src={group.product?.image_url ?? null} alt={name} className="h-16 w-16 sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={STATUS_BADGE[group.status]} size="xs" pill>
              {STATUS_LABELS[group.status]}
            </Badge>
            <Badge variant="outline" size="xs" pill>
              {memberLabel(group)}
            </Badge>
            {mine.is_initiator && (
              <Badge variant="primary" size="xs" pill>
                Initiateur
              </Badge>
            )}
          </div>
          <Link href={`/groupe/${group.code}`} className="mt-1 line-clamp-1 text-sm font-semibold text-foreground hover:text-primary">
            {name}
          </Link>
          <p className="text-xs text-foreground/60">
            {mine.qty} unité{mine.qty > 1 ? "s" : ""} · {formatCentimes(group.current_unit_price)} l’unité · part{" "}
            {formatCentimes(mine.my_share_amount)}
          </p>
          {group.status === "open" && (
            <GroupBuyCountdown target={group.closes_at} offset={offset} prefix="Ferme dans" className="mt-1 text-xs" />
          )}
          {group.status === "locked" && mine.can_order && (
            <GroupBuyCountdown
              target={mine.order_deadline_at ?? group.order_deadline_at}
              offset={offset}
              prefix="Encore"
              suffix="pour commander"
              expiredLabel="Commandes closes"
              className="mt-1 text-xs"
            />
          )}
          {payFirst && (
            <GroupBuyCountdown
              target={mine.order_deadline_at ?? group.confirm_deadline_at ?? null}
              offset={offset}
              prefix="Encore"
              suffix="pour payer"
              expiredLabel="Délai de paiement passé"
              className="mt-1 text-xs"
            />
          )}
        </div>
      </div>

      {payFirst && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Wallet size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            Payez votre part en ligne avant <GroupBuyDeadline at={mine.order_deadline_at ?? group.confirm_deadline_at} offset={offset} />{" "}
            pour confirmer le prix. Sans paiement, votre place est libérée et cela compte comme un abandon.
          </span>
        </p>
      )}
      {waiting && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <Clock size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            Les grosses réservations confirment le prix jusqu’à{" "}
            <GroupBuyDeadline at={group.confirm_deadline_at} offset={offset} /> ; vous pourrez commander juste après.
          </span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {mine.can_order && (
          <Button variant="primary" size="sm" pill onClick={onOrder} disabled={disabled}>
            {ordering ? (
              <Loader2 size={14} className="animate-spin" />
            ) : payFirst ? (
              <Wallet size={14} aria-hidden="true" />
            ) : (
              <ShoppingBag size={14} aria-hidden="true" />
            )}
            {payFirst
              ? `Payer ma part en ligne · ${formatCentimes(mine.my_share_amount)}`
              : group.delivery_mode === "grouped"
                ? "Commander pour le groupe"
                : "Commander ma part"}
          </Button>
        )}
        {mine.order && (
          <Link
            href={`/track-order?order=${encodeURIComponent(mine.order.id)}`}
            className="inline-flex h-8 items-center rounded-full border-2 border-border px-3 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary"
          >
            Suivre la commande
          </Link>
        )}
        <Link
          href={`/groupe/${group.code}`}
          className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary-50"
        >
          Voir le groupe <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        highlight ? "col-span-2 border-primary/20 bg-gradient-to-br from-primary to-primary-dark text-white lg:col-span-1" : "border-border-light bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          highlight ? "bg-white/15 text-white" : "bg-primary-50 text-primary",
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className={cn("mt-2 text-xl font-extrabold tabular-nums", highlight ? "text-white" : "text-foreground")}>{value}</p>
      <p className={cn("text-xs", highlight ? "text-white/85" : "text-foreground/60")}>{label}</p>
    </div>
  );
}
