"use client";

/**
 * Cart Storage — persists cart token & optimistic items in localStorage.
 *
 * The backend returns X-Cart-Token in response headers.
 * We store it locally so subsequent requests (GET /cart) include it.
 * We also mirror the token to a first-party cookie so that Next.js
 * Server Components (SSR) can forward it to the backend API.
 * We also store optimistic items for instant display after page refresh.
 */

import type { CartItemPreview } from "./cart-events";
import { setCartCookie, clearCartCookie } from "../utils/cart-cookie";

const TOKEN_KEY = "sugu:cart-token";
const ITEMS_KEY = "sugu:cart-items";

// ─── Token ────────────────────────────────────────────────

export function getCartToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setCartToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  // Mirror to first-party cookie so Next.js SSR can read it
  setCartCookie(token);
}

export function clearCartToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  // Also remove the first-party cookie
  clearCartCookie();
}

// ─── Optimistic Items ─────────────────────────────────────

export function getCartItems(): CartItemPreview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCartItems(items: CartItemPreview[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function addCartItem(item: CartItemPreview) {
  const items = getCartItems();
  const existing = items.find((i) => i.id === item.id);
  if (existing) {
    existing.qty += item.qty;
  } else {
    items.push(item);
  }
  setCartItems(items);
}

export function getCartItemCount(): number {
  return getCartItems().reduce((sum, i) => sum + i.qty, 0);
}

export function clearCartItems() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ITEMS_KEY);
}
