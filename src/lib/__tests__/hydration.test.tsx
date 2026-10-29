// @vitest-environment jsdom
/**
 * Hydration mismatches (audit 2026-10-29, catalogue/front low findings).
 *
 * The product countdown read Date.now() during its first render, the home
 * promo countdown was computed on the server and frozen in the ISR page, and
 * the wishlist page read the session cookie while rendering: the server and
 * the browser rendered different HTML. Each now renders the same first HTML
 * on both sides, then the browser fills in its clock or session.
 */
import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import PromotionalDeals from "@/components/PromotionalDeals";
import { WishlistPageClient } from "@/features/wishlist/components/WishlistPageClient";
import { hasAuthSession } from "@/features/auth/services/auth-service";

vi.mock("@/features/auth/services/auth-service", () => ({ hasAuthSession: vi.fn(() => true) }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img mock for jsdom
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

async function hydrateWithoutMismatch(element: React.ReactElement): Promise<HTMLElement> {
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.appendChild(container);
  const recoverable = vi.fn();

  await act(async () => {
    hydrateRoot(container, element, { onRecoverableError: recoverable });
  });

  expect(recoverable).not.toHaveBeenCalled();
  return container;
}

const inTwoDays = new Date(Date.now() + 2 * 86_400_000 + 5_000).toISOString();

describe("hydration", () => {
  it("renders the product countdown without a clock on the server, then counts down", async () => {
    expect(renderToString(<CountdownTimer targetDate={inTwoDays} />)).toContain("--");

    const container = await hydrateWithoutMismatch(<CountdownTimer targetDate={inTwoDays} />);

    expect(container.textContent).toContain("02");
    expect(container.textContent).not.toContain("--");
  });

  it("counts the home promo down in the browser from its end date", async () => {
    const deals = [
      { id: 1, title: "Offre", subtitle: "Temps restant", image: "/x.png", variant: "light" as const, endsAt: inTwoDays },
    ];

    const container = await hydrateWithoutMismatch(<PromotionalDeals deals={deals} />);

    expect(container.textContent).toContain("2 J");
  });

  it("renders the wishlist page the same on both sides, whatever the session", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const element = (
      <QueryClientProvider client={client}>
        <WishlistPageClient />
      </QueryClientProvider>
    );

    vi.mocked(hasAuthSession).mockClear();

    // The server has no session cookie: the first render must not depend on it.
    expect(renderToString(element)).not.toContain("Connectez-vous");
    expect(hasAuthSession).not.toHaveBeenCalled();
    await hydrateWithoutMismatch(element);
  });
});
