"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Ban, Gauge, Globe, Link2, Loader2, ShieldAlert, Users, Wallet } from "lucide-react";
import { Button, Modal, QuantitySelector } from "@/components/ui";
import { cn } from "@/lib/utils";
import { fetchMyGroupBuyStanding, launchGroupBuy } from "../api/group-buy.api";
import type { GroupBuyOffer, GroupBuyStanding } from "../api/group-buy.schemas";
import {
  closingTierAt,
  formatCentimes,
  formatDay,
  isBulkReservation,
  loginHref,
  plural,
  refusalOf,
} from "../lib/group-buy-format";

type GroupableOffer = Extract<GroupBuyOffer, { groupable: true }>;

interface LaunchGroupDialogProps {
  open: boolean;
  onClose: () => void;
  offer: GroupableOffer;
  productId: string;
  variantId: string | null;
}

/**
 * Launch a group in one screen: a quantity and who sees the group. Each member
 * then orders and is delivered on their own. Nothing is paid; the group page
 * opens right after, ready to share.
 */
export function LaunchGroupDialog({ open, onClose, offer, productId, variantId }: LaunchGroupDialogProps) {
  const router = useRouter();
  const tiers = [...offer.tiers].sort((a, b) => a.min_qty - b.min_qty);
  const topTier = tiers.at(-1)?.min_qty ?? 2;
  // Reaching the best price alone is not a group: the server refuses it too.
  const groupMax = Math.max(1, Math.min(offer.max_member_qty, topTier - 1));

  // The customer's standing, for hints only: the server decides. A guest
  // (401) or an older API simply gets no hint.
  const standingQuery = useQuery({
    queryKey: ["group-buys", "standing"],
    queryFn: ({ signal }) => fetchMyGroupBuyStanding({ signal }),
    enabled: open,
    retry: false,
    staleTime: 30_000,
  });
  const standing = standingQuery.data ?? null;
  const block = blockOf(standing, offer.base_unit_price);
  const ceilingQty = ceilingQtyOf(standing, offer.base_unit_price);
  const maxQty = ceilingQty === null ? groupMax : Math.max(1, Math.min(groupMax, ceilingQty));

  const [qtyChosen, setQty] = useState(1);
  const qty = Math.min(qtyChosen, maxQty);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingCode, setExistingCode] = useState<string | null>(null);
  /** The server refused for the person's standing: their record is one tap away. */
  const [standingRefusal, setStandingRefusal] = useState(false);

  const firstTier = tiers[0];
  const missing = firstTier ? Math.max(0, firstTier.min_qty - qty) : 0;
  const paysFirst =
    standing?.prepay_required === true || isBulkReservation(qty, closingTierAt(tiers, qty), offer.confirm_rules);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setExistingCode(null);
    setStandingRefusal(false);
    try {
      const response = await launchGroupBuy({ productId, variantId, qty, visibility, city });
      router.push(`/groupe/${response.data.code}?new=1`);
    } catch (err) {
      const refusal = refusalOf(err);
      if (refusal.status === 401) {
        router.push(loginHref(`${window.location.pathname}${window.location.search}`));
        return;
      }
      if (refusal.code === "ALREADY_RUNNING" && typeof refusal.meta?.code === "string") {
        setExistingCode(refusal.meta.code);
      }
      if (refusal.code === "TRUST_CAP" && typeof refusal.meta?.max_qty === "number" && refusal.meta.max_qty >= 1) {
        setQty(refusal.meta.max_qty);
      }
      if (refusal.code === "TRUST_CAP" || refusal.code === "GB_SUSPENDED" || refusal.code === "GB_BANNED") {
        void standingQuery.refetch();
        setStandingRefusal(true);
      }
      setError(refusal.message);
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title="Lancer un achat groupé" size="md">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Votre quantité</p>
            <p className="text-xs text-foreground/60">Les autres membres ajoutent la leur.</p>
          </div>
          <QuantitySelector value={qty} onChange={setQty} min={1} max={maxQty} size="md" />
        </div>

        {block && <StandingBlock block={block} standing={standing!} />}

        {!block && standing && standing.max_amount !== null && ceilingQty !== null && (
          <p className="flex items-start gap-1.5 text-xs text-foreground/70">
            <Gauge size={14} className="mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
            <span>
              Votre niveau {standing.level_label} : jusqu’à {maxQty} {plural(maxQty, "unité", "unités")} ici. Chaque commande
              livrée augmente ce plafond.
            </span>
          </p>
        )}

        {!block && paysFirst && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <Wallet size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>
              {standing?.prepay_required
                ? "Votre compte paie d’avance : à la clôture, vous paierez votre part en ligne en premier."
                : "Avec cette quantité, vous paierez votre part en ligne en premier à la clôture."}
              {offer.confirm_rules?.window_hours
                ? ` Vous aurez ${offer.confirm_rules.window_hours} h pour payer, sinon la place est libérée.`
                : ""}
            </span>
          </p>
        )}

        {firstTier && (
          <p className="rounded-xl bg-primary-50 px-3 py-2.5 text-sm text-primary-900">
            {missing > 0 ? (
              <>
                Il manque <span className="font-bold">{missing}</span> unité{missing > 1 ? "s" : ""} pour le premier palier à{" "}
                <span className="font-bold">{formatCentimes(firstTier.unit_price)}</span>. Jusqu’à{" "}
                {formatCentimes(offer.best_unit_price)} au dernier palier.
              </>
            ) : (
              <>
                Le premier palier est atteint dès le lancement. Invitez du monde pour descendre jusqu’à{" "}
                <span className="font-bold">{formatCentimes(offer.best_unit_price)}</span>.
              </>
            )}
          </p>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-foreground">Qui peut voir le groupe</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <Choice
              selected={visibility === "public"}
              onSelect={() => setVisibility("public")}
              icon={<Globe size={18} />}
              title="Tout Sugu"
              text="Visible dans les achats groupés : il se remplit plus vite."
            />
            <Choice
              selected={visibility === "private"}
              onSelect={() => setVisibility("private")}
              icon={<Link2 size={18} />}
              title="Mes proches"
              text="Seules les personnes qui ont le lien le voient."
            />
          </div>
        </fieldset>

        <div>
          <label htmlFor="gb-city" className="mb-1.5 block text-sm font-semibold text-foreground">
            Ville <span className="font-normal text-foreground/50">(facultatif)</span>
          </label>
          <input
            id="gb-city"
            type="text"
            value={city}
            maxLength={80}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Ouagadougou"
            className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
            {error}
            {existingCode && (
              <Link href={`/groupe/${existingCode}`} className="mt-1 flex items-center gap-1 font-semibold text-red-800 underline">
                Voir mon groupe <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
            {standingRefusal && (
              <Link href="/account/achats-groupes" className="mt-1 flex items-center gap-1 font-semibold text-red-800 underline">
                Mes achats groupés <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Button variant="primary" size="lg" fullWidth pill onClick={submit} disabled={busy || block !== null}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} aria-hidden="true" />}
            Lancer le groupe
          </Button>
          <p className="text-center text-xs text-foreground/60">
            Rien à payer maintenant. Le groupe reste ouvert {offer.open_hours} h. Si le prix est obtenu et que vous ne
            commandez pas, cela compte comme un abandon.
          </p>
        </div>
      </div>
    </Modal>
  );
}

function Choice({
  selected,
  onSelect,
  icon,
  title,
  text,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition-colors",
        selected ? "border-primary bg-primary-50" : "border-border bg-white hover:border-primary/40",
      )}
    >
      <span className={cn("mt-0.5 flex-shrink-0", selected ? "text-primary" : "text-foreground/60")} aria-hidden="true">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-foreground/60">{text}</span>
      </span>
    </button>
  );
}

