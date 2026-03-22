/**
 * server-auth.ts — Server-only auth token reader.
 *
 * IMPORTANT: This file reads cookies() from next/headers.
 * It MUST only be imported from Server Components / Route Handlers.
 *
 * Calling cookies() opts a route into dynamic rendering.
 * That's why this is isolated here and NOT inside client.ts,
 * which is reachable from every fetch call (including ISR pages).
 *
 * Usage: imported lazily only when skipCredentials=false
 * (i.e. never on public/ISR pages, only on user-specific pages).
 */

import "server-only";

/**
 * Read the auth_token from the incoming request cookies.
 * Returns null if no token is found or if called outside server context.
 */
export async function getServerAuthToken(): Promise<string | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    return token?.value ?? null;
  } catch {
    return null;
  }
}
