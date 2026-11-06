"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe, Link2, Loader2, Package, Truck, Users } from "lucide-react";
import { Button, Modal, QuantitySelector } from "@/components/ui";
import { cn } from "@/lib/utils";
import { launchGroupBuy } from "../api/group-buy.api";
import type { GroupBuyDeliveryMode, GroupBuyOffer } from "../api/group-buy.schemas";
import { formatCentimes, loginHref, refusalOf } from "../lib/group-buy-format";

type GroupableOffer = Extract<GroupBuyOffer, { groupable: true }>;

interface LaunchGroupDialogProps {
  open: boolean;
  onClose: () => void;
  offer: GroupableOffer;
  productId: string;
  variantId: string | null;
}

/**
 * Launch a group in one screen: a quantity, how the goods travel, who sees
 * the group. Nothing is paid; the group page opens right after, ready to share.
 */
export function LaunchGroupDialog({ open, onClose, offer, productId, variantId }: LaunchGroupDialogProps) {
  const router = useRouter();
  const tiers = [...offer.tiers].sort((a, b) => a.min_qty - b.min_qty);
  const topTier = tiers.at(-1)?.min_qty ?? 2;
  // Reaching the best price alone is not a group: the server refuses it too.
  const maxQty = Math.max(1, Math.min(offer.max_member_qty, topTier - 1));
  const modes = offer.delivery_modes;

  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState<GroupBuyDeliveryMode>(modes.includes("individual") ? "individual" : (modes[0] ?? "individual"));
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingCode, setExistingCode] = useState<string | null>(null);

  const firstTier = tiers[0];
  const missing = firstTier ? Math.max(0, firstTier.min_qty - qty) : 0;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setExistingCode(null);
    try {
      const response = await launchGroupBuy({ productId, variantId, qty, deliveryMode: mode, visibility, city });
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

        {modes.length > 1 && (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-foreground">Livraison</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice
                selected={mode === "individual"}
                onSelect={() => setMode("individual")}
                icon={<Truck size={18} />}
                title="Chacun reçoit sa part"
                text="Chaque membre commande et se fait livrer chez lui."
              />
              <Choice
                selected={mode === "grouped"}
                onSelect={() => setMode("grouped")}
                icon={<Package size={18} />}
                title="Un seul colis"
                text="Vous commandez pour tous et remettez sa part à chacun."
              />
            </div>
          </fieldset>
        )}
        {modes.length === 1 && modes[0] === "grouped" && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            Produit vendu en gros : un seul colis pour le groupe. Vous commandez pour tous à la clôture et chaque membre vous
            règle sa part directement.
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
          </div>
        )}

        <div className="space-y-2">
          <Button variant="primary" size="lg" fullWidth pill onClick={submit} disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} aria-hidden="true" />}
            Lancer le groupe
          </Button>
          <p className="text-center text-xs text-foreground/60">
            Gratuit, rien à payer maintenant. Le groupe reste ouvert {offer.open_hours} h.
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
