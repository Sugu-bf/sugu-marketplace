import { z } from "zod";

// ─── Order Status ────────────────────────────────────────────

export const OrderStatusSchema = z.enum([
  "confirmed",
  "preparing",
  "shipping",
  "delivered",
  "cancelled",
]);

// ─── Tracking Step ───────────────────────────────────────────

export const TrackingStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["completed", "current", "upcoming"]),
  date: z.string().nullable(),        // formatted date string
  dateLabel: z.string().nullable(),    // e.g. "20 Fév, 10:30" or "Estimé : 22 Fév"
});

// ─── Timeline Event ──────────────────────────────────────────

export const TimelineEventSchema = z.object({
  id: z.string(),
  date: z.string(),                   // e.g. "21 Fév 09:00"
  description: z.string(),
  isLatest: z.boolean(),
});

// ─── Delivery Driver ─────────────────────────────────────────

export const DeliveryDriverSchema = z.object({
  name: z.string(),
  phone: z.string(),
  avatar: z.string().optional(),
});

// ─── Order Item (compact) ────────────────────────────────────

export const OrderItemSchema = z.object({
  productId: z.number(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  thumbnail: z.string(),
});

// ─── Tracked Order (full page data) ──────────────────────────

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
});

// ─── Derived Types ───────────────────────────────────────────

export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type TrackingStep = z.infer<typeof TrackingStepSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type DeliveryDriver = z.infer<typeof DeliveryDriverSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type TrackedOrder = z.infer<typeof TrackedOrderSchema>;
