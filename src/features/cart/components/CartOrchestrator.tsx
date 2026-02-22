"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import { Button, QuantitySelector } from "@/components/ui";
import { formatPrice } from "@/lib/constants";
import type { CartItem } from "@/features/cart";
import { CartItemCard } from "./CartItemCard";
import { OrderSummary } from "./OrderSummary";

interface CartOrchestratorProps {
  initialItems: CartItem[];
}

/**
 * Cart page orchestrator — manages shared cart state between CartItemList and OrderSummary.
 * Client component — the single client boundary for the cart page.
 *
 * NOTE: In production, this would use useCartStore (zustand).
 * For design-only, we use local state seeded from SSR mock data.
 */
function CartOrchestrator({ initialItems }: CartOrchestratorProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemove = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClear = () => {
    setItems([]);
  };

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  // ─── Empty Cart State ────────────────────────────────────
  if (items.length === 0) {
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
        {/* Sub-header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {items.length} article{items.length > 1 ? "s" : ""} · {itemCount} unité{itemCount > 1 ? "s" : ""}
          </p>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-error hover:underline transition-colors"
          >
            <Trash2 size={12} />
            Vider le panier
          </button>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <CartItemCard
              key={item.productId}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
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
        <OrderSummary items={items} />
      </div>
    </div>
  );
}

export { CartOrchestrator };
