"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import type { CartUI } from "@/features/cart";
import { useCart } from "@/features/cart";
import { CartItemCard } from "./CartItemCard";
import { OrderSummary } from "./OrderSummary";

interface CartOrchestratorProps {
  initialCart: CartUI;
}

/**
 * Cart page orchestrator — manages shared cart state between CartItemList and OrderSummary.
 * Client component — the single client boundary for the cart page.
 *
 * All state comes from useCart hook which:
 * - Syncs with the real backend API (api.mysugu.com)
 * - Handles optimistic updates + backend reconciliation
 * - Serializes qty updates per line
 * - Provides anti-double-click on CTAs
 */
function CartOrchestrator({ initialCart }: CartOrchestratorProps) {
  const {
    cart,
    isLoading,
    hasHydrated,
    isUpdatingLine,
    isRemovingLine,
    isClearing,
    isApplyingCoupon,
    isCheckingOut,
    error,
    clearError,
    updateQty,
    removeItem,
    clearAll,
    submitCoupon,
    removeCouponCode,
    startCheckout,
    startMobileMoneyPayment,
    refetch,
    couponMessage,
  } = useCart(initialCart);

  // ─── Loading State (initial client refetch) ─────────────
  // The SSR may return an empty cart because the guest token isn't
  // available server-side. We show a skeleton while the client-side
  // refetch reconciles with the real backend data.
  if (isLoading && !hasHydrated) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10 animate-pulse">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 rounded-2xl bg-muted/50 p-4 h-28" />
          ))}
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-muted/50 p-6 h-64" />
        </div>
      </div>
    );
  }

  // ─── Empty Cart State ────────────────────────────────────
  // Only shown AFTER client-side hydration confirms the cart is truly empty.
  if (cart.isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-5 page-enter">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-50 animate-scale-in">
          <ShoppingBag size={40} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Votre panier est vide</h2>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          Découvrez nos produits frais et ajoutez-les à votre panier pour commencer vos achats sur Sugu.
        </p>
        <Link href="/">
          <Button variant="primary" size="lg" pill className="mt-2">
            <ShoppingBag size={18} />
            Découvrir nos produits
          </Button>
        </Link>
      </div>
    );
  }

  // ─── Cart with items ─────────────────────────────────────
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
      {/* Left — Cart Items (2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={refetch}
                className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-200 transition-colors"
                aria-label="Réessayer"
              >
                <RefreshCw size={12} />
                Réessayer
              </button>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600 transition-colors"
                aria-label="Fermer l'erreur"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Warnings from backend (stock limited, price changed, etc.) */}
        {cart.warnings.length > 0 && (
          <div className="space-y-2">
            {cart.warnings.map((w, i) => (
              <div
                key={`${w.code}-${w.item_id ?? i}`}
                className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
              >
                <AlertCircle size={14} className="flex-shrink-0" />
                {w.message}
              </div>
            ))}
          </div>
        )}

        {/* Sub-header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {cart.totals.itemCount} article{cart.totals.itemCount > 1 ? "s" : ""} · {cart.totals.qtyTotal} unité{cart.totals.qtyTotal > 1 ? "s" : ""}
          </p>
          <button
            onClick={clearAll}
            disabled={isClearing}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-error hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={12} />
            {isClearing ? "Suppression..." : "Vider le panier"}
          </button>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {cart.lines.map((line) => (
            <CartItemCard
              key={line.id}
              line={line}
              onUpdateQuantity={(qty) => updateQty(line.id, qty)}
              onRemove={() => removeItem(line.id)}
              isUpdating={isUpdatingLine(line.id)}
              isRemoving={isRemovingLine(line.id)}
            />
          ))}
        </div>

        {/* Continue shopping link */}
        <div className="pt-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft size={16} />
            Continuer mes achats
          </Link>
        </div>
      </div>

      {/* Right — Order Summary (1 col) */}
      <div className="lg:col-span-1">
        <OrderSummary
          totals={cart.totals}
          couponCode={cart.couponCode}
          onApplyCoupon={submitCoupon}
          onRemoveCoupon={removeCouponCode}
          onCheckout={startCheckout}
          onMobileMoneyPayment={startMobileMoneyPayment}
          isApplyingCoupon={isApplyingCoupon}
          isCheckingOut={isCheckingOut}
          couponMessage={couponMessage}
        />
      </div>
    </div>
  );
}

export { CartOrchestrator };
