/**
 * Account API — all account operations go through this module.
 *
 * RULES:
 * - All calls use the central `api` client (lib/api).
 * - No fetch() directly in UI components.
 * - Backend is the source of truth for all account data.
 * - Follows the same pattern as features/cart/api/cart.api.ts.
 */

import { api, v1Url, isApiError } from "@/lib/api";
import {
  ApiAccountPageResponseSchema,
  ApiAddressListResponseSchema,
  ApiAddressSingleResponseSchema,
  ApiOrderListResponseSchema,
  ApiNotificationListResponseSchema,
  ApiReferralResponseSchema,
  ApiMessageResponseSchema,
  ApiMarkedReadResponseSchema,
} from "./account.schemas";
import type {
  AccountPageData,
  Address,
  AddressInput,
  Order,
  PaginatedOrders,
  NotificationData,
  NotificationGroup,
  Notification,
  ReferralData,
  UserProfile,
  SecurityInfo,
  UserPreferences,
  ApiAddress,
  ApiOrderListItem,
  ApiNotificationItem,
  ApiNotificationGroup,
} from "./account.types";

// ─── Mappers ─────────────────────────────────────────────────

/** Compute a relative time string from an ISO date */
function relativeTimeFromDate(isoDate: string | null): string {
  if (!isoDate) return "Jamais modifié";
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 30) return `Il y a ${diffDays} jours`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `Il y a ${diffMonths} mois`;
  const diffYears = Math.floor(diffMonths / 12);
  return `Il y a ${diffYears} an${diffYears > 1 ? "s" : ""}`;
}

/** Map API account response to UI shape */
function mapApiAccountToUI(data: {
  profile: {
    id: string;
    name: string;
    email: string | null;
    email_verified: boolean;
    phone_e164: string | null;
    phone_verified: boolean;
    avatar_url: string | null;
    user_type: string;
    referral_code: string | null;
    created_at: string;
  };
  security: {
    two_factor_enabled: boolean;
    password_updated_at: string | null;
  };
  preferences: {
    newsletter_subscribed: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    language: string;
    currency: string;
  };
}): AccountPageData {
  return {
    profile: {
      id: data.profile.id,
      name: data.profile.name,
      email: data.profile.email,
      emailVerified: data.profile.email_verified,
      phoneE164: data.profile.phone_e164,
      phoneVerified: data.profile.phone_verified,
      avatarUrl: data.profile.avatar_url,
      userType: data.profile.user_type,
      referralCode: data.profile.referral_code,
      createdAt: data.profile.created_at,
    },
    security: {
      twoFactorEnabled: data.security.two_factor_enabled,
      passwordUpdatedAt: data.security.password_updated_at,
      passwordLastChanged: relativeTimeFromDate(
        data.security.password_updated_at
      ),
    },
    preferences: {
      newsletterSubscribed: data.preferences.newsletter_subscribed,
      pushNotifications: data.preferences.push_notifications,
      smsNotifications: data.preferences.sms_notifications,
      language: data.preferences.language,
      currency: data.preferences.currency,
    },
  };
}

/** Map API address to UI shape */
function mapApiAddressToUI(addr: ApiAddress): Address {
  return {
    id: addr.id,
    label: addr.label,
    fullName: addr.full_name,
    phone: addr.phone,
    addressLine: addr.address_line,
    addressComplement: addr.address_complement,
    city: addr.city,
    state: addr.state,
    countryCode: addr.country_code,
    isDefault: addr.is_default,
    isVerified: addr.is_verified,
  };
}

/** Map API order to UI shape */
function mapApiOrderToUI(order: ApiOrderListItem): Order {
  return {
    id: order.id,
    displayId: order.displayId,
    date: order.date,
    relativeDate: order.relativeDate,
    statusCode: order.statusCode,
    status: order.status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    itemCount: order.itemCount,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      image: item.image,
    })),
  };
}

