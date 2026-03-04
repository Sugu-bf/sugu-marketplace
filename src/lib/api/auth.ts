/**
 * Auth module — session management for Sanctum token-based authentication.
 *
 * Backend uses Laravel Sanctum with Bearer token authentication:
 * - Token stored in auth_token cookie (accessible to JS, SameSite=Lax)
 * - Bearer token auth is inherently CSRF-safe (attacker can't forge
 *   the Authorization header from another origin)
 *
 * NOTE: Sanctum's cookie-based CSRF (XSRF-TOKEN) does NOT work in this
 * cross-domain setup (sugu.pro → api.mysugu.com). The XSRF-TOKEN cookie
 * is scoped to .mysugu.com, so the browser on sugu.pro never stores it.
 * Therefore initCsrf() is a no-op — we rely on Bearer token + CORS for
 * protection against cross-site request forgery.
 *
 * RULES:
 * - NEVER store tokens in localStorage/sessionStorage
 * - NEVER log auth cookies or headers
 */

import { api } from "./client";
import { buildApiUrl } from "./endpoints";
import { isApiError } from "./errors";

// ─── Types ───────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone_e164?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  email_verified?: boolean;
  email_verified_at?: string | null;
  phone_verified?: boolean;
  status?: string;
  user_type?: string;
  roles?: string[];
  store?: { id: string; name: string; slug: string; logo_url: string | null } | null;
  agency?: { id: string; name: string; logo_url: string | null } | null;
  created_at: string;
}

// ─── CSRF Initialization ─────────────────────────────────────

/**
 * No-op — CSRF via Sanctum cookie is impossible in cross-domain setup.
 *
 * sugu.pro (frontend) → api.mysugu.com (backend) are different base domains.
 * The XSRF-TOKEN cookie set by /sanctum/csrf-cookie is scoped to .mysugu.com,
 * so the browser on sugu.pro never stores it.
 *
 * Protection against CSRF is provided by:
 * 1. Bearer token auth (can't be forged cross-origin)
 * 2. Content-Type: application/json (triggers CORS preflight)
 * 3. CORS only allows https://sugu.pro and https://pro.sugu.pro
 *
 * Kept as a function for backward compatibility — callers don't need to change.
 */
export async function initCsrf(): Promise<void> {
  // No-op: cross-domain CSRF cookies don't work.
  // Bearer token + CORS provides equivalent protection.
}

// ─── Auth Helpers ────────────────────────────────────────────

/**
 * Get the currently authenticated user (server or client).
 * Returns null if not authenticated (401).
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get<{
      success: boolean;
      data: { user: AuthUser };
    }>(buildApiUrl("/api/v1/web-auth/me"), {
      revalidate: 0, // Never cache user data
    });

    // Unwrap the backend response envelope
    if (data?.success && data?.data?.user) {
      return data.data.user;
    }

    // Fallback: maybe the response IS the user directly
    return (data as unknown as AuthUser) ?? null;
  } catch (error) {
    if (isApiError(error) && (error.code === "UNAUTHORIZED" || error.code === "NOT_FOUND")) {
      return null;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Server-side auth check.
 * Use in Server Components / Route Handlers to get the current user.
 * Returns null if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser | null> {
  return getAuthUser();
}

/**
 * Check if a request is authenticated (without fetching full user).
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

/**
 * Logout — revoke the backend token and clear the auth_token cookie.
 */
export async function logout(): Promise<void> {
  try {
    await initCsrf();
    await api.post(buildApiUrl("/api/v1/web-auth/logout"));
  } catch {
    // Even if logout fails on the server, clear the local cookie
  }

  // Clear the auth_token cookie
  if (typeof document !== "undefined") {
    document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
  }
}

