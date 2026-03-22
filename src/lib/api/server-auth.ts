/**
 * server-auth.ts — Server-only auth token reader.
 *
 * Reads the auth_token cookie via next/headers (Next.js server context).
 * ONLY imported via dynamic import from lib/api/client.ts to prevent
 * Next.js static analysis from detecting cookies() usage in the shared
 * fetch client, which would break ISR on all pages.
 *
 * Protection:
 * - Dynamic import from client.ts → only resolved at runtime, not statically bundled
 * - Only called when typeof document === "undefined" (server-side)
 * - Only called when skipCredentials=false (user-specific pages, never ISR pages)
 *
 * NOTE: `import "server-only"` intentionally omitted — Turbopack statically
 * pre-processes dynamic imports and would throw at build time.
 */

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
