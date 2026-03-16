"use client";

import { useRecommendedProducts, useConversation, usePresence } from "../hooks";
import { ProductListItem } from "./ProductListItem";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { safeSrc } from "../security";

interface ContactPanelProps {
  conversationId: string;
}

/**
 * ContactPanel — Panel 3 (desktop right): seller info + recommended products.
 */
export function ContactPanel({ conversationId }: ContactPanelProps) {
  const { data: conversation } = useConversation(conversationId);
  const { data: products, isLoading: productsLoading } =
    useRecommendedProducts(conversationId);
  const { data: presenceList } = usePresence(conversationId);

  const store = conversation?.store;
  if (!store) return null;

  // Presence from API or fallback to store data
  const sellerPresence = presenceList?.find(
    (p) => p.participant_type === "seller"
  );
  const isOnline = sellerPresence?.is_online ?? store.is_online;
  const lastActive = sellerPresence?.last_active;

  const initials = store.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const lastActiveLabel = lastActive
    ? lastActive === "now"
      ? ""
      : lastActive === "recently"
        ? "Vu récemment"
        : lastActive === "today"
          ? "Vu aujourd'hui"
          : lastActive === "long_ago"
            ? "Vu il y a longtemps"
            : ""
    : "";

  return (
    <div className="flex flex-col h-full bg-white border-l border-border-light overflow-y-auto scrollbar-hide">
      {/* ─── Seller profile ─────────────────────────────────── */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-border-light">
        {/* Avatar */}
        <div className="relative mb-3">
          {store.logo_url ? (
            <img
              src={safeSrc(store.logo_url)}
              alt={store.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-border-light"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary">
              {initials}
            </div>
          )}
        </div>

        {/* Role badge */}
        <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-primary text-white text-xs font-semibold mb-2">
          Vendeur
        </span>

        {/* Name */}
        <h3 className="text-base font-bold text-foreground text-center">
          {store.name}
        </h3>

        {/* Online status */}
        <p
          className={cn(
            "flex items-center gap-1 text-xs mt-1",
            isOnline ? "text-success" : "text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isOnline ? "bg-success animate-pulse" : "bg-muted-foreground/40"
            )}
          />
          {isOnline ? "En ligne" : "Hors ligne"}
        </p>
        {!isOnline && lastActiveLabel && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {lastActiveLabel}
          </p>
        )}

        {/* Visit store */}
        <Link
          href={`/store/${store.slug}`}
          className="mt-3 text-xs font-medium text-primary hover:text-primary-dark underline underline-offset-2 transition-colors"
        >
          Visiter la boutique →
        </Link>
      </div>

      {/* ─── Recommended Products ───────────────────────────── */}
      <div className="flex-1 px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-foreground">
            Produits recommandés
          </h4>
          <Link
            href={`/store/${store.slug}`}
            className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Voir
          </Link>
        </div>

        {productsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg skeleton" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 skeleton rounded" />
                  <div className="h-3 w-1/3 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-0.5">
            {products.slice(0, 10).map((product) => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">
            Aucun produit recommandé
          </p>
        )}
      </div>
    </div>
  );
}
