"use client";

/**
 * Cart Event Bus — emits/listens to cart-change events.
 *
 * When ANY component (ProductCard, ProductActions, etc.) adds to cart,
 * it fires a "cart-changed" event WITH product details.
 * CartDropdown listens, stores optimistic items, and displays them.
 *
 * Uses native CustomEvent — works everywhere, zero deps.
 */

const CART_EVENT = "sugu:cart-changed";

export interface CartItemPreview {
  id: string;
  name: string;
  slug: string;
  thumbnail: string;
  price: number;
  qty: number;
}

export interface CartChangeDetail {
  action: "add" | "remove" | "update";
  /** Product info for optimistic display in dropdown */
  item?: CartItemPreview;
}

/** Emit a cart-changed event. Call after a successful cart mutation. */
export function emitCartChanged(detail?: CartChangeDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail }));
}

/** Subscribe to cart-changed events. Returns cleanup function. */
export function onCartChanged(callback: (detail?: CartChangeDetail) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => callback((e as CustomEvent<CartChangeDetail>).detail);
  window.addEventListener(CART_EVENT, handler);
  return () => window.removeEventListener(CART_EVENT, handler);
}
