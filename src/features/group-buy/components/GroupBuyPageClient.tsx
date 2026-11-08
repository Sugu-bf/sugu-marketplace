"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock,
  Gauge,
  Info,
  Loader2,
  LogIn,
  LogOut,
  PartyPopper,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  Store,
  TrendingDown,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { Badge, Button, Modal, QuantitySelector } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useToast } from "@/features/toast/toast-store";
import type { GroupBuyDetail, GroupBuyDetailResponse } from "../api/group-buy.schemas";
import {
  changeGroupBuyQuantity,
  joinGroupBuy,
  leaveGroupBuy,
  openGroupBuyCheckout,
  relaunchGroupBuy,
} from "../api/group-buy.api";
import { useGroupBuyLive } from "../hooks/use-group-buy-live";
import {
  STATUS_LABELS,
  closingTierAt,
  formatCentimes,
  formatDay,
  initialsOf,
  isBulkReservation,
  loginHref,
  nextStepLabel,
  plural,
  productHref,
  refusalOf,
} from "../lib/group-buy-format";
import { GroupBuyCountdown } from "./GroupBuyCountdown";
import { GroupBuyDeadline } from "./GroupBuyDeadline";
import { GroupBuyProgress } from "./GroupBuyProgress";
import { GroupBuyThumb } from "./GroupBuyCard";
import { ShareGroupBuy } from "./ShareGroupBuy";

interface GroupBuyPageClientProps {
  initial: GroupBuyDetailResponse;
  isSignedIn: boolean;
  /** Invitation code of the person who shared the link. */
  refCode: string | null;
  justLaunched: boolean;
  sessionExpired: boolean;
}

type Busy = "join" | "update" | "leave" | "order" | "relaunch" | null;

/** Refusals about the person (ceiling, suspension, ban): the page reads the group again. */
const STANDING_REFUSALS = new Set(["TRUST_CAP", "GB_SUSPENDED", "GB_BANNED"]);

const STATUS_BADGE: Record<GroupBuyDetail["status"], "success" | "secondary" | "warning" | "muted" | "danger"> = {
  open: "secondary",
  confirming: "warning",
  locked: "success",
  failed: "warning",
  finished: "muted",
  cancelled: "danger",
};

/**
 * The page of one group: where it stands (live), what the visitor can do,
 * and a share button that is never more than a thumb away.
 */
