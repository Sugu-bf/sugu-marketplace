/**
 * Cart Hooks — client-side cart state management with API integration.
 *
 * Provides:
 * - Optimistic UI with backend reconciliation
 * - Per-line serialization (abort previous on rapid qty changes)
 * - Anti-double-click on CTAs
 * - Network error handling with retry
 * - Header sync via cart-events
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  fetchCart,
  updateLineQty,
  removeLine,
  clearCart,
  applyCoupon,
  removeCoupon,
  createCheckoutSession,
  placeOrder,
  generateIdempotencyKey,
  getCartErrorMessage,
  isStockConflict,
} from "../api/cart.api";
import type { CartUI, CartLineUI } from "../api/cart.types";
import { emitCartChanged } from "../events/cart-events";
import { destroyCartAfterOrder } from "../events/destroy-cart";

// ─── Types ───────────────────────────────────────────────────

export interface UseCartReturn {
  /** Current cart state */
  cart: CartUI;

  /** Loading states */
  isLoading: boolean;
  isUpdatingLine: (lineId: number) => boolean;
  isRemovingLine: (lineId: number) => boolean;
  isClearing: boolean;
  isApplyingCoupon: boolean;
  isCheckingOut: boolean;

  /** Error state */
  error: string | null;
  clearError: () => void;

  /** Actions */
  updateQty: (lineId: number, newQty: number) => void;
  removeItem: (lineId: number) => void;
  clearAll: () => void;
  submitCoupon: (code: string) => Promise<string | null>;
  removeCouponCode: () => void;
  startCheckout: () => void;
  startMobileMoneyPayment: () => void;
  refetch: () => void;

  /** Coupon state */
  couponMessage: string | null;
}

// ─── Empty cart sentinel ─────────────────────────────────────

const EMPTY_CART: CartUI = {
  lines: [],
  totals: {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    shippingDiscount: 0,
    fees: 0,
    total: 0,
    itemCount: 0,
    qtyTotal: 0,
    currency: "XOF",
    shippingFree: true,
  },
  couponCode: null,
  warnings: [],
  isEmpty: true,
};

// ─── Hook ────────────────────────────────────────────────────

