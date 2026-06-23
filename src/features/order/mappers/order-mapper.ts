import type { OrderTrackingApiData, TrackedOrder, BackendOrderStatus, OrderStatus, CanonicalTimelineStep, TrackingStep } from "../models/order";

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
 * D3b — buyer-facing labels for the detailed timeline. The canonical projection
 * carries its own (internal) labels; here we preserve the EXACT labels the buyer
 * already sees. New milestones the buyer did not see before (awaiting_inspection)
 * use a clear French label.
 */
const CLIENT_TIMELINE_LABEL: Record<string, string> = {
  placed: "En attente",
  vendor_confirmed: "Confirmée",
  preparing: "En préparation",
  delivery_fee_paid: "Paiement liv. (COD Mixte)",
  in_transit: "Expédiée",
  awaiting_inspection: "Vérification produits",
  product_fee_paid: "Paiement des produits",
  delivered: "Livrée",
  delivery_failed: "Échec livraison",
  canceled: "Annulée",
  returned: "Retournée",
};

/**
 * D3b — derive the 4-step short stepper from the canonical projection (same
 * source as the detailed timeline). The N canonical keys are mapped onto the 4
 * existing buyer steps; internal keys (vendor_handoff, agency_accepted, …) never
 * leak into the stepper. Always returns exactly 4 steps with their prior labels.
 */
function deriveStepperFromCanonical(steps: CanonicalTimelineStep[]): TrackingStep[] {
  const byKey = new Map(steps.map((s) => [s.key, s] as const));
  const defs = [
    { id: "confirmed", label: "Confirmée", key: "vendor_confirmed" },
    { id: "preparing", label: "En préparation", key: "preparing" },
    { id: "shipping", label: "En livraison", key: "in_transit" },
    { id: "delivered", label: "Livrée", key: "delivered" },
  ];

  const reachedAt = defs.map((d) => byKey.get(d.key)?.timestamp ?? null);
  let lastReached = -1;
  reachedAt.forEach((ts, i) => {
    if (ts) lastReached = i;
  });

  return defs.map((d, i) => {
    const ts = reachedAt[i];
    const status: "completed" | "current" | "upcoming" = ts
      ? i === lastReached
        ? "current"
        : "completed"
      : "upcoming";
    return {
      id: d.id,
      label: d.label,
      status,
      date: ts,
      dateLabel: ts ? formatTimelineDate(ts) : null,
    };
  });
}

/**
 * Transform the raw API response into the TrackedOrder shape expected by UI components.
 * Zero UI changes required — the UI still receives the same flat props.
 */
export function mapApiToTrackedOrder(api: OrderTrackingApiData): TrackedOrder {
  // D3b — the buyer sees global jalons only. The backend (buildForRole 'client')
  // now drops per-boutique steps at the source, so NO frontend filter is needed
  // — the front no longer filters what it no longer receives.
  const canonicalGlobal = api.canonical_timeline;
  const COD_KEYS = new Set(["delivery_fee_paid", "product_fee_paid"]);
  // Detailed "Historique" = reached milestones + the COD payment jalons (kept
  // even while pending). Not-yet-reached milestones live in the short stepper.
  const historySteps = canonicalGlobal.filter(
    (s) => s.status !== "upcoming" || COD_KEYS.has(s.key),
  );

  return {
    orderNumber: api.reference,
    status: mapBackendStatusToUI(api.statusCode),

    shipmentId: api.shipmentId ?? null,

    // D3b — both representations now derive from the single canonical projection.
    // api.statusSteps / api.timeline (legacy) are no longer read.
    // Stepper: exactly 4 steps, derived from canonical (internal keys never leak).
    trackingSteps: deriveStepperFromCanonical(canonicalGlobal),

    // Detailed "Historique": reached milestones + COD jalons, newest first
    // (preserves the prior buyer ordering). Buyer labels preserved.
    timeline: [...historySteps].reverse().map((s) => ({
      id: `${s.key}-${s.store_id ?? ""}-${s.timestamp ?? "pending"}`,
      date: s.timestamp ? formatTimelineDate(s.timestamp) : "En attente",
      description:
        (CLIENT_TIMELINE_LABEL[s.key] ?? s.label) +
        (s.description ? ` — ${s.description}` : ""),
      isLatest: s.status === "current",
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
    paymentStatus: api.pricing.paymentStatus,

    // COD Mixte split-payment data
    codMixte: api.codMixte
      ? {
          isCodMixte: api.codMixte.isCodMixte,
          deliveryFeePaid: api.codMixte.deliveryFeePaid,
          productFeePaid: api.codMixte.productFeePaid,
          deliveryFeeAmount: api.codMixte.deliveryFeeAmount,
          productFeeAmount: api.codMixte.productFeeAmount,
          deliveryFeePaidAt: api.codMixte.deliveryFeePaidAt,
          productFeePaidAt: api.codMixte.productFeePaidAt,
          vendorConfirmedAt: api.codMixte.vendorConfirmedAt,
          payDeliveryFeeUrl: api.codMixte.payDeliveryFeeUrl,
          payProductFeeUrl: api.codMixte.payProductFeeUrl,
          shipmentId: api.codMixte.shipmentId ?? null,
          currentStep: api.codMixte.currentStep,
        }
      : null,
  };
}
