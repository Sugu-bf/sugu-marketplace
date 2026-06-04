import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

/**
 * Opt-in MSW lifecycle. Call once at the top level of a test file that needs
 * network mocking:
 *
 *   import { setupMswServer } from "@/test/msw/setup";
 *   setupMswServer();
 *
 * Kept opt-in (not wired into the global vitest setupFiles) so tests that stub
 * `global.fetch` directly — e.g. src/lib/api/__tests__/client.test.ts — are not
 * intercepted by MSW and keep asserting on the real fetch(url, init) signature.
 */
export function setupMswServer(): void {
  beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
