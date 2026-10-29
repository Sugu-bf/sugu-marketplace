// ─── Types (from API layer) ──────────────────────────────────

export type {
  UserProfile,
  SecurityInfo,
  UserPreferences,
  AccountPageData,
  Address,
  AddressInput,
  Order,
  OrderItem,
  PaginatedOrders,
  Notification,
  NotificationGroup,
  NotificationData,
  ReferralData,
  ReferredUser,
  FaqItem,
} from "./api/account.types";

// ─── Schemas (from API layer) ────────────────────────────────

export {
  ApiProfileSchema,
  ApiSecuritySchema,
  ApiPreferencesSchema,
  ApiAccountPageResponseSchema,
  ApiAddressSchema,
  ApiAddressListResponseSchema,
  ApiOrderListResponseSchema,
  ApiNotificationListResponseSchema,
  ApiReferralResponseSchema,
} from "./api/account.schemas";

// ─── API functions ───────────────────────────────────────────

export {
  fetchAccountPageData,
  fetchAddresses,
  fetchOrders,
  fetchNotifications,
  fetchReferralData,
  markNotificationRead,
  markAllNotificationsRead,
  updateProfile,
  sendPhoneChangeCode,
  confirmPhoneChange,
  updatePreferences,
  changePassword,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  sendAccountDeletionCode,
  deleteAccount,
  exportAccountData,
} from "./api/account.api";

// ─── SSR Queries ─────────────────────────────────────────────

export {
  queryAccountPageData,
  queryAddresses,
  queryOrders,
  queryNotifications,
  queryReferralData,
  queryFaqItems,
} from "./queries/account-queries";

// ─── Order status, filters and pages of the order list ───────

export {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_FILTERS,
  orderStatusBadge,
  parseOrdersPage,
  ordersPageHref,
} from "./models/order-status";
export type { OrderStatusBadge, OrderStatusVariant } from "./models/order-status";
