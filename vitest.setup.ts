// Global setup — jest-dom matchers and the network guard. Harmless for all tests.
//
// MSW is intentionally NOT started globally: tests like
// src/lib/api/__tests__/client.test.ts stub global.fetch directly, and a
// global MSW interceptor would change the call signature they assert on.
// Network-mocking tests opt in with `setupMswServer()` from
// "@/test/msw/setup" instead.
//
// The network guard makes any real request to a Sugu host fail (see
// src/test/network-guard.ts): tests never touch production.
import "@testing-library/jest-dom/vitest";
import { installNetworkGuard } from "./src/test/network-guard";

installNetworkGuard();
