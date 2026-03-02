/**
 * Auth module — session management for Sanctum token-based authentication.
 *
 * Backend uses Laravel Sanctum with Bearer token authentication:
 * - Token stored in auth_token cookie (accessible to JS, SameSite=Lax)
 * - XSRF-TOKEN cookie used for CSRF protection on mutations
 *
 * RULES:
 * - NEVER store tokens in localStorage/sessionStorage
 * - NEVER log auth cookies or headers
 * - All mutations automatically include XSRF-TOKEN via the client
 */

import { api } from "./client";
import { buildApiUrl } from "./endpoints";
import { API_BASE_URL } from "./config";
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
 * Fetch the CSRF cookie from Sanctum.
 * Must be called BEFORE any mutation (POST/PUT/DELETE) in the SPA.
 * The XSRF-TOKEN cookie is set by the server and read by the client.
 */
export async function initCsrf(): Promise<void> {
  await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
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

