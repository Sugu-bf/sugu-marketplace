import { z } from "zod";

// ─── Checkout Steps ──────────────────────────────────────────

export const CheckoutStepSchema = z.enum(["cart", "address", "shipping", "payment", "confirmation"]);

export const CheckoutSessionSchema = z.object({
  step: CheckoutStepSchema,
  addressId: z.number().nullable(),
  agencyId: z.string().nullable(),
  shippingMethod: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  couponCode: z.string().nullable(),
});

// ─── Delivery Agency ─────────────────────────────────────────

export const DeliveryAgencySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string(),              // path to agency logo
  rating: z.number().min(0).max(5),
  reviewCount: z.number(),
});

// ─── Shipping Method (linked to an agency) ───────────────────

export const ShippingMethodSchema = z.object({
  id: z.string(),
  agencyId: z.string(),          // links to DeliveryAgency.id
  name: z.string(),
  description: z.string(),
  price: z.number(),
  estimatedDays: z.string(),
  icon: z.enum(["truck", "zap", "store"]),
});

// ─── Shipping Address ────────────────────────────────────────

export const ShippingAddressSchema = z.object({
  id: z.number(),
  label: z.string(),             // e.g. "Maison", "Bureau"
  fullName: z.string(),
  street: z.string(),
  city: z.string(),
  country: z.string(),
  phone: z.string().optional(),
  isDefault: z.boolean(),
});

// ─── Order Summary Item (compact version for checkout) ───────

export const OrderSummaryItemSchema = z.object({
  productId: z.number(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  thumbnail: z.string(),
});

// ─── Checkout Data (full page data) ──────────────────────────

export const CheckoutPageDataSchema = z.object({
  currentStep: CheckoutStepSchema,
  completedSteps: z.array(CheckoutStepSchema),
  deliveryAgencies: z.array(DeliveryAgencySchema),
  shippingMethods: z.array(ShippingMethodSchema),
  selectedAgencyId: z.string().nullable(),
  selectedShippingMethodId: z.string().nullable(),
  savedAddresses: z.array(ShippingAddressSchema),
  selectedAddressId: z.number().nullable(),
  orderItems: z.array(OrderSummaryItemSchema),
  subtotal: z.number(),
  shippingCost: z.number(),
  discount: z.number(),
  total: z.number(),
  couponCode: z.string().nullable(),
});

// ─── Derived Types ───────────────────────────────────────────

export type CheckoutStep = z.infer<typeof CheckoutStepSchema>;
export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;
export type DeliveryAgency = z.infer<typeof DeliveryAgencySchema>;
export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;
export type OrderSummaryItem = z.infer<typeof OrderSummaryItemSchema>;
export type CheckoutPageData = z.infer<typeof CheckoutPageDataSchema>;
