/**
 * Group buying — display helpers. Amounts arrive in centimes; the store
 * charges XOF in whole francs, so a price is shown rounded to the franc.
 */
import { formatPrice } from "@/lib/constants";
import { isApiError } from "@/lib/api";
import type {
  GroupBuyConfirmRules,
  GroupBuyStatus,
  GroupBuySummary,
  GroupBuyTier,
} from "../api/group-buy.schemas";

export function formatCentimes(amount: number): string {
  return formatPrice(Math.round(amount / 100));
}

/**
 * A remaining time that cannot be read as a time of day: "2 j 04 h",
 * "23 h 05 min", "12 min 09 s", "45 s" — or null once the time is up.
 */
export function formatRemaining(ms: number): string | null {
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days} j ${pad(hours)} h`;
  if (hours > 0) return `${hours} h ${pad(minutes)} min`;
  if (minutes > 0) return `${minutes} min ${pad(seconds)} s`;
  return `${seconds} s`;
}

/** Server time minus the device time, from a response's `server_now`. */
export function clockOffsetFrom(serverNow: string | null | undefined, receivedAt = Date.now()): number {
  if (!serverNow) return 0;
  const server = Date.parse(serverNow);
  return Number.isFinite(server) ? server - receivedAt : 0;
}

export const STATUS_LABELS: Record<GroupBuyStatus, string> = {
  open: "Ouvert",
  confirming: "Confirmation du prix",
  locked: "Prix bloqué",
  failed: "Non atteint",
  finished: "Terminé",
  cancelled: "Annulé",
};

/** The first name + initial of up to 3 people, for an avatar row. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

export function productHref(group: Pick<GroupBuySummary, "product">): string | null {
  return group.product?.slug ? `/product/${group.product.slug}` : null;
}

/** "plus que 2 pour 5 400 FCFA", or what the group has reached. */
export function nextStepLabel(group: Pick<GroupBuySummary, "status" | "next_tier" | "current_tier_min_qty" | "current_unit_price">): string {
  if (group.status === "confirming") return `Prix provisoire : ${formatCentimes(group.current_unit_price)} l’unité`;
  if (group.status === "failed") return "Prix de groupe non atteint";
  if (group.status !== "open") return `Prix final : ${formatCentimes(group.current_unit_price)} l’unité`;
  if (group.next_tier) {
    const missing = group.next_tier.missing_qty;
    return `Plus que ${missing} pour passer à ${formatCentimes(group.next_tier.unit_price)}`;
  }
  return group.current_tier_min_qty ? "Meilleur prix atteint" : "Premier palier à atteindre";
}

/** The message of a refused action: the server's own words, safe to show. */
export function refusalOf(error: unknown): { code: string | null; message: string; meta: Record<string, unknown> | null; status: number } {
  if (isApiError(error)) {
    const code = typeof error.details?.errorCode === "string" ? error.details.errorCode : null;
    const meta = error.details?.meta && typeof error.details.meta === "object"
      ? (error.details.meta as Record<string, unknown>)
      : null;
    const message = error.status === 422 && error.details?.errors
      ? Object.values(error.details.errors)[0]?.[0] ?? error.message
      : error.message;
    return { code, message, meta, status: error.status };
  }
  return { code: null, message: "Une erreur est survenue. Réessayez dans un instant.", meta: null, status: 0 };
}

/**
 * A deadline as a customer reads it: "14:30", "demain à 14:30", or
 * "12/11 à 14:30". In the device's time zone, unless one is given (the
 * server render uses Ouagadougou's, then the browser redraws it).
 */
export function formatDeadline(iso: string | null | undefined, options: { now?: number; timeZone?: string } = {}): string | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return null;
  const { now = Date.now(), timeZone } = options;
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone }).format(at);
  const day = (value: number) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", timeZone }).format(value);
  if (day(at) === day(now)) return time;
  if (day(at) === day(now + 86_400_000)) return `demain à ${time}`;
  return `${day(at)} à ${time}`;
}

/** A calendar day: "12/11/2026". */
export function formatDay(iso: string | null | undefined, timeZone?: string): string | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return null;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone }).format(at);
}

/** The tier a quantity reaches, if any (tiers in any order). */
export function tierReachedAt(tiers: Pick<GroupBuyTier, "min_qty" | "unit_price">[], qty: number): Pick<GroupBuyTier, "min_qty" | "unit_price"> | null {
  let reached: Pick<GroupBuyTier, "min_qty" | "unit_price"> | null = null;
  for (const tier of tiers) {
    if (qty >= tier.min_qty && (!reached || tier.min_qty > reached.min_qty)) reached = tier;
  }
  return reached;
}

/**
 * Would this quantity pay first at the close? Same rule as the server
 * (GroupBuyStanding::isBulk): a large amount at the tier's price, or enough
 * units to weigh on the tier everyone gets.
 */
export function isBulkReservation(qty: number, tier: Pick<GroupBuyTier, "min_qty" | "unit_price"> | null, rules: GroupBuyConfirmRules | null | undefined): boolean {
  if (!rules || !tier || qty < 1) return false;
  if (qty * tier.unit_price >= rules.amount) return true;
  return qty >= rules.min_qty && tier.min_qty > 0 && qty * 100 >= rules.share_percent * tier.min_qty;
}

/**
 * The tier the group would close on with `groupQty` reserved: the one
 * reached, or the first one (below it the group fails and nobody pays).
 */
export function closingTierAt(tiers: Pick<GroupBuyTier, "min_qty" | "unit_price">[], groupQty: number): Pick<GroupBuyTier, "min_qty" | "unit_price"> | null {
  const sorted = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
  return tierReachedAt(sorted, groupQty) ?? sorted[0] ?? null;
}

/** The singular or plural form of a word, French style (0 and 1 are singular). */
export function plural(count: number, one: string, many: string): string {
  return count > 1 ? many : one;
}

export function loginHref(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`;
}

/** The link a member shares: the group page, with their invitation code. */
export function shareLinkOf(shareUrl: string, ref?: string | null): string {
  if (!ref) return shareUrl;
  try {
    const url = new URL(shareUrl);
    url.searchParams.set("ref", ref);
    return url.toString();
  } catch {
    return shareUrl;
  }
}

export function shareTextOf(group: Pick<GroupBuySummary, "product" | "current_unit_price" | "best_unit_price" | "base_unit_price">): string {
  const name = group.product?.name ?? "ce produit";
  const best = group.best_unit_price < group.base_unit_price
    ? ` Jusqu’à ${formatCentimes(group.best_unit_price)} au lieu de ${formatCentimes(group.base_unit_price)}.`
    : "";
  return `Rejoins mon achat groupé sur Sugu : ${name}.${best} Plus on est nombreux, moins on paie.`;
}
