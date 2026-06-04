// Global setup — jest-dom matchers only. Harmless for all tests.
//
// MSW is intentionally NOT started globally: tests like
// src/lib/api/__tests__/client.test.ts stub global.fetch directly, and a
// global MSW interceptor would change the call signature they assert on.
// Network-mocking tests opt in with `setupMswServer()` from
// "@/test/msw/setup" instead.
import "@testing-library/jest-dom/vitest";
