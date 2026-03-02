// ─── API types (from real backend) ───────────────────────────
export type { CartUI, CartLineUI, CartTotalsUI, CartWarning } from "./api/cart.types";

// ─── Hooks ───────────────────────────────────────────────────
export { useCart } from "./hooks/use-cart";
export type { UseCartReturn } from "./hooks/use-cart";

// ─── Events ──────────────────────────────────────────────────
export { emitCartChanged, onCartChanged } from "./events/cart-events";
export type { CartChangeDetail, CartItemPreview } from "./events/cart-events";

// ─── Note: queryCart is NOT exported here to avoid server-only imports ──
// Import directly: import { queryCart } from "@/features/cart/queries/cart-queries";
