// ─── Models (legacy, kept for backward compat of UI types) ───
export {
  CheckoutStepSchema,
  CheckoutSessionSchema,
  DeliveryAgencySchema,
  ShippingMethodSchema,
  ShippingAddressSchema,
  OrderSummaryItemSchema,
  CheckoutPageDataSchema,
} from "./models/checkout";

export type {
  CheckoutStep,
  CheckoutSession,
  DeliveryAgency,
  ShippingMethod,
  ShippingAddress,
  OrderSummaryItem,
  CheckoutPageData,
} from "./models/checkout";

// ─── API Schemas (canonical, from real backend) ──────────────
export {
  CheckoutLineItemSchema,
  PricingSnapshotSchema,
  CheckoutWarningSchema,
  CheckoutSessionApiSchema,
  CreateSessionResponseSchema,
  ShowSessionResponseSchema,
  ShippingOptionsResponseSchema,
  DeliveryPartnerSchema,
  DeliveryRateSchema,
  ApplyCouponResponseSchema,
  RemoveCouponResponseSchema,
  PlaceOrderResponseSchema,
} from "./api/checkout.schemas";

// ─── API Types ───────────────────────────────────────────────
export type {
  CheckoutLineItem,
  PricingSnapshot,
  CheckoutWarning,
  CheckoutAddress,
  CheckoutSessionApi,
  DeliveryPartner,
  DeliveryRate,
  DeliveryService,
  DeliveryZone,
  ApplyCouponResponse,
  RemoveCouponResponse,
  PlaceOrderResponse,
  CheckoutPageState,
  CreateCheckoutSessionPayload,
  PlaceOrderPayload,
  UpdateCheckoutSessionPayload,
} from "./api/checkout.types";

// ─── API Functions ───────────────────────────────────────────
export {
  getCheckoutSession,
  createCheckoutSession,
  updateCheckoutSession,
  getShippingOptions,
  applyCoupon,
  removeCoupon,
  placeOrder,
  isConflictError,
  isSessionExpiredError,
  checkoutErrorMessage,
} from "./api/checkout.api";

// ─── Idempotency ─────────────────────────────────────────────
export {
  generateIdempotencyKey,
  sessionIdempotencyKey,
  orderIdempotencyKey,
  acquireMutex,
  releaseMutex,
  withMutex,
} from "./utils/idempotency";

// ─── Queries ─────────────────────────────────────────────────
export { queryCheckoutSession } from "./queries/checkout-queries";
export type { CheckoutQueryResult } from "./queries/checkout-queries";
