/**
 * Server-only: the signed visitor address (see @/lib/server/client-ip) for a
 * call to Laravel made while rendering the current request.
 *
 * Like server-auth.ts, it is only ever reached through a dynamic import from
 * lib/api/client.ts, and only for calls that already read the request cookies
 * (credentialed, uncached): reading the request headers there changes nothing
 * to how the page renders.
 */
import { clientIpHeaders } from "@/lib/server/client-ip";

export async function getServerClientIpHeaders(): Promise<Record<string, string>> {
  try {
    const { headers } = await import("next/headers");
    return await clientIpHeaders(await headers());
  } catch {
    return {};
  }
}
