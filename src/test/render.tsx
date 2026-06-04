import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * Test-friendly QueryClient: no retries, no GC, so each test starts clean
 * and failures surface immediately instead of being retried/cached.
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

function AllProviders({ children }: { children: ReactNode }) {
  const client = createTestQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/**
 * Render a component wrapped in the app's client-side providers.
 *
 * Note: WishlistProvider is intentionally NOT wired here yet — it does not
 * exist until Lot 3. Add it to AllProviders when it lands.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export RTL so tests can `import { renderWithProviders, screen } from "@/test/render"`.
export * from "@testing-library/react";
