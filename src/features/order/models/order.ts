import { z } from "zod";

// ─── Backend Status Enum (matches OrderStatus PHP enum) ──────

export const BackendOrderStatusSchema = z.enum([
  "pending",
  "awaiting_payment",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "canceled",
  "returned",
  "failed",
]);

// ─── UI Status (simplified 4-step + error states) ───────────

export const OrderStatusSchema = z.enum([
  "confirmed",
  "preparing",
  "shipping",
  "delivered",
  "cancelled",
]);

// ─── Tracking Step (from backend statusSteps) ────────────────

export const TrackingStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["completed", "current", "upcoming"]),
  date: z.string().nullable(), // ISO date string
  dateLabel: z.string().nullable(), // e.g. "20 Fév, 10:30" or "Estimé : 22 Fév"
});

// ─── Timeline Event — API shape (from backend) ──────────────

export const ApiTimelineEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  timestamp: z.string(),
  isLatest: z.boolean(),
});

// ─── Timeline Event — UI shape (for components) ─────────────

export const TimelineEventSchema = z.object({
  id: z.string(),
  date: z.string(), // formatted display date e.g. "21 Fév 09:00"
  description: z.string(),
  isLatest: z.boolean(),
});

// ─── Delivery Driver ─────────────────────────────────────────

export const DeliveryDriverSchema = z.object({
  name: z.string(),
  phone: z.string().nullable(),
  avatar: z.string().optional(),
});

// ─── Order Item (compact) ────────────────────────────────────

export const OrderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  total: z.number(),
  image: z.string().nullable(),
});

// ─── API Response Schema (matches backend formatOrderTracking) ─

export const OrderTrackingApiSchema = z.object({
  id: z.string(),
  reference: z.string(),
  createdAt: z.string(),
  statusCode: BackendOrderStatusSchema,
  step: z.number(),

  statusSteps: z.array(TrackingStepSchema),
  timeline: z.array(ApiTimelineEventSchema),

  delivery: z.object({
    agency: z.object({
      name: z.string(),
      rating: z.number(),
    }),
    method: z.object({
      label: z.string(),
      isExpress: z.boolean(),
    }),
    address: z.string(),
    driver: DeliveryDriverSchema.nullable(),
  }),

  eta: z.object({
    date: z.string().nullable(),
    timeRange: z.string().nullable(),
    progress: z.number().min(0).max(100),
  }),

  items: z.array(OrderItemSchema),

  pricing: z.object({
    subtotal: z.number(),
    shipping: z.number(),
    discount: z.number(),
    total: z.number(),
    currency: z.string(),
    paymentStatus: z.enum(["paid", "pending", "failed", "unpaid", "partial"]),
    paymentMethod: z.string(),
  }),

  // ── COD Mixte split-payment data (optional — only for COD orders) ──
  codMixte: z.object({
    isCodMixte: z.boolean(),
    deliveryFeePaid: z.boolean(),
    productFeePaid: z.boolean(),
    deliveryFeeAmount: z.number(),
    productFeeAmount: z.number(),
    deliveryFeePaidAt: z.string().nullable(),
    productFeePaidAt: z.string().nullable(),
    vendorConfirmedAt: z.string().nullable(),
    payDeliveryFeeUrl: z.string().nullable(),
    payProductFeeUrl: z.string().nullable(),
    /** Current step in the COD Mixte flow */
    currentStep: z.enum([
      "awaiting_vendor",    // Waiting for vendor stock confirmation
      "awaiting_negotiation", // Delivery fee negotiation in progress
      "awaiting_delivery_payment", // Client must pay delivery fee
      "awaiting_pickup",    // Courier en route to collect
      "awaiting_inspection", // Client inspecting products
      "awaiting_product_payment", // Client must pay product fee
      "awaiting_code",      // Client received code, giving to courier
      "completed",          // Both fees paid, delivery done
    ]),
  }).nullable().optional(),
});

/** The full API response wrapper */
export const OrderTrackingResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    order: OrderTrackingApiSchema,
  }),
});

// ─── UI Model (transformed from API response for page props) ─

export const TrackedOrderSchema = z.object({
  orderNumber: z.string(),
  status: OrderStatusSchema,
  trackingSteps: z.array(TrackingStepSchema),
  timeline: z.array(TimelineEventSchema),

  // Delivery info
  agencyName: z.string(),
  agencyRating: z.number(),
  shippingMethod: z.string(),
  deliveryAddress: z.string(),
  driver: DeliveryDriverSchema.nullable(),

  // Estimated delivery
  estimatedDate: z.string(),
  estimatedTimeRange: z.string(),
  deliveryProgress: z.number().min(0).max(100),

  // Order items + pricing
  items: z.array(OrderItemSchema),
  subtotal: z.number(),
  shippingCost: z.number(),
  shippingLabel: z.string().nullable(),
  discount: z.number(),
  total: z.number(),
  paymentMethod: z.string(),
  paymentStatus: z.enum(["paid", "pending", "failed", "unpaid", "partial"]),

  // COD Mixte split-payment state
  codMixte: z.object({
    isCodMixte: z.boolean(),
    deliveryFeePaid: z.boolean(),
    productFeePaid: z.boolean(),
    deliveryFeeAmount: z.number(),
    productFeeAmount: z.number(),
    deliveryFeePaidAt: z.string().nullable(),
    productFeePaidAt: z.string().nullable(),
    vendorConfirmedAt: z.string().nullable(),
    payDeliveryFeeUrl: z.string().nullable(),
    payProductFeeUrl: z.string().nullable(),
    currentStep: z.string(),
  }).nullable(),
});

// ─── Derived Types ───────────────────────────────────────────

export type BackendOrderStatus = z.infer<typeof BackendOrderStatusSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type TrackingStep = z.infer<typeof TrackingStepSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type ApiTimelineEvent = z.infer<typeof ApiTimelineEventSchema>;
export type DeliveryDriver = z.infer<typeof DeliveryDriverSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderTrackingApiData = z.infer<typeof OrderTrackingApiSchema>;
export type TrackedOrder = z.infer<typeof TrackedOrderSchema>;
