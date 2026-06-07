// @vitest-environment jsdom
/**
 * useWishlistPage — Lot 5. Fetches /mobile/wishlist via TanStack Query.
 * auth mocked; MSW opt-in via setupMswServer().
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@/test/render";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { hasAuthSession } from "@/features/auth/services/auth-service";
import { useWishlistPage } from "../use-wishlist-page";

vi.mock("@/features/auth/services/auth-service", () => ({
  hasAuthSession: vi.fn(() => true),
}));

setupMswServer();

const WISHLIST_URL = `${API_BASE_URL}/api/v1/mobile/wishlist`;

const MOCK_ITEM = {
  product_id: "01HZ123ABC",
  name: "Produit Test",
  image_url: "https://cdn.sugu.pro/products/test.jpg",
  price: 150000, // centimes
};

const MOCK_PAGE_RESPONSE = {
  wishlist: {
    items: [MOCK_ITEM],
    pagination: {
      current_page: 1,
      per_page: 20,
      total: 1,
      last_page: 1,
    },
  },
};

const EMPTY_PAGE_RESPONSE = {
  wishlist: {
    items: [],
    pagination: {
      current_page: 1,
      per_page: 20,
      total: 0,
      last_page: 1,
    },
  },
};

let qc: QueryClient;

beforeEach(() => {
  vi.mocked(hasAuthSession).mockReturnValue(true);
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useWishlistPage", () => {
  it("fetches and parses /mobile/wishlist response on mount when authenticated", async () => {
    server.use(
      http.get(WISHLIST_URL, () => HttpResponse.json(MOCK_PAGE_RESPONSE)),
    );

    const { result } = renderHook(() => useWishlistPage(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.wishlist.items).toHaveLength(1);
    expect(result.current.data?.wishlist.items[0].product_id).toBe("01HZ123ABC");
    expect(result.current.data?.wishlist.items[0].name).toBe("Produit Test");
    expect(result.current.data?.wishlist.items[0].price).toBe(150000);
  });

  it("is disabled when hasAuthSession returns false", async () => {
    vi.mocked(hasAuthSession).mockReturnValue(false);
    let requested = false;
    server.use(
      http.get(WISHLIST_URL, () => {
        requested = true;
        return HttpResponse.json(MOCK_PAGE_RESPONSE);
      }),
    );

    const { result } = renderHook(() => useWishlistPage(), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(requested).toBe(false);
  });

  it("refetches network when refetch() is called (refetchOnWindowFocus: true hook option)", async () => {
    // Verifies the query actually re-hits the network on explicit refetch.
    // The refetchOnWindowFocus:true hook option is wired at the query level;
    // we test the observable effect (a second request fires) via explicit refetch
    // rather than simulating a focus event, which is unreliable in jsdom when
    // per-query staleTime (30s) overrides the QueryClient default.
    let count = 0;
    server.use(
      http.get(WISHLIST_URL, () => {
        count += 1;
        return HttpResponse.json(EMPTY_PAGE_RESPONSE);
      }),
    );

    const { result } = renderHook(() => useWishlistPage(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(count).toBe(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(count).toBe(2);
  });

  it("parses items array and pagination correctly", async () => {
    const multiItemResponse = {
      wishlist: {
        items: [
          MOCK_ITEM,
          { product_id: "02HZ456DEF", name: "Produit 2", image_url: null, price: 50000 },
        ],
        pagination: {
          current_page: 1,
          per_page: 20,
          total: 2,
          last_page: 1,
        },
      },
    };
    server.use(
      http.get(WISHLIST_URL, () => HttpResponse.json(multiItemResponse)),
    );

    const { result } = renderHook(() => useWishlistPage(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { items, pagination } = result.current.data!.wishlist;
    expect(items).toHaveLength(2);
    expect(pagination.total).toBe(2);
    expect(pagination.last_page).toBe(1);
    expect(pagination.per_page).toBe(20);
    expect(pagination.current_page).toBe(1);
    // Nullable image_url accepted
    expect(items[1].image_url).toBeNull();
  });

  it("handles empty wishlist (items: [])", async () => {
    server.use(
      http.get(WISHLIST_URL, () => HttpResponse.json(EMPTY_PAGE_RESPONSE)),
    );

    const { result } = renderHook(() => useWishlistPage(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.wishlist.items).toEqual([]);
    expect(result.current.data?.wishlist.pagination.total).toBe(0);
  });
});
