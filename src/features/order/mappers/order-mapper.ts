import type { OrderTrackingApiData, TrackedOrder, BackendOrderStatus, OrderStatus } from "../models/order";

/**
 * Map backend order status to simplified UI status.
 * The UI shows 4 states + cancelled; the backend has 10.
 */
function mapBackendStatusToUI(status: BackendOrderStatus): OrderStatus {
  const mapping: Record<BackendOrderStatus, OrderStatus> = {
    pending: "confirmed",
    awaiting_payment: "confirmed",
    confirmed: "confirmed",
    processing: "preparing",
    packed: "preparing",
    shipped: "shipping",
    delivered: "delivered",
    canceled: "cancelled",
    returned: "cancelled",
    failed: "cancelled",
  };
  return mapping[status] ?? "confirmed";
}

/**
 * Format an ISO timestamp into a short French display date.
 * e.g. "2026-02-21T09:00:00Z" → "21 Fév 09:00"
 */
function formatTimelineDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const months = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
      "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${hours}:${minutes}`;
  } catch {
    return isoDate;
  }
}

/**
 * Transform the raw API response into the TrackedOrder shape expected by UI components.
 * Zero UI changes required — the UI still receives the same flat props.
 */
export function mapApiToTrackedOrder(api: OrderTrackingApiData): TrackedOrder {
  return {
    orderNumber: api.reference,
    status: mapBackendStatusToUI(api.statusCode),

    trackingSteps: api.statusSteps,

    timeline: api.timeline.map((event) => ({
      id: event.id,
      date: formatTimelineDate(event.timestamp),
      description: event.title + (event.description ? ` — ${event.description}` : ""),
      isLatest: event.isLatest,
    })),

    // Delivery info
    agencyName: api.delivery.agency.name,
    agencyRating: api.delivery.agency.rating,
    shippingMethod: api.delivery.method.label
      + (api.delivery.method.isExpress ? " (Express)" : ""),
    deliveryAddress: api.delivery.address,
    driver: api.delivery.driver
      ? {
          name: api.delivery.driver.name,
          phone: api.delivery.driver.phone ?? "",
        }
      : null,

    // ETA
    estimatedDate: api.eta.date ?? "À confirmer",
    estimatedTimeRange: api.eta.timeRange ?? "—",
    deliveryProgress: api.eta.progress,

    // Items
    items: api.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      image: item.image,
    })),

    // Pricing
    subtotal: api.pricing.subtotal,
    shippingCost: api.pricing.shipping,
    shippingLabel: api.pricing.paymentMethod.includes("Express") ? "Express" : null,
    discount: api.pricing.discount,
    total: api.pricing.total,
    paymentMethod: api.pricing.paymentMethod,
  };
}
