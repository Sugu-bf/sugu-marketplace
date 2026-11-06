"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsHydrated } from "@/lib/hydration";
import { useToast } from "@/features/toast/toast-store";
import type { GroupBuySummary } from "../api/group-buy.schemas";
import { shareLinkOf, shareTextOf } from "../lib/group-buy-format";

interface ShareGroupBuyProps {
  group: Pick<GroupBuySummary, "share_url" | "product" | "current_unit_price" | "best_unit_price" | "base_unit_price">;
  /** The sharer's own invitation code. */
  shareRef?: string | null;
  className?: string;
}

/**
 * WhatsApp first (that is where groups form), the phone's own share sheet
 * when it has one, and a plain copy of the link.
 */
export function ShareGroupBuy({ group, shareRef, className }: ShareGroupBuyProps) {
  const toast = useToast();
  const hydrated = useIsHydrated();
  const [copied, setCopied] = useState(false);
  const link = shareLinkOf(group.share_url, shareRef);
  const text = shareTextOf(group);
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`;
  const canShareNatively = hydrated && typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Lien copié. Collez-le où vous voulez.");
      window.setTimeout(() => setCopied(false), 2_500);
    } catch {
      toast.error("Copie impossible. Sélectionnez le lien et copiez-le.");
    }
  };

  const shareNatively = async () => {
    try {
      await navigator.share({ title: "Achat groupé sur Sugu", text, url: link });
    } catch {
      // Closed by the person: nothing to do.
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2 inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1EBE5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        >
          <MessageCircle size={18} aria-hidden="true" />
          Partager sur WhatsApp
        </a>
        {canShareNatively && (
          <button
            type="button"
            onClick={shareNatively}
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Share2 size={16} aria-hidden="true" />
            Partager
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary",
            !canShareNatively && "col-span-2",
          )}
        >
          {copied ? <Check size={16} aria-hidden="true" className="text-success" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? "Copié" : "Copier le lien"}
        </button>
      </div>
      <p className="truncate text-xs text-foreground/50" title={link}>
        {link}
      </p>
    </div>
  );
}