type StandingBlockKind = "banned" | "suspended" | "ceiling";

/** Units the customer may still reserve at the normal price; null = no ceiling or unknown. */
function ceilingQtyOf(standing: GroupBuyStanding | null, basePrice: number): number | null {
  if (!standing || standing.available_amount === null) return null;
  return Math.floor(standing.available_amount / Math.max(1, basePrice));
}

/** What keeps the customer from launching, as the server will see it. */
function blockOf(standing: GroupBuyStanding | null, basePrice: number): StandingBlockKind | null {
  if (!standing) return null;
  if (standing.banned) return "banned";
  // The server sends `suspended_until` only while the suspension runs.
  if (standing.suspended_until) return "suspended";
  const ceiling = ceilingQtyOf(standing, basePrice);
  return ceiling !== null && ceiling < 1 ? "ceiling" : null;
}

function StandingBlock({ block, standing }: { block: StandingBlockKind; standing: GroupBuyStanding }) {
  const until = formatDay(standing.suspended_until, "Africa/Ouagadougou");
  const text =
    block === "banned"
      ? "Votre compte ne peut plus participer aux achats groupés. Contactez le service client pour en parler."
      : block === "suspended"
        ? `Après des places laissées sans commande, vous ne pouvez plus rejoindre ni lancer de groupe${until ? ` jusqu’au ${until}` : " pour le moment"}.`
        : `Votre plafond de réservation (niveau ${standing.level_label}) est atteint. Commandez ou libérez une place dans un autre groupe.`;
  const Icon = block === "banned" ? Ban : block === "suspended" ? ShieldAlert : Gauge;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800" role="status">
      <p className="flex items-start gap-2">
        <Icon size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
        <span>{text}</span>
      </p>
      {block !== "banned" && (
        <Link href="/account/achats-groupes" className="mt-1 flex items-center gap-1 pl-6 font-semibold underline">
          {block === "suspended" ? "Voir ma fiabilité" : "Mes achats groupés"} <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
