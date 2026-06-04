import type { RequestHandler } from "msw";

/**
 * Default MSW handlers list. Empty by design at Lot 1 — each test file or
 * feature registers its own handlers at runtime via `server.use(...)`.
 *
 * Pattern:
 *   import { server } from "@/test/msw/server";
 *   import { http, HttpResponse } from "msw";
 *   server.use(http.get(url, () => HttpResponse.json({ ... })));
 *
 * Note: the API client short-circuits the BFF proxy under NODE_ENV === "test"
 * (see src/lib/api/client.ts → shouldProxyThroughBff), so handlers must match
 * the ABSOLUTE upstream URLs built from API_BASE_URL, not "/api/backend/...".
 */
export const handlers: RequestHandler[] = [];
