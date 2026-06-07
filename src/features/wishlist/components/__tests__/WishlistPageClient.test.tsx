// @vitest-environment jsdom
/**
 * WishlistPageClient — Lot 5. All UI states + integration test for
 * heart toggle → item disappears from list.
 *
 * Strategy:
 *  - useWishlistPage mocked via vi.mock for unit tests (loading, empty,
 *    error, unauthenticated states + centimes conversion).
 *  - Integration test (toggle → list update) uses MSW + shared QueryClient
 *    to exercise real invalidation path.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderWithProviders, screen, fireEvent, waitFor, act } from "@/test/render";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { hasAuthSession } from "@/features/auth/services/auth-service";
import { useFavoritesStore } from "../../store/favorites-store";
import { __clearToggleMutex } from "../../hooks/use-toggle-favorite";
import { WishlistPageClient } from "../WishlistPageClient";

// ─── Auth mock ────────────────────────────────────────────────────────────────
vi.mock("@/features/auth/services/auth-service", () => ({
  hasAuthSession: vi.fn(() => true),
}));

// ─── useWishlistPage mock (unit tests) ───────────────────────────────────────
// Integration test overrides this with real implementation.
vi.mock("../../queries/use-wishlist-page", () => ({
  useWishlistPage: vi.fn(() => ({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  })),
}));

import { useWishlistPage } from "../../queries/use-wishlist-page";

// ─── MSW ─────────────────────────────────────────────────────────────────────
setupMswServer();

const WISHLIST_URL = `${API_BASE_URL}/api/v1/mobile/wishlist`;
const FAV_URL = (id: string) => `${API_BASE_URL}/api/v1/mobile/favorites/${id}`;

// ─── Shared test data ─────────────────────────────────────────────────────────
const ITEM_A = {
  product_id: "01HZ_PRODUCT_A",
  name: "Téléphone Sugu Pro",
  image_url: "https://cdn.sugu.pro/products/phone.jpg",
  price: 150000, // centimes → 1500 F
};

const ITEM_B = {
  product_id: "01HZ_PRODUCT_B",
  name: "Casque Bluetooth",
  image_url: null,
  price: 50000, // centimes → 500 F
};

function mockWishlistHook(overrides: Partial<ReturnType<typeof useWishlistPage>>) {
  vi.mocked(useWishlistPage).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useWishlistPage>);
}

beforeEach(() => {
  vi.mocked(hasAuthSession).mockReturnValue(true);
  useFavoritesStore.setState({ favoriteSet: new Set<string>() });
  __clearToggleMutex();
  // Reset mock to loading default
  vi.mocked(useWishlistPage).mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useWishlistPage>);
});

// ─── Unit tests ───────────────────────────────────────────────────────────────

describe("WishlistPageClient — unit", () => {
  it("renders loading skeleton while query is fetching", () => {
    mockWishlistHook({ isLoading: true });
    renderWithProviders(<WishlistPageClient />);

    // Skeleton grid has aria-busy + aria-label
    const grid = screen.getByLabelText("Chargement de la liste de souhaits");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveAttribute("aria-busy", "true");
  });

  it("renders empty state with FR copy when items array is empty", () => {
    mockWishlistHook({
      isLoading: false,
      data: {
        wishlist: {
          items: [],
          pagination: { current_page: 1, per_page: 20, total: 0, last_page: 1 },
        },
      },
    });
    renderWithProviders(<WishlistPageClient />);

    expect(
      screen.getByText("Votre liste de souhaits est vide"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ajoutez vos produits préférés en cliquant sur le cœur"),
    ).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Découvrir le catalogue" });
    expect(cta).toHaveAttribute("href", "/");
  });

  it("renders ProductCard for each item when items present", () => {
    mockWishlistHook({
      isLoading: false,
      data: {
        wishlist: {
          items: [ITEM_A, ITEM_B],
          pagination: { current_page: 1, per_page: 20, total: 2, last_page: 1 },
        },
      },
    });
    renderWithProviders(<WishlistPageClient />);

    expect(screen.getByText("Téléphone Sugu Pro")).toBeInTheDocument();
    expect(screen.getByText("Casque Bluetooth")).toBeInTheDocument();
  });

  it("converts prices from centimes to display units in mapped products", () => {
    // item.price = 150000 centimes → ProductCard renders 1500
    mockWishlistHook({
      isLoading: false,
      data: {
        wishlist: {
          items: [ITEM_A],
          pagination: { current_page: 1, per_page: 20, total: 1, last_page: 1 },
        },
      },
    });
    renderWithProviders(<WishlistPageClient />);

    // formatPrice(1500) renders "1 500 F CFA" or similar — the key check is
    // that 150000 is NOT shown raw (that would mean no division happened).
    const priceEl = screen.queryByText(/150\s*000/);
    expect(priceEl).toBeNull();

    // 1500 converted from 150000 centimes should be visible in some format
    // (the exact format depends on formatPrice; 1 500 or 1500 depending on locale)
    const priceText = document.body.textContent ?? "";
    expect(priceText).toMatch(/1\s*5\s*0\s*0/); // flexible: "1 500" or "1500"
  });

  it("renders ProductCard with FavoriteHeart (Lot 4 integration)", () => {
    // Pre-seed store: ITEM_A is already favorited, ITEM_B is not
    act(() => useFavoritesStore.getState().add(ITEM_A.product_id));

    mockWishlistHook({
      isLoading: false,
      data: {
        wishlist: {
          items: [ITEM_A, ITEM_B],
          pagination: { current_page: 1, per_page: 20, total: 2, last_page: 1 },
        },
      },
    });
    renderWithProviders(<WishlistPageClient />);

    // ITEM_A is favorited → "Retirer des favoris" button visible
    const removeBtn = screen.getAllByRole("button", { name: "Retirer des favoris" });
    expect(removeBtn).toHaveLength(1);

    // ITEM_B is not favorited → "Ajouter aux favoris" button visible
    const addBtn = screen.getAllByRole("button", { name: "Ajouter aux favoris" });
    expect(addBtn).toHaveLength(1);
  });

  it("shows error state with FR copy and retry button on fetch failure", () => {
    const refetchMock = vi.fn();
    mockWishlistHook({ isLoading: false, isError: true, refetch: refetchMock });
    renderWithProviders(<WishlistPageClient />);

    expect(
      screen.getByText("Impossible de charger votre liste de souhaits"),
    ).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: "Réessayer" });
    expect(retryBtn).toBeInTheDocument();
  });

  it("triggers refetch when retry button is clicked", async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined);
    mockWishlistHook({ isLoading: false, isError: true, refetch: refetchMock });
    renderWithProviders(<WishlistPageClient />);

    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(1));
  });

  it("shows neutral message when not authenticated", () => {
    vi.mocked(hasAuthSession).mockReturnValue(false);
    renderWithProviders(<WishlistPageClient />);

    expect(
      screen.getByText("Connectez-vous pour voir votre liste de souhaits"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Se connecter" })).toBeInTheDocument();
  });
});

// ─── Integration test — requires REAL useWishlistPage + useToggleFavorite ────
// Re-import the real useWishlistPage for this test block.
// We reset the vi.mock to the real module and use MSW to control the server.

describe("WishlistPageClient — integration: toggle removes item from list", () => {
  it("removes item from list when heart is toggled off (via favoritesKeys.page invalidation)", async () => {
    // Restore the real useWishlistPage for this integration test
    vi.doUnmock("../../queries/use-wishlist-page");
    const { useWishlistPage: realUseWishlistPage } = await import(
      "../../queries/use-wishlist-page"
    );
    vi.mocked(useWishlistPage).mockImplementation(realUseWishlistPage);

    // ITEM_A starts as favorited in the store
    act(() => {
      useFavoritesStore.getState().add(ITEM_A.product_id);
    });

    // Call counter: first call returns [ITEM_A], second (after toggle) returns []
    let wishlistCall = 0;
    server.use(
      http.get(WISHLIST_URL, () => {
        wishlistCall++;
        if (wishlistCall === 1) {
          return HttpResponse.json({
            wishlist: {
              items: [ITEM_A],
              pagination: { current_page: 1, per_page: 20, total: 1, last_page: 1 },
            },
          });
        }
        // After removal, server returns empty list
        return HttpResponse.json({
          wishlist: {
            items: [],
            pagination: { current_page: 1, per_page: 20, total: 0, last_page: 1 },
          },
        });
      }),
      http.delete(FAV_URL(ITEM_A.product_id), () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );

    // Shared QueryClient so both WishlistPageClient + useToggleFavorite share cache
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    }

    const { render: renderReal } = await import("@testing-library/react");
    renderReal(<WishlistPageClient />, { wrapper: Wrapper });

    // Wait for initial list to load
    await waitFor(() =>
      expect(screen.getByText("Téléphone Sugu Pro")).toBeInTheDocument(),
    );
    expect(wishlistCall).toBe(1);

    // Click the "Retirer des favoris" heart button (ITEM_A is favorited)
    const removeBtn = screen.getByRole("button", { name: "Retirer des favoris" });
    fireEvent.click(removeBtn);

    // After mutation + invalidation: wishlist refetches and item disappears
    await waitFor(
      () => expect(screen.queryByText("Téléphone Sugu Pro")).not.toBeInTheDocument(),
      { timeout: 3000 },
    );

    // Empty state should now render
    expect(
      screen.getByText("Votre liste de souhaits est vide"),
    ).toBeInTheDocument();
    expect(wishlistCall).toBe(2);
  });
});
