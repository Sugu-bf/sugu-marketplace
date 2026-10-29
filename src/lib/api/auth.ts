/**
 * Auth module — session management for Sanctum token-based authentication.
 *
 * Backend uses Laravel Sanctum with Bearer token authentication.
 * Browser calls go through the same-origin BFF; the Sanctum token stays in an
 * HttpOnly cookie and is never read by JavaScript.
 *
 * NOTE: Sanctum's cookie-based CSRF (XSRF-TOKEN) does NOT work in this
 * cross-domain setup (sugu.pro → api.mysugu.com). The XSRF-TOKEN cookie
 * is scoped to .mysugu.com, so the browser on sugu.pro never stores it.
 * Therefore initCsrf() is a no-op. Browser auth calls use same-origin BFF
 * routes guarded by Origin/Fetch Metadata; the BFF injects Bearer server-side.
 *
 * RULES:
 * - NEVER store tokens in localStorage/sessionStorage
 * - NEVER log auth cookies or headers
 */

import { cache } from "react";
import { api } from "./client";
import { buildApiUrl } from "./endpoints";
import { ApiError, isApiError } from "./errors";

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
 * Protection against CSRF is provided by same-origin BFF routes guarded by
 * Origin/Fetch Metadata checks. The Laravel Bearer token never enters browser
 * JavaScript.
 *
 * Kept as a function for backward compatibility — callers don't need to change.
 */
export async function initCsrf(): Promise<void> {
  // No-op: cross-domain CSRF cookies don't work.
}

// ─── Auth Helpers ────────────────────────────────────────────

/**
 * Who is asking, as far as the backend can tell:
 * - authenticated: the session is valid;
 * - unauthenticated: there is no valid session (401/404) — send to login;
 * - unavailable: the backend could not answer (down, timeout, malformed
 *   reply) — the session is unknown, so show a degraded page, never the
 *   protected content and never a login loop.
 */
export type AuthState =
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated" }
  | { status: "unavailable"; error: ApiError };

function userFromEnvelope(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== "object") return null;
  const envelope = payload as { success?: unknown; data?: { user?: unknown } };
  const user = envelope.success === true ? envelope.data?.user : null;
  if (!user || typeof user !== "object") return null;
  const id = (user as { id?: unknown }).id;
  return typeof id === "string" || typeof id === "number" ? (user as AuthUser) : null;
}

/**
 * The auth state of the current request. Deduplicated per server render
 * (React cache): a protected layout and its page ask the backend once.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  try {
    const { data } = await api.get<unknown>(buildApiUrl("/api/v1/web-auth/me"), {
      revalidate: 0, // Never cache user data
    });

    const user = userFromEnvelope(data);
    if (user) return { status: "authenticated", user };

    // A reply that is not a user (success:false, unexpected shape) is never
    // taken for one.
    return {
      status: "unavailable",
      error: new ApiError({
        status: 200,
        code: "INVALID_SCHEMA",
        message: "La session n'a pas pu être vérifiée.",
      }),
    };
  } catch (error) {
    if (isApiError(error) && (error.code === "UNAUTHORIZED" || error.code === "NOT_FOUND")) {
      return { status: "unauthenticated" };
    }
    if (isApiError(error)) return { status: "unavailable", error };
    throw error;
  }
});

/**
 * Get the currently authenticated user (server or client).
 * Returns null if not authenticated (401); throws the ApiError when the
 * backend cannot tell (see getAuthState).
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const state = await getAuthState();
  if (state.status === "unavailable") throw state.error;
  return state.status === "authenticated" ? state.user : null;
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
  // Disconnect WebSocket FIRST (before clearing token)
  // so messages stop arriving immediately on shared computers
  if (typeof window !== "undefined") {
    try {
      const { disconnectEcho } = await import("@/lib/echo");
      disconnectEcho();
    } catch {
      // Echo may not be initialized — ignore
    }
  }

  try {
    await initCsrf();
    await api.post(buildApiUrl("/api/v1/web-auth/logout"));
  } catch {
    // Even if logout fails on the server, clear the local cookie
  }

  if (typeof document !== "undefined") {
    try {
      localStorage.removeItem("auth_token_expires_at");
    } catch {
      // ignore
    }
  }

  if (typeof window !== "undefined") {
    await fetch("/api/auth/set-session", {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => {});
  }
}

