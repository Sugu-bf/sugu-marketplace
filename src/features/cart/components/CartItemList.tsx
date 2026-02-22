"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui";
import type { CartItem } from "@/features/cart";
import { CartItemCard } from "./CartItemCard";

interface CartItemListProps {
  /** Initial items from SSR — used as default state. */
  initialItems: CartItem[];
}

/**
 * Cart items list orchestrator — manages cart state client-side.
 * Client component — the minimal client boundary for item interactions.
 *
 * NOTE: In production, this would read from useCartStore (zustand).
 * For design-only, we use local state initialized from mock data via SSR.
 */
function CartItemList({ initialItems }: CartItemListProps) {
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

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
          <ShoppingBag size={36} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Votre panier est vide</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Découvrez nos produits frais et ajoutez-les à votre panier pour commencer vos achats.
        </p>
        <Link href="/">
          <Button variant="primary" size="lg" pill>
            Découvrir nos produits
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {items.length} article{items.length > 1 ? "s" : ""}
        </h2>
        <button
          onClick={() => setItems([])}
          className="text-xs font-medium text-error hover:underline transition-colors"
        >
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

      {/* Continue shopping */}
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}

export { CartItemList };
