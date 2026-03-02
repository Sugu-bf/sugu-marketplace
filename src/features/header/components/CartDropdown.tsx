"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/constants";
import { fetchCartPreview, type CartPreviewData } from "../api/header.api";
import { CartDropdownSkeleton } from "./HeaderSkeletons";
import { onCartChanged, type CartItemPreview } from "@/features/cart/events/cart-events";
import {
  getCartItems,
  addCartItem,
  getCartItemCount,
  setCartItems as saveCartItems,
} from "@/features/cart/events/cart-storage";

interface CartDropdownProps {
  /** Initial badge count from server (or 0). */
  initialCount?: number;
}

/**
 * CartDropdown — hover/click popover showing cart preview.
 *
 * Persistence strategy:
 * 1. Optimistic items stored in localStorage via cart-storage
 * 2. Cart token stored in localStorage (set by addToCart)
 * 3. Backend data takes priority when available
 * 4. Badge count = backend count || localStorage count || initialCount
 */
export default function CartDropdown({ initialCount = 0 }: CartDropdownProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CartPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [optimisticItems, setOptimisticItems] = useState<CartItemPreview[]>([]);
  const [badgeCount, setBadgeCount] = useState(initialCount);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ─── Load persisted items on mount ──────────────────────
  useEffect(() => {
    const stored = getCartItems();
    if (stored.length > 0) {
      setOptimisticItems(stored);
      setBadgeCount(stored.reduce((sum, i) => sum + i.qty, 0));
    }
  }, []);

  // ─── Fetch cart from backend ────────────────────────────
  const loadData = useCallback(async (force = false) => {
    if (!force && fetched) return;
    setLoading(true);
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const result = await fetchCartPreview();

      if (result && result.items.length > 0) {
        // Backend has real data → use it as source of truth
        setData(result);
        setBadgeCount(result.totals?.item_count ?? 0);
        // Clear optimistic — backend is the truth now
        setOptimisticItems([]);
        saveCartItems([]);
      } else {
        // Backend returned empty — keep optimistic items
        setData(result);
      }
    } catch {
      // Silently fail — keep optimistic state
    } finally {
      setFetched(true);
      setLoading(false);
    }
  }, [fetched]);

  const handleEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
    loadData();
  }, [loadData]);

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  }, []);

  // ─── Listen for cart-changed events ─────────────────────
  useEffect(() => {
    return onCartChanged((detail) => {
      if (detail?.action === "add" && detail.item) {
        // Persist to localStorage
        addCartItem(detail.item);

        // Update local state
        setOptimisticItems((prev) => {
          const existing = prev.find((i) => i.id === detail.item!.id);
          if (existing) {
            return prev.map((i) =>
              i.id === detail.item!.id
                ? { ...i, qty: i.qty + detail.item!.qty }
                : i
            );
          }
          return [...prev, detail.item!];
        });

        // Bump badge
        setBadgeCount((prev) => prev + (detail.item?.qty ?? 1));

        // Invalidate fetched cache so next hover re-fetches
        setFetched(false);
      }
    });
  }, []);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ─── Derived state ──────────────────────────────────────
  const backendItems = data?.items ?? [];
  const totals = data?.totals ?? null;
  const hasBackendItems = backendItems.length > 0;
  const displayItems = hasBackendItems ? backendItems : [];
  const isEmpty = fetched && displayItems.length === 0 && optimisticItems.length === 0 && badgeCount === 0;

  // Optimistic subtotal
  const optimisticSubtotal = optimisticItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Trigger */}
      <Link
        href="/cart"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white"
        aria-label={`Panier${badgeCount > 0 ? ` (${badgeCount} articles)` : ""}`}
        id="header-cart-trigger"
      >
        <ShoppingCart size={20} />
        {badgeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-foreground transition-transform duration-300 animate-bounce-once">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </Link>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white shadow-xl border border-gray-100 py-2 z-50 hidden md:block animate-fade-slide-down">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">Mon Panier</p>
            {badgeCount > 0 && (
              <span className="text-xs font-medium text-white bg-primary px-2 py-0.5 rounded-full">
                {badgeCount} article{badgeCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Content */}
          {loading && !fetched ? (
            <CartDropdownSkeleton />
          ) : isEmpty ? (
            <div className="px-4 py-6 text-center">
              <ShoppingCart size={28} className="mx-auto mb-2 text-border" />
              <p className="text-sm text-muted-foreground mb-3">
                Votre panier est vide
              </p>
              <Link
                href="/search"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                Découvrir des produits
              </Link>
            </div>
          ) : hasBackendItems ? (
            /* ─── Backend items (full data) ───────────────── */
            <>
              {displayItems.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={item.product_slug ? `/product/${item.product_slug}` : "#"}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors duration-150"
                  onClick={() => setOpen(false)}
                >
                  <div className="relative h-12 w-12 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-border">
                        <ShoppingCart size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-primary">
                        {formatPrice(item.unit_price)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        × {item.qty}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {totals && (
                <div className="px-4 pt-3 pb-1 border-t border-border mt-1 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sous-total</span>
                    <span className="text-base font-bold text-foreground">
                      {formatPrice(totals.subtotal)}
                    </span>
                  </div>
                  <Link
                    href="/cart"
                    className={cn(
                      "block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-white",
                      "transition-all duration-200 hover:bg-primary-dark active:scale-95"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    Voir le panier
                  </Link>
                </div>
              )}
            </>
          ) : optimisticItems.length > 0 ? (
            /* ─── Optimistic items (persisted locally) ────── */
            <>
              {optimisticItems.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors duration-150"
                  onClick={() => setOpen(false)}
                >
                  <div className="relative h-12 w-12 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                    <Image
                      src={item.thumbnail}
                      alt={item.name}
                      fill
                      className="object-contain p-1"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-primary">
                        {formatPrice(item.price)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        × {item.qty}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              <div className="px-4 pt-3 pb-1 border-t border-border mt-1 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sous-total</span>
                  <span className="text-base font-bold text-foreground">
                    {formatPrice(optimisticSubtotal)}
                  </span>
                </div>
                <Link
                  href="/cart"
                  className={cn(
                    "block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-white",
                    "transition-all duration-200 hover:bg-primary-dark active:scale-95"
                  )}
                  onClick={() => setOpen(false)}
                >
                  Voir le panier
                </Link>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
