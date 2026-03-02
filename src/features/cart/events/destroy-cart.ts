/**
 * Post-order cart cleanup.
 *
 * After a successful placeOrder, we must:
 * 1. Delete the cart on the backend (DELETE /cart)
 * 2. Clear the Zustand store
 * 3. Clear the localStorage token + items
 * 4. Notify the header via cartChanged event
 *
 * This is fire-and-forget — the order is already placed,
 * so we don't block navigation on cart cleanup.
 */

"use client";

import { clearCart as clearCartApi } from "../api/cart.api";
import { clearCartToken } from "../api/cart-token";
import { clearCartItems } from "./cart-storage";
import { emitCartChanged } from "./cart-events";
import { useCartStore } from "../store/cart-store";

export function destroyCartAfterOrder(): void {
  // 1. Clear Zustand store (immediate — updates UI everywhere)
  useCartStore.getState().clearCart();

  // 2. Clear localStorage
  clearCartToken();
  clearCartItems();

  // 3. Notify header badge (count → 0)
  emitCartChanged({ action: "remove" });

  // 4. Tell backend to destroy the cart session (fire-and-forget)
  clearCartApi().catch(() => {
    // Silently ignore — order is already placed.
    // The backend will garbage-collect stale carts anyway.
  });
}