export function useCart(initialCart: CartUI): UseCartReturn {
  const [cart, setCart] = useState<CartUI>(initialCart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  // Per-line loading/abort tracking
  const updatingLines = useRef<Map<number, AbortController>>(new Map());
  const [updatingLineIds, setUpdatingLineIds] = useState<Set<number>>(new Set());

  const removingLines = useRef<Set<number>>(new Set());
  const [removingLineIds, setRemovingLineIds] = useState<Set<number>>(new Set());

  const [isClearing, setIsClearing] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // ─── Helpers ─────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);

  const reconcileCart = useCallback((newCart: CartUI) => {
    setCart(newCart);
    // Notify header
    emitCartChanged({ action: "update" });
  }, []);

  // ─── Refetch ─────────────────────────────────────────────

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const freshCart = await fetchCart();
      setCart(freshCart);
    } catch (err) {
      setError(getCartErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Client-side refetch on mount ────────────────────────
  // The guest_cart cookie is scoped to api.mysugu.com and is NOT
  // available to the Next.js server during SSR. Only a client-side
  // fetch with credentials:"include" can send it. So we always
  // reconcile after hydration.
  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    refetch();
  }, [refetch]);

  // ─── Update Qty (serialized per line) ────────────────────

  const updateQty = useCallback(
    (lineId: number, newQty: number) => {
      if (newQty < 1) return;

      // Abort any in-flight request for this line
      const prevController = updatingLines.current.get(lineId);
      if (prevController) {
        prevController.abort();
      }

      const controller = new AbortController();
      updatingLines.current.set(lineId, controller);

      // Optimistic update
      setCart((prev) => ({
        ...prev,
        lines: prev.lines.map((l) =>
          l.id === lineId
            ? { ...l, qty: newQty, lineTotal: l.unitPrice * newQty }
            : l
        ),
        totals: {
          ...prev.totals,
          // Recalculate optimistic totals
          qtyTotal: prev.lines.reduce(
            (sum, l) => sum + (l.id === lineId ? newQty : l.qty),
            0
          ),
        },
      }));

      setUpdatingLineIds((prev) => new Set(prev).add(lineId));
      setError(null);

      updateLineQty(lineId, newQty, controller.signal)
        .then((freshCart) => {
          reconcileCart(freshCart);
        })
        .catch((err) => {
          if (err instanceof Error && err.name === "AbortError") return;
          if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "ABORTED") return;

          // Reconcile with current server state
          if (isStockConflict(err)) {
            setError(getCartErrorMessage(err));
            // Refetch to get the real stock-limited state
            fetchCart().then(setCart).catch(() => {});
          } else {
            setError(getCartErrorMessage(err));
          }
        })
        .finally(() => {
          updatingLines.current.delete(lineId);
          setUpdatingLineIds((prev) => {
            const next = new Set(prev);
            next.delete(lineId);
            return next;
          });
        });
    },
    [reconcileCart]
  );

  // ─── Remove Item ─────────────────────────────────────────

  const removeItem = useCallback(
    (lineId: number) => {
      if (removingLines.current.has(lineId)) return;
      removingLines.current.add(lineId);
      setRemovingLineIds((prev) => new Set(prev).add(lineId));
      setError(null);

      removeLine(lineId)
        .then((freshCart) => {
          reconcileCart(freshCart);
          emitCartChanged({ action: "remove" });
        })
        .catch((err) => {
          setError(getCartErrorMessage(err));
        })
        .finally(() => {
          removingLines.current.delete(lineId);
          setRemovingLineIds((prev) => {
            const next = new Set(prev);
            next.delete(lineId);
            return next;
          });
        });
    },
    [reconcileCart]
  );

  // ─── Clear Cart ──────────────────────────────────────────

  const clearAll = useCallback(() => {
    if (isClearing) return;
    setIsClearing(true);
    setError(null);

    // Optimistic
    setCart(EMPTY_CART);

    clearCart()
      .then((freshCart) => {
        reconcileCart(freshCart);
        emitCartChanged({ action: "remove" });
      })
      .catch((err) => {
        setError(getCartErrorMessage(err));
        refetch(); // Revert optimistic
      })
      .finally(() => {
        setIsClearing(false);
      });
  }, [isClearing, reconcileCart, refetch]);

  // ─── Coupon ──────────────────────────────────────────────

  const submitCoupon = useCallback(
    async (code: string): Promise<string | null> => {
      if (isApplyingCoupon) return null;
      setIsApplyingCoupon(true);
      setError(null);
      setCouponMessage(null);

      try {
        const result = await applyCoupon(code);
        reconcileCart(result.cart);
        setCouponMessage(result.message);
        return null; // no error
      } catch (err) {
        const msg = getCartErrorMessage(err);
        return msg; // return error to the coupon input
      } finally {
        setIsApplyingCoupon(false);
      }
    },
    [isApplyingCoupon, reconcileCart]
  );

  const removeCouponCode = useCallback(() => {
    if (isApplyingCoupon) return;
    setIsApplyingCoupon(true);
    setError(null);
    setCouponMessage(null);

    removeCoupon()
      .then((result) => {
        reconcileCart(result.cart);
        setCouponMessage(result.message);
      })
      .catch((err) => {
        setError(getCartErrorMessage(err));
      })
      .finally(() => {
        setIsApplyingCoupon(false);
      });
  }, [isApplyingCoupon, reconcileCart]);

  // ─── Checkout ────────────────────────────────────────────

  const startCheckout = useCallback(() => {
    if (isCheckingOut || cart.isEmpty) return;
    setIsCheckingOut(true);
    setError(null);

    const idempotencyKey = generateIdempotencyKey();

    createCheckoutSession(idempotencyKey)
      .then((result) => {
        // Navigate to checkout with session ID
        window.location.href = `/checkout?session=${result.sessionId}`;
      })
      .catch((err) => {
        setError(getCartErrorMessage(err));
        setIsCheckingOut(false);
      });
    // Note: we don't reset isCheckingOut on success because we're navigating away
  }, [isCheckingOut, cart.isEmpty]);

  // ─── Mobile Money Payment ────────────────────────────────

  const startMobileMoneyPayment = useCallback(() => {
    if (isCheckingOut || cart.isEmpty) return;
    setIsCheckingOut(true);
    setError(null);

    const idempotencyKey = generateIdempotencyKey();

    // Step 1: Create checkout session (required by backend)
    createCheckoutSession(idempotencyKey)
      .then((session) => {
        // Step 2: Place order with the session + correct payment method
        return placeOrder(
          {
            checkout_session_id: session.sessionId,
            payment_method: "moneroo", // Backend expects "cod" or "moneroo"
          },
          idempotencyKey
        );
      })
      .then((result) => {
        // ✅ Order placed — destroy cart before navigating
        destroyCartAfterOrder();

        if (result.paymentUrl) {
          // Redirect to payment provider page
          window.location.href = result.paymentUrl;
        } else {
          // Fallback: navigate to order confirmation
          window.location.href = `/track-order?order=${result.orderNumber}`;
        }
      })
      .catch((err) => {
        setError(getCartErrorMessage(err));
        setIsCheckingOut(false);
      });
  }, [isCheckingOut, cart.isEmpty]);

  // ─── Public API ──────────────────────────────────────────

  return {
    cart,
    isLoading,
    isUpdatingLine: (lineId: number) => updatingLineIds.has(lineId),
    isRemovingLine: (lineId: number) => removingLineIds.has(lineId),
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
  };
}
