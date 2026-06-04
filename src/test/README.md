# Test conventions

## Runner

- **Vitest 4**. `npm test` (run once), `npm run test:watch`, `npm run test:ci`.
- Test files: `src/**/*.test.ts` / `src/**/*.test.tsx`.

## Environment

- **Default: `node`** (set globally in `vitest.config.ts`).
- For DOM/component/hook tests, opt in **per file** with a docblock on the
  first line:

  ```ts
  // @vitest-environment jsdom
  ```

## React Testing Library

- Use the shared helper instead of RTL's bare `render`:

  ```tsx
  // @vitest-environment jsdom
  import { renderWithProviders, screen } from "@/test/render";

  renderWithProviders(<MyComponent />);
  expect(screen.getByText("…")).toBeInTheDocument();
  ```

- `renderWithProviders` wraps a test-friendly `QueryClientProvider`
  (`retry: false`, `gcTime: 0`). `@/test/render` re-exports everything from
  `@testing-library/react`, so import `screen`, `within`, `fireEvent`, etc.
  from there too.

## MSW (network mocking)

MSW is **opt-in**, not global. Tests that stub `global.fetch` directly (e.g.
`src/lib/api/__tests__/client.test.ts`) must not be intercepted, so the server
lifecycle is not wired into the global `setupFiles`.

- Opt in at the top level of a test file that needs network mocking:

  ```ts
  import { setupMswServer } from "@/test/msw/setup";
  import { server } from "@/test/msw/server";
  import { http, HttpResponse } from "msw";

  setupMswServer(); // registers listen / resetHandlers / close

  // then, per test:
  server.use(
    http.get(url, () => HttpResponse.json({ /* … */ })),
  );
  ```

- Use the **MSW 2.x** API (`http`, `HttpResponse`, `setupServer` from
  `msw/node`). The 1.x `rest.*` API is not available.

## URLs to mock

The API client **short-circuits the BFF proxy under `NODE_ENV === "test"`**
(see `src/lib/api/client.ts` → `shouldProxyThroughBff`). Mock the **absolute**
upstream URLs built from `API_BASE_URL` (e.g.
`https://api.mysugu.com/api/v1/...`), **not** `/api/backend/...`.

## jest-dom matchers

Available automatically (wired in `vitest.setup.ts`): `.toBeInTheDocument()`,
`.toHaveAttribute()`, `.toBeDisabled()`, etc.
