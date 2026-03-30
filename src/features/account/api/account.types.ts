/**
 * Account UI Types — frontend-friendly shapes derived from API schemas.
 *
 * Components import these types, never raw API shapes.
 * All field names are camelCase.
 */

import type { z } from "zod";
import type {
  ApiProfileSchema,
  ApiSecuritySchema,
  ApiPreferencesSchema,
  ApiAddressSchema,
  ApiOrderListItemSchema,
  ApiOrderItemSchema,
  ApiNotificationItemSchema,
  ApiNotificationGroupSchema,
  ApiReferredUserSchema,
} from "./account.schemas";

// ─── Raw API types (snake_case) ──────────────────────────────

export type ApiProfile = z.infer<typeof ApiProfileSchema>;
export type ApiSecurity = z.infer<typeof ApiSecuritySchema>;
export type ApiPreferences = z.infer<typeof ApiPreferencesSchema>;
export type ApiAddress = z.infer<typeof ApiAddressSchema>;
export type ApiOrderListItem = z.infer<typeof ApiOrderListItemSchema>;
export type ApiOrderItem = z.infer<typeof ApiOrderItemSchema>;
export type ApiNotificationItem = z.infer<typeof ApiNotificationItemSchema>;
export type ApiNotificationGroup = z.infer<typeof ApiNotificationGroupSchema>;
export type ApiReferredUser = z.infer<typeof ApiReferredUserSchema>;

// ─── UI-facing mapped types (camelCase) ──────────────────────

/** User profile for display in account pages */
export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  phoneE164: string | null;
  phoneVerified: boolean;
  avatarUrl: string | null;
  userType: string;
  referralCode: string | null;
  createdAt: string;
}

/** Security info for the account page */
export interface SecurityInfo {
  twoFactorEnabled: boolean;
  passwordUpdatedAt: string | null;
  passwordLastChanged: string; // Computed relative string e.g. "Il y a 3 mois"
}

/** User preferences */
export interface UserPreferences {
  newsletterSubscribed: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  language: string;
  currency: string;
}

/** Aggregated account page data */
export interface AccountPageData {
  profile: UserProfile;
  security: SecurityInfo;
  preferences: UserPreferences;
}

/** Address for display */
export interface Address {
  id: string;
  label: string;
  fullName: string | null;
  phone: string | null;
  addressLine: string | null;
  addressComplement: string | null;
  city: string;
  state: string | null;
  countryCode: string;
  isDefault: boolean;
  isVerified: boolean;
}

/** Address input for create/update mutations */
export interface AddressInput {
  label: string;
  full_name: string;
  phone: string;
  address_line: string;
  address_complement?: string | null;
  city: string;
  state?: string | null;
  country_code: string;
  is_default?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

/** Order item for display */
export interface OrderItem {
  name: string;
  quantity: number;
  image: string | null;
}

/** Order for display in the list */
export interface Order {
  id: string;
  displayId: string;
  date: string;
  relativeDate: string;
  statusCode: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  items: OrderItem[];
  // COD Mixte fields
  is_cod?: boolean;
  cod_flow_type?: "mixte" | "legacy" | null;
  delivery_fee_paid?: boolean;
  product_fee_paid?: boolean;
  cod_current_step?: string | null;
}

/** Paginated orders response */
export interface PaginatedOrders {
  orders: Order[];
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

/** Notification item for display */
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Notification group (by date) */
export interface NotificationGroup {
  label: string;
  items: Notification[];
}

/** Notifications response */
export interface NotificationData {
  groups: NotificationGroup[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
}

/** Referral data */
export interface ReferredUser {
  name: string;
  date: string;
  status: string;
}

export interface ReferralData {
  referralCode: string | null;
  referralLink: string | null;
  totalReferred: number;
  totalEarnings: number;
  rewardPerReferral: number;
  referredUsers: ReferredUser[];
}

/** FAQ item (static, no API needed) */
export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}