/** Map API notification to UI shape */
function mapApiNotificationToUI(n: ApiNotificationItem): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    actionUrl: n.action_url ?? null,
    isRead: n.is_read,
    createdAt: n.created_at,
  };
}

/** Map API notification groups to UI shape */
function mapApiNotificationGroupsToUI(
  groups: ApiNotificationGroup[]
): NotificationGroup[] {
  return groups.map((g) => ({
    label: g.label,
    items: g.items.map(mapApiNotificationToUI),
  }));
}

// ─── GET Account Page Data ──────────────────────────────────

/**
 * Fetch the aggregated account page data (profile + security + preferences).
 */
export async function fetchAccountPageData(): Promise<AccountPageData> {
  const url = v1Url("marketplace/account");
  const { data } = await api.get(url, {
    schema: ApiAccountPageResponseSchema,
    cache: "no-store",
  });
  return mapApiAccountToUI(data.data);
}

// ─── GET Addresses ──────────────────────────────────────────

/**
 * Fetch all addresses for the authenticated user.
 */
export async function fetchAddresses(): Promise<Address[]> {
  const url = v1Url("marketplace/addresses");
  const { data } = await api.get(url, {
    schema: ApiAddressListResponseSchema,
    cache: "no-store",
  });
  return data.data.map(mapApiAddressToUI);
}

// ─── GET Orders ─────────────────────────────────────────────

/**
 * Fetch orders for the authenticated user (paginated).
 */
export async function fetchOrders(params?: {
  page?: number;
  status?: string;
  perPage?: number;
}): Promise<PaginatedOrders> {
  const url = v1Url("orders", {
    page: params?.page ?? 1,
    per_page: params?.perPage ?? 10,
    status: params?.status,
  });
  const { data } = await api.get(url, {
    schema: ApiOrderListResponseSchema,
    cache: "no-store",
  });

  return {
    orders: data.data.orders.map(mapApiOrderToUI),
    pagination: {
      currentPage: data.data.pagination.current_page,
      lastPage: data.data.pagination.last_page,
      perPage: data.data.pagination.per_page,
      total: data.data.pagination.total,
    },
  };
}

// ─── GET Notifications ──────────────────────────────────────

/**
 * Fetch notifications for the authenticated user (grouped by date, cursor-paginated).
 */
export async function fetchNotifications(
  cursor?: string
): Promise<NotificationData> {
  const url = v1Url("mobile/notifications", {
    cursor: cursor ?? undefined,
    limit: 20,
  });
  const { data } = await api.get(url, {
    schema: ApiNotificationListResponseSchema,
    cache: "no-store",
  });

  return {
    groups: mapApiNotificationGroupsToUI(data.data.groups),
    nextCursor: data.data.next_cursor,
    hasMore: data.data.has_more,
    unreadCount: data.data.unread_count,
  };
}

// ─── POST Mark notification read ────────────────────────────

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(id: string): Promise<void> {
  const url = v1Url(`mobile/notifications/${id}/read`);
  await api.post(url, {
    schema: ApiMessageResponseSchema,
    retries: 0,
  });
}

// ─── POST Mark all notifications read ───────────────────────

/**
 * Mark all notifications as read. Returns the count of marked notifications.
 */
export async function markAllNotificationsRead(): Promise<{
  markedCount: number;
}> {
  const url = v1Url("mobile/notifications/read-all");
  const { data } = await api.post(url, {
    schema: ApiMarkedReadResponseSchema,
    retries: 0,
  });
  return { markedCount: data.data?.marked_count ?? 0 };
}

// ─── GET Referral ───────────────────────────────────────────

/**
 * Fetch referral data for the authenticated user.
 */
