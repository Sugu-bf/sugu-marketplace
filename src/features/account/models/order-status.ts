/**
 * How the account shows the status of an order, and how its list is filtered
 * and paged. Every status of the backend `OrderStatus` enum has its own label:
 * one left out was shown « En attente », whatever the order had become.
 */

export type OrderStatusVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "muted";

export interface OrderStatusBadge {
  label: string;
  variant: OrderStatusVariant;
}

export const ORDER_STATUS_CONFIG: Record<string, OrderStatusBadge> = {
  pending: { label: "En attente", variant: "secondary" },
  awaiting_payment: { label: "En attente de paiement", variant: "warning" },
  confirmed: { label: "Confirmée", variant: "primary" },
  processing: { label: "En préparation", variant: "primary" },
  packed: { label: "Emballée", variant: "primary" },
  shipped: { label: "En livraison", variant: "primary" },
  delivered: { label: "Livrée", variant: "success" },
  canceled: { label: "Annulée", variant: "danger" },
  cancelled: { label: "Annulée", variant: "danger" },
  returned: { label: "Retournée", variant: "muted" },
  failed: { label: "Échouée", variant: "danger" },
};

/**
 * The badge of an order. A status this list does not know yet keeps the
 * label the backend gives it rather than passing for a pending order.
 */
export function orderStatusBadge(statusCode: string | null, backendLabel?: string): OrderStatusBadge {
  const known = statusCode ? ORDER_STATUS_CONFIG[statusCode] : undefined;
  if (known) return known;
  return { label: backendLabel?.trim() || ORDER_STATUS_CONFIG.pending.label, variant: "secondary" };
}

/**
 * The filters of the list. « En livraison » asks `in_delivery`: the orders
 * shipped or with a shipment on its way (an order in delivery is seldom
 * `shipped` itself, so filtering on that status listed nothing).
 */
export const ORDER_STATUS_FILTERS: ReadonlyArray<{ label: string; value: string | undefined }> = [
  { label: "Toutes", value: undefined },
  { label: "En attente", value: "pending" },
  { label: "Confirmées", value: "confirmed" },
  { label: "En livraison", value: "in_delivery" },
  { label: "Livrées", value: "delivered" },
  { label: "Annulées", value: "canceled" },
];

/** The page asked in the address: a whole number from 1, anything else is 1. */
export function parseOrdersPage(value: string | undefined): number {
  if (!value || !/^\d{1,6}$/.test(value)) return 1;
  return Math.max(1, Number(value));
}

/** The address of a page of the list, keeping its filter. */
export function ordersPageHref(status: string | undefined, page = 1): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/account/orders?${query}` : "/account/orders";
}
