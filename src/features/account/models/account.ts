/**
 * Account Models — re-exports from the API layer.
 *
 * This file exists for backward compatibility.
 * All types and schemas are defined in the api/ directory.
 * Components should import from here or from "@/features/account".
 */

// Re-export all types from the API layer
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
} from "../api/account.types";

// Re-export Zod schemas for consumers that need validation
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
} from "../api/account.schemas";