export function GroupBuyPageClient({ initial, isSignedIn, refCode, justLaunched, sessionExpired }: GroupBuyPageClientProps) {
  const { group, offset, apply, refresh } = useGroupBuyLive(initial);
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const mine = group.my_membership;
  const name = group.product?.name ?? "Produit";
  const productLink = productHref(group);
  const discounted = group.current_unit_price < group.base_unit_price;

  const goToLogin = () => {
    router.push(loginHref(`${window.location.pathname}${window.location.search}`));
  };

  const run = async (kind: Exclude<Busy, null>, action: () => Promise<void>) => {
    if (busy) return;
    setBusy(kind);
    setError(null);
    try {
      await action();
    } catch (err) {
      const refusal = refusalOf(err);
      if (refusal.status === 401) {
        goToLogin();
        return;
      }
      setError(refusal.message);
      toast.error(refusal.message);
      // A refusal about the viewer's standing changes what they may do here.
      if (refusal.code && STANDING_REFUSALS.has(refusal.code)) void refresh();
    } finally {
      setBusy(null);
    }
  };

  const join = (qty: number) =>
    run("join", async () => {
      const response = await joinGroupBuy(group.code, qty, refCode);
      apply(response);
      toast.success("Vous faites partie du groupe. Partagez-le pour faire baisser le prix.");
    });

  const updateQty = (qty: number) =>
    run("update", async () => {
      apply(await changeGroupBuyQuantity(group.code, qty));
      toast.success("Quantité mise à jour.");
    });

  const leave = () =>
    run("leave", async () => {
      apply(await leaveGroupBuy(group.code));
      setConfirmLeave(false);
      toast.info("Vous avez quitté le groupe.");
    });

  const order = () =>
    run("order", async () => {
      const sessionId = await openGroupBuyCheckout(group.code);
      router.push(`/checkout?session=${encodeURIComponent(sessionId)}`);
      await whileLeaving();
    });

  const relaunch = () =>
    run("relaunch", async () => {
      const response = await relaunchGroupBuy(group.code);
      router.push(`/groupe/${response.data.code}?new=1`);
      await whileLeaving();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[auto_1fr] lg:items-start">
      {/* ── Product ── */}
      <section className="rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-6" aria-labelledby="gb-product">
        <div className="flex items-start gap-4">
          <GroupBuyThumb src={group.product?.image_url ?? null} alt={name} className="h-28 w-28 sm:h-36 sm:w-36" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm" pill>
                <Users size={12} aria-hidden="true" /> Achat groupé
              </Badge>
              <Badge variant={STATUS_BADGE[group.status]} size="sm" pill>
                {STATUS_LABELS[group.status]}
              </Badge>
            </div>
            <h1 id="gb-product" className="mt-2 text-lg font-bold leading-snug text-foreground sm:text-2xl">
              {name}
            </h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-foreground/70">
              <Store size={14} aria-hidden="true" />
              {group.store?.slug ? (
                <Link href={`/store/${group.store.slug}`} className="hover:text-primary hover:underline">
                  {group.store.name}
                </Link>
              ) : (
                group.store?.name
              )}
              {group.city ? ` · ${group.city}` : ""}
            </p>
            {group.initiator_name && (
              <p className="mt-1 text-sm text-foreground/70">Lancé par {group.initiator_name}</p>
            )}
            {productLink && (
              <Link href={productLink} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Voir la fiche produit <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

      </section>

      {/* ── Live card + actions ── */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="Où en est le groupe">
        {sessionExpired && (
          <Notice tone="info" icon={<Info size={16} />}>
            Votre session de paiement a expiré. Cliquez de nouveau sur « Commander ma part » pour reprendre.
          </Notice>
        )}
        {justLaunched && group.status === "open" && (
          <Notice tone="success" icon={<PartyPopper size={16} />}>
            Votre groupe est lancé. Partagez-le maintenant : chaque personne qui rejoint fait baisser le prix.
          </Notice>
        )}

        <div className="rounded-2xl border border-primary/20 bg-white p-4 shadow-md shadow-primary/5 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
              {group.status === "open"
                ? "Prix du groupe maintenant"
                : group.status === "confirming"
                  ? "Prix provisoire du groupe"
                  : "Prix du groupe"}
            </p>
            {group.status === "open" && (
              <GroupBuyCountdown target={group.closes_at} offset={offset} prefix="Ferme dans" className="text-sm" />
            )}
            {group.status === "confirming" && (
              <GroupBuyCountdown
                target={group.confirm_deadline_at ?? null}
                offset={offset}
                prefix="Prix confirmé dans"
                expiredLabel="Confirmation en cours"
                className="text-sm"
              />
            )}
            {group.status === "locked" && (
              <GroupBuyCountdown
                target={group.order_deadline_at}
                offset={offset}
                prefix="Encore"
                suffix="pour commander"
                expiredLabel="Commandes closes"
                className="text-sm"
              />
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-extrabold text-primary" aria-live="polite">
              {formatCentimes(group.current_unit_price)}
            </span>
            <span className="text-sm text-foreground/60">l’unité</span>
            {discounted && (
              <>
                <span className="text-sm text-foreground/50 line-through">{formatCentimes(group.base_unit_price)}</span>
                <Badge variant="success" size="sm" pill>
                  -{Math.round(group.saving_percent)} %
                </Badge>
              </>
            )}
          </div>

          <GroupBuyProgress tiers={group.tiers} reservedQty={group.reserved_qty} className="mt-4" />

          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700">
            <TrendingDown size={16} aria-hidden="true" />
            {nextStepLabel(group)}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label="membres" value={group.members_count} />
            <Stat label="réservés" value={group.reserved_qty} />
            {group.status === "open" ? (
              <Stat label="unités encore possibles" value={group.remaining_qty} />
            ) : (
              <Stat label="ont commandé" value={group.ordered_count ?? 0} />
            )}
          </div>

          {group.status === "locked" && (group.ordered_count ?? 0) > 0 && group.members_count > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
              <CheckCircle2 size={16} aria-hidden="true" />
              {group.ordered_count} {plural(group.ordered_count ?? 0, "membre", "membres")} sur {group.members_count}{" "}
              {plural(group.ordered_count ?? 0, "a", "ont")} déjà commandé
            </p>
          )}

          <div className="mt-4 border-t border-border-light pt-4">
            <ActionPanel
              group={group}
              isSignedIn={isSignedIn}
              busy={busy}
              onLogin={goToLogin}
              onJoin={join}
              onUpdateQty={updateQty}
              onAskLeave={() => setConfirmLeave(true)}
              onOrder={order}
              onRelaunch={relaunch}
              offset={offset}
            />
            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>

        {group.status === "open" && (
          <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-bold text-foreground">Invitez vos proches</p>
            <p className="mb-3 mt-0.5 text-xs text-foreground/70">
              Plus le groupe grandit, plus le prix baisse pour tout le monde, vous compris.
            </p>
            <ShareGroupBuy group={group} shareRef={group.share_ref ?? null} />
          </div>
        )}
      </aside>

      {/* ── How the goods travel, members, how it works ── */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 rounded-xl border border-border-light bg-white p-3 text-sm shadow-sm">
            <Truck size={18} className="mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">
                {group.delivery_mode === "grouped" ? "Un seul colis pour le groupe" : "Chacun reçoit sa part"}
              </p>
              <p className="text-xs text-foreground/70">
                {group.delivery_mode === "grouped"
                  ? "L’initiateur commande et reçoit tout, puis remet sa part à chacun. Chaque membre le règle directement."
                  : "Chaque membre commande sa part et se fait livrer à son adresse, au prix du groupe."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-border-light bg-white p-3 text-sm shadow-sm">
            <BadgeCheck size={18} className="mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Rien à payer pour rejoindre</p>
              <p className="text-xs text-foreground/70">
                Vous payez votre part seulement après la clôture, au prix atteint, à la livraison ou par mobile money. Les
                grosses réservations paient en ligne en premier.
              </p>
            </div>
          </div>
        </div>
        <section className="rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-6" aria-labelledby="gb-members">
          <h2 id="gb-members" className="text-base font-bold text-foreground">
            Membres du groupe ({group.members_count})
          </h2>
          {group.members.length === 0 ? (
            <p className="mt-2 text-sm text-foreground/70">Personne pour l’instant. Soyez le premier.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border-light">
              {group.members.map((member, index) => (
                <li key={`${member.name}-${index}`} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      member.is_initiator ? "bg-primary text-white" : "bg-primary-50 text-primary-700",
                    )}
                    aria-hidden="true"
                  >
                    {initialsOf(member.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="text-xs text-foreground/60">
                      {member.qty} unité{member.qty > 1 ? "s" : ""}
                    </p>
                  </div>
                  {member.is_initiator && <Badge variant="secondary" size="xs" pill>Initiateur</Badge>}
                  {member.has_ordered && (
                    <Badge variant="success" size="xs" pill>
                      <CheckCircle2 size={10} aria-hidden="true" /> A commandé
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
          {group.members_hidden > 0 && (
            <p className="mt-2 text-xs text-foreground/60">
              et {group.members_hidden} autre{group.members_hidden > 1 ? "s" : ""} membre{group.members_hidden > 1 ? "s" : ""}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-6" aria-labelledby="gb-how">
          <h2 id="gb-how" className="text-base font-bold text-foreground">Comment ça marche</h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            <HowStep icon={<Users size={18} />} title="Rejoignez gratuitement">
              Réservez votre quantité. Rien à payer, vous pouvez la changer ou partir tant que le groupe est ouvert.
            </HowStep>
            <HowStep icon={<TrendingDown size={18} />} title="Le prix baisse">
              À chaque palier atteint, le prix baisse pour tous les membres. Partagez pour y arriver plus vite.
            </HowStep>
            <HowStep icon={<ShoppingBag size={18} />} title="Commandez votre part">
              À la clôture, le prix atteint est bloqué. Vous commandez votre part à ce prix, jamais plus cher que le prix normal.
            </HowStep>
          </ol>
        </section>
      </div>

      <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Quitter le groupe ?" size="sm">
        <p className="text-sm text-foreground/80">
          Votre place est libérée et le groupe perd vos {mine?.qty ?? 0} unité{(mine?.qty ?? 0) > 1 ? "s" : ""}. Vous pourrez le
          rejoindre de nouveau tant qu’il reste ouvert.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setConfirmLeave(false)} disabled={busy === "leave"}>
            Rester dans le groupe
          </Button>
          <Button variant="danger" onClick={leave} disabled={busy === "leave"}>
            {busy === "leave" && <Loader2 size={16} className="animate-spin" />}
            Quitter
          </Button>
        </div>
      </Modal>

    </div>
  );
}

// ─── Action panel ────────────────────────────────────────────

interface ActionPanelProps {
  group: GroupBuyDetail;
  isSignedIn: boolean;
  busy: Busy;
  offset: number;
  onLogin: () => void;
  onJoin: (qty: number) => void;
  onUpdateQty: (qty: number) => void;
  onAskLeave: () => void;
  onOrder: () => void;
  onRelaunch: () => void;
}

function ActionPanel({ group, isSignedIn, busy, offset, onLogin, onJoin, onUpdateQty, onAskLeave, onOrder, onRelaunch }: ActionPanelProps) {
  const mine = group.my_membership;

  // ── Open: join, or manage the place ──
  if (group.status === "open") {
    if (mine?.status === "reserved") {
      return <MemberOpenPanel group={group} busy={busy} onUpdateQty={onUpdateQty} onAskLeave={onAskLeave} />;
    }
    if (!isSignedIn) {
      return (
        <div className="space-y-2">
          <Button variant="primary" size="lg" fullWidth pill onClick={onLogin}>
            <LogIn size={18} aria-hidden="true" />
            Se connecter pour rejoindre
          </Button>
          <p className="text-center text-xs text-foreground/60">Gratuit, sans paiement maintenant.</p>
        </div>
      );
    }
    if (group.can_join) {
      return <JoinPanel group={group} busy={busy} onJoin={onJoin} />;
    }
    if (group.my_standing?.block && mine?.status !== "removed") {
      return <BlockNotice group={group} />;
    }
    return (
      <Notice tone="muted" icon={<Info size={16} />}>
        {mine?.status === "removed"
          ? "Vous avez été retiré de ce groupe."
          : group.remaining_qty === 0
            ? "Le groupe est complet. Lancez-en un autre depuis la fiche produit."
            : "Ce groupe n’accepte pas votre adhésion."}
      </Notice>
    );
  }

  // ── Confirming: the large reservations pay first, the others wait ──
  if (group.status === "confirming") {
    const deadline = group.confirm_deadline_at ?? mine?.order_deadline_at ?? null;
    if (mine?.status === "ordered") return <ConfirmOrderedNotice group={group} offset={offset} />;
    if (mine?.status === "reserved" && mine.must_confirm && mine.can_order) {
      return <PayFirstPanel group={group} busy={busy} offset={offset} onOrder={onOrder} />;
    }
    if (mine?.status === "reserved" && mine.must_confirm) {
      return (
        <Notice tone="warning" icon={<Clock size={16} />}>
          {group.delivery_mode === "grouped" && !mine.is_initiator
            ? "L’initiateur paie pour tout le groupe en ligne. Votre part reste à lui régler directement."
            : "Le délai pour payer votre part est passé. Le groupe termine la confirmation du prix."}
        </Notice>
      );
    }
    if (mine?.status === "reserved") {
      return (
        <div className="space-y-2">
          <Notice tone="info" icon={<Clock size={16} />}>
            Les grosses réservations confirment le prix jusqu’à <GroupBuyDeadline at={deadline} offset={offset} /> ; vous pourrez
            commander juste après.
          </Notice>
          <p className="text-xs text-foreground/60">
            Prix provisoire : {formatCentimes(group.current_unit_price)} l’unité. Il peut encore changer si une grosse réservation
            n’est pas payée. Vous recevrez un message dès que vous pourrez commander.
          </p>
        </div>
      );
    }
    return (
      <ClosedCta
        group={group}
        text={
          <>
            Le groupe est fermé aux nouveaux membres. Les grosses réservations confirment le prix jusqu’à{" "}
            <GroupBuyDeadline at={deadline} offset={offset} />.
          </>
        }
      />
    );
  }

  // ── Locked: order the part at the locked price ──
  if (group.status === "locked") {
    if (mine?.status === "ordered") return <OrderedNotice group={group} />;
    if (mine?.status === "reserved" && mine.can_order) {
      const grouped = group.delivery_mode === "grouped";
      return (
        <div className="space-y-3">
          <Notice tone="success" icon={<CheckCircle2 size={16} />}>
            Prix bloqué à {formatCentimes(group.current_unit_price)} l’unité.{" "}
            {grouped
              ? `Commandez pour tout le groupe : ${mine.order_qty} unités, un seul colis.`
              : `Commandez votre part : ${mine.qty} unité${mine.qty > 1 ? "s" : ""}.`}
          </Notice>
          <Button variant="primary" size="lg" fullWidth pill onClick={onOrder} disabled={busy !== null}>
            {busy === "order" ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} aria-hidden="true" />}
            {grouped ? "Commander pour le groupe" : "Commander ma part"}
            {!grouped && ` · ${formatCentimes(mine.my_share_amount)}`}
          </Button>
          <p className="text-center text-xs text-foreground/60">
            Paiement à la livraison ou par mobile money, comme une commande normale. Livraison en plus.
          </p>
          <p className="flex items-start gap-1.5 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>Le prix a été obtenu avec votre place : sans commande avant la fin du délai, cela compte comme un abandon.</span>
          </p>
        </div>
      );
    }
    if (mine?.status === "reserved" && group.delivery_mode === "grouped") {
      return (
        <Notice tone="info" icon={<Truck size={16} />}>
          L’initiateur commande pour tout le groupe et vous remet votre part. Vous lui réglez directement{" "}
          {formatCentimes(mine.my_share_amount)}.
        </Notice>
      );
    }
    return (
      <div className="space-y-3">
        {mine?.status === "expired" && mine.must_confirm && <UnconfirmedNotice />}
        <ClosedCta group={group} text="Le groupe est fermé aux nouveaux membres." />
      </div>
    );
  }

  // ── Over ──
  const canRelaunch = isSignedIn && (mine?.status === "reserved" || mine?.status === "ordered" || mine?.status === "expired");
  const unconfirmed = mine?.status === "expired" && mine.must_confirm === true && group.status !== "cancelled";
  const text =
    group.status === "failed"
      ? mine?.status === "ordered"
        ? "Le palier n’a pas été atteint avec les autres membres. Votre commande reste valable au prix que vous avez payé."
        : (group.ordered_count ?? 0) > 0
          ? "Le groupe n’a pas atteint le palier à temps. Vous n’avez rien payé."
          : "Le groupe n’a pas atteint le premier palier à temps. Personne n’a rien payé."
      : group.status === "cancelled"
        ? "Ce groupe a été annulé. Aucune commande déjà passée n’est touchée."
        : "Ce groupe est terminé.";

  return (
    <div className="space-y-3">
      {mine?.status === "ordered" && <OrderedNotice group={group} />}
      {unconfirmed && <UnconfirmedNotice />}
      {/* On a failed or cancelled group the server also closes the places:
          only a finished one means the member let the window pass. */}
      {mine?.status === "expired" && group.status === "finished" && !unconfirmed && (
        <Notice tone="warning" icon={<AlertTriangle size={16} />}>
          Vous n’avez pas commandé votre part à temps.
        </Notice>
      )}
      <Notice tone="muted" icon={<Info size={16} />}>{text}</Notice>
      {canRelaunch && group.status !== "cancelled" ? (
        <Button variant="primary" size="lg" fullWidth pill onClick={onRelaunch} disabled={busy !== null}>
          {busy === "relaunch" ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} aria-hidden="true" />}
          Relancer le groupe
        </Button>
      ) : (
        <ClosedCta group={group} />
      )}
    </div>
  );
}

/**
 * The largest quantity the viewer may hold here: the group's own limits,
 * and their trust ceiling when the server gives it (`max_qty_here`).
 */
function maxQtyFor(group: GroupBuyDetail, current = 0): number {
  const groupMax = Math.min(group.max_member_qty, current + group.remaining_qty);
  const cap = group.my_standing?.max_qty_here;
  return typeof cap === "number" ? Math.min(groupMax, cap) : groupMax;
}

/** Would `qty` (the viewer's whole place) pay first if the group closed on its tier? */
function paysFirstWith(group: GroupBuyDetail, qty: number, current = 0): boolean {
  if (group.my_standing?.prepay_required) return true;
  const tier = closingTierAt(group.tiers, group.reserved_qty - current + qty);
  return isBulkReservation(qty, tier, group.confirm_rules);
}

function TrustHint({ group, max }: { group: GroupBuyDetail; max: number }) {
  const standing = group.my_standing;
  if (!standing || standing.max_amount === null) return null;
  return (
    <p className="flex items-start gap-1.5 text-xs text-foreground/70">
      <Gauge size={14} className="mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
      <span>
        Votre niveau {standing.level_label} : jusqu’à {max} {plural(max, "unité", "unités")} ici. Chaque commande livrée augmente
        ce plafond.
      </span>
    </p>
  );
}

function PaysFirstHint({ group }: { group: GroupBuyDetail }) {
  const hours = group.confirm_rules?.window_hours;
  return (
    <Notice tone="warning" icon={<Wallet size={16} />}>
      {group.my_standing?.prepay_required
        ? "Votre compte paie d’avance : à la clôture, vous paierez votre part en ligne en premier."
        : "Avec cette quantité, vous paierez votre part en ligne en premier à la clôture."}
      {hours ? ` Vous aurez ${hours} h pour payer, sinon la place est libérée.` : ""}
    </Notice>
  );
}

function JoinPanel({ group, busy, onJoin }: { group: GroupBuyDetail; busy: Busy; onJoin: (qty: number) => void }) {
  const max = Math.max(1, maxQtyFor(group));
  const [qty, setQty] = useState(1);
  const safeQty = Math.min(qty, max);
  // What the group would pay with this quantity added.
  const unitAfter = unitPriceAt(group, group.reserved_qty + safeQty);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">Votre quantité</span>
        <QuantitySelector value={safeQty} onChange={setQty} min={1} max={max} size="md" />
      </div>
      <TrustHint group={group} max={max} />
      <p className="rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-900">
        Votre part estimée : <span className="font-bold">{formatCentimes(unitAfter * safeQty)}</span>
        <span className="block text-xs text-primary-700">
          {unitAfter < group.current_unit_price
            ? `Avec vous, le prix passe à ${formatCentimes(unitAfter)} pour tout le groupe.`
            : "Le prix baisse encore si le groupe grandit."}
        </span>
      </p>
      {paysFirstWith(group, safeQty) && <PaysFirstHint group={group} />}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        pill
        onClick={() => onJoin(safeQty)}
        disabled={busy !== null}
        className="shadow-lg shadow-primary/20"
      >
        {busy === "join" ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} aria-hidden="true" />}
        Rejoindre le groupe
      </Button>
      <p className="text-center text-xs text-foreground/60">
        Rien à payer maintenant. Si le prix est obtenu et que vous ne commandez pas, cela compte comme un abandon.
      </p>
    </div>
  );
}

function MemberOpenPanel({
  group,
  busy,
  onUpdateQty,
  onAskLeave,
}: {
  group: GroupBuyDetail;
  busy: Busy;
  onUpdateQty: (qty: number) => void;
  onAskLeave: () => void;
}) {
  const mine = group.my_membership!;
  const max = Math.max(mine.qty, maxQtyFor(group, mine.qty));
  const [qty, setQty] = useState(mine.qty);
  const changed = qty !== mine.qty;

  return (
    <div className="space-y-3">
      <Notice tone="success" icon={<CheckCircle2 size={16} />}>
        {mine.is_initiator ? "Vous avez lancé ce groupe." : "Vous faites partie du groupe."} {mine.qty} unité
        {mine.qty > 1 ? "s" : ""} réservée{mine.qty > 1 ? "s" : ""}, part estimée {formatCentimes(mine.my_share_amount)}.
      </Notice>
      {mine.can_change_qty && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">Changer ma quantité</span>
          <div className="flex items-center gap-2">
            <QuantitySelector value={qty} onChange={setQty} min={1} max={max} size="sm" />
            <Button variant="secondary" size="sm" onClick={() => onUpdateQty(qty)} disabled={!changed || busy !== null}>
              {busy === "update" && <Loader2 size={14} className="animate-spin" />}
              Valider
            </Button>
          </div>
        </div>
      )}
      {mine.can_change_qty && <TrustHint group={group} max={max} />}
      {paysFirstWith(group, qty, mine.qty) && <PaysFirstHint group={group} />}
      <p className="text-xs text-foreground/60">
        À la clôture, le prix atteint est bloqué et vous recevez un message pour commander votre part. Sans commande, cela
        compte comme un abandon.
      </p>
      {mine.can_leave && (
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-xs text-foreground/70">
            Vous ne pouvez plus venir ? Quittez le groupe plutôt que de laisser votre place sans commande.
          </p>
          <Button variant="outline" size="sm" fullWidth onClick={onAskLeave} disabled={busy !== null} className="mt-2">
            <LogOut size={14} aria-hidden="true" />
            Quitter le groupe
          </Button>
        </div>
      )}
    </div>
  );
}

/** A member who pays first: one button, the deadline, and what missing it costs. */
function PayFirstPanel({ group, busy, offset, onOrder }: { group: GroupBuyDetail; busy: Busy; offset: number; onOrder: () => void }) {
  const mine = group.my_membership!;
  const deadline = mine.order_deadline_at ?? group.confirm_deadline_at ?? null;

  return (
    <div className="space-y-3">
      <Notice tone="info" icon={<Wallet size={16} />}>
        {mine.confirm_reason === "prepay"
          ? "Votre compte paie d’avance : payez votre part en ligne pour garder votre place."
          : "Votre réservation pèse sur le prix de tout le groupe : payez votre part en ligne pour le confirmer."}{" "}
        Prix : {formatCentimes(group.current_unit_price)} l’unité.
      </Notice>
      <div className="flex justify-center">
        <GroupBuyCountdown
          target={deadline}
          offset={offset}
          prefix="Encore"
          suffix="pour payer"
          expiredLabel="Délai de paiement passé"
          className="text-sm"
        />
      </div>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        pill
        onClick={onOrder}
        disabled={busy !== null}
        className="shadow-lg shadow-primary/20"
      >
        {busy === "order" ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} aria-hidden="true" />}
        Payer ma part en ligne · {formatCentimes(mine.my_share_amount)}
      </Button>
      <Notice tone="warning" icon={<AlertTriangle size={16} />}>
        Sans paiement avant <GroupBuyDeadline at={deadline} offset={offset} />, votre place est libérée et cela compte comme un
        abandon.
      </Notice>
      <p className="text-center text-xs text-foreground/60">
        Mobile money uniquement (Orange Money, Moov Money, Wave). Livraison en plus. Les autres membres commandent après vous.
      </p>
    </div>
  );
}

/** Ordered while the price is being confirmed: paid, or payment still to finish. */
function ConfirmOrderedNotice({ group, offset }: { group: GroupBuyDetail; offset: number }) {
  const mine = group.my_membership!;
  const order = mine.order;
  const deadline = mine.order_deadline_at ?? group.confirm_deadline_at ?? null;
  const paid = mine.confirmed === true || order?.payment_status === "paid";

  if (paid || !mine.must_confirm) {
    return (
      <div className="space-y-2">
        <Notice tone="success" icon={<CheckCircle2 size={16} />}>
          {paid ? "Paiement reçu : votre part est confirmée." : "Votre commande est passée."} Les autres membres pourront
          commander après <GroupBuyDeadline at={group.confirm_deadline_at} offset={offset} />.
        </Notice>
        {order && <TrackOrderLink orderId={order.id} />}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Notice tone="warning" icon={<AlertTriangle size={16} />}>
        Commande créée, paiement pas encore reçu. Terminez le paiement avant <GroupBuyDeadline at={deadline} offset={offset} />,
        sinon votre place est libérée et cela compte comme un abandon.
      </Notice>
      {order && (
        <Link
          href={`/track-order?order=${encodeURIComponent(order.id)}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Wallet size={16} aria-hidden="true" /> Terminer le paiement
        </Link>
      )}
    </div>
  );
}

function UnconfirmedNotice() {
  return (
    <Notice tone="warning" icon={<AlertTriangle size={16} />}>
      Votre place a été libérée : votre part n’a pas été payée avant la fin de la confirmation du prix.
    </Notice>
  );
}

/** Why a signed-in visitor may not join, said plainly, with the way out. */
function BlockNotice({ group }: { group: GroupBuyDetail }) {
  const standing = group.my_standing!;
  if (standing.block === "banned") {
    return (
      <Notice tone="danger" icon={<Ban size={16} />}>
        Votre compte ne peut plus participer aux achats groupés. Contactez le service client pour en parler.
      </Notice>
    );
  }
  if (standing.block === "suspended") {
    const until = formatDay(standing.suspended_until, "Africa/Ouagadougou");
    return (
      <div className="space-y-2">
        <Notice tone="warning" icon={<ShieldAlert size={16} />}>
          Après des places laissées sans commande, vous ne pouvez plus rejoindre ni lancer de groupe
          {until ? ` jusqu’au ${until}` : " pour le moment"}.
        </Notice>
        <Link href="/account/achats-groupes" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Voir ma fiabilité <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Notice tone="warning" icon={<Gauge size={16} />}>
        Votre plafond de réservation (niveau {standing.level_label}) est atteint. Commandez ou libérez une place dans un autre
        groupe pour rejoindre celui-ci.
      </Notice>
      <Link href="/account/achats-groupes" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        Mes achats groupés <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}

function TrackOrderLink({ orderId }: { orderId: string }) {
  return (
    <Link
      href={`/track-order?order=${encodeURIComponent(orderId)}`}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-white py-2.5 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary"
    >
      <Truck size={16} aria-hidden="true" /> Suivre ma commande
    </Link>
  );
}

function OrderedNotice({ group }: { group: GroupBuyDetail }) {
  const order = group.my_membership?.order;
  return (
    <div className="space-y-2">
      <Notice tone="success" icon={<CheckCircle2 size={16} />}>
        Votre commande est passée au prix du groupe{order?.number ? ` (n° ${order.number})` : ""}.
      </Notice>
      {order && <TrackOrderLink orderId={order.id} />}
    </div>
  );
}

function ClosedCta({ group, text }: { group: GroupBuyDetail; text?: React.ReactNode }) {
  const productLink = productHref(group);
  return (
    <div className="space-y-2">
      {text && <Notice tone="muted" icon={<Info size={16} />}>{text}</Notice>}
      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/achats-groupes"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Groupes ouverts <ArrowRight size={14} aria-hidden="true" />
        </Link>
        {productLink && (
          <Link
            href={productLink}
            className="inline-flex items-center justify-center rounded-full border-2 border-border bg-white py-2.5 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary"
          >
            Lancer un groupe
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Small pieces ────────────────────────────────────────────

/**
 * Keeps a button busy while the browser loads the next page, then frees it:
 * a page restored from the back-forward cache must not stay stuck.
 */
function whileLeaving(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 8_000));
}

/** The unit price the tiers give at a quantity (never above the base price). */
function unitPriceAt(group: Pick<GroupBuyDetail, "tiers" | "base_unit_price">, qty: number): number {
  let price = group.base_unit_price;
  for (const tier of group.tiers) {
    if (qty >= tier.min_qty) price = Math.min(price, tier.unit_price);
  }
  return price;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/70 px-2 py-2">
      <p className="text-lg font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-[11px] text-foreground/60">{label}</p>
    </div>
  );
}

function HowStep({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl bg-muted/60 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary" aria-hidden="true">
        {icon}
      </span>
      <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-foreground/70">{children}</p>
    </li>
  );
}

const NOTICE_TONES = {
  success: "border-green-200 bg-green-50 text-green-800",
  danger: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  muted: "border-border bg-muted/60 text-foreground/80",
} as const;

function Notice({ tone, icon, children }: { tone: keyof typeof NOTICE_TONES; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm", NOTICE_TONES[tone])} role="status">
      <span className="mt-0.5 flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div>{children}</div>
    </div>
  );
}