export async function fetchReferralData(): Promise<ReferralData> {
  const url = v1Url("marketplace/referral");
  const { data } = await api.get(url, {
    schema: ApiReferralResponseSchema,
    cache: "no-store",
  });

  return {
    referralCode: data.data.referral_code,
    referralLink: data.data.referral_link,
    totalReferred: data.data.total_referred,
    totalEarnings: data.data.total_earnings,
    rewardPerReferral: data.data.reward_per_referral,
    referredUsers: data.data.referred_users.map((u) => ({
      name: u.name,
      date: u.date,
      status: u.status,
    })),
  };
}

// ─── PATCH Update Profile ───────────────────────────────────

/**
 * Update the authenticated user's profile.
 */
export async function updateProfile(data: {
  name?: string;
  phone_e164?: string;
}): Promise<void> {
  const url = v1Url("marketplace/account/profile");
  await api.patch(url, {
    body: data,
    schema: ApiMessageResponseSchema,
    retries: 0,
  });
}

// ─── PATCH Update Preferences ───────────────────────────────

/**
 * Update the authenticated user's preferences.
 */
export async function updatePreferences(
  prefs: Partial<{
    newsletter_subscribed: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    language: string;
    currency: string;
  }>
): Promise<void> {
  const url = v1Url("marketplace/account/preferences");
  await api.patch(url, {
    body: prefs,
    schema: ApiMessageResponseSchema,
    retries: 0,
  });
}

// ─── PUT Change Password ────────────────────────────────────

/**
 * Change the authenticated user's password.
 */
export async function changePassword(data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  const url = v1Url("marketplace/account/password");
  await api.put(url, {
    body: data,
    schema: ApiMessageResponseSchema,
    retries: 0,
  });
}

// ─── Addresses CRUD ─────────────────────────────────────────

/**
 * Create a new address.
 */
export async function createAddress(data: AddressInput): Promise<Address> {
  const url = v1Url("marketplace/addresses");
  const { data: resp } = await api.post(url, {
    body: data,
    schema: ApiAddressSingleResponseSchema,
    retries: 0,
  });
  return mapApiAddressToUI(resp.data);
}

/**
 * Update an existing address.
 */
export async function updateAddress(
  id: string,
  data: Partial<AddressInput>
): Promise<Address> {
  const url = v1Url(`marketplace/addresses/${id}`);
  const { data: resp } = await api.put(url, {
    body: data,
    schema: ApiAddressSingleResponseSchema,
    retries: 0,
  });
  return mapApiAddressToUI(resp.data);
}

/**
 * Delete an address.
 */
export async function deleteAddress(id: string): Promise<void> {
  const url = v1Url(`marketplace/addresses/${id}`);
  await api.delete(url, {
    schema: ApiMessageResponseSchema,
    retries: 0,
  });
}

/**
 * Set an address as the default.
 */
export async function setDefaultAddress(id: string): Promise<void> {
  const url = v1Url(`marketplace/addresses/${id}/default`);
  await api.patch(url, {
    schema: ApiMessageResponseSchema,
    retries: 0,
  });
}

// ─── DELETE Account ─────────────────────────────────────────

/**
 * Delete the authenticated user's account (requires password confirmation).
 */
export async function deleteAccount(password: string): Promise<void> {
  const url = v1Url("marketplace/account");
  await api.delete(url, {
    body: { password },
    schema: ApiMessageResponseSchema,
    retries: 0,
  });
}

// ─── GET Export Data ────────────────────────────────────────

/**
 * Export the authenticated user's personal data (GDPR).
 * Returns a JSON blob that the user can download.
 */
export async function exportAccountData(): Promise<Record<string, unknown>> {
  const url = v1Url("marketplace/account/export");
  const { data } = await api.get(url, {
    cache: "no-store",
  });
  return (data as { success: boolean; data: Record<string, unknown> }).data;
}

// ─── Utilities ───────────────────────────────────────────────

/** Check if an error is a 401 Unauthorized */
export function isUnauthorized(error: unknown): boolean {
  return isApiError(error) && error.status === 401;
}

/** Extract user-friendly error message */
export function getAccountErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  return "Une erreur inattendue est survenue.";
}
