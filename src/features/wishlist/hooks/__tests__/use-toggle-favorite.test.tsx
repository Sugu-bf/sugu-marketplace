// @vitest-environment jsdom
/**
 * useToggleFavorite — Lot 3. Optimistic flip, revert + locked FR toast on
 * error, query invalidation on success, module-level double-tap mutex.
 * Distinct productIds per test keep the shared mutexMap clean.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@/test/render";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { useToast } from "@/features/toast/toast-store";
import { useFavoritesStore } from "../../store/favorites-store";
import { favoritesKeys } from "../../queries/favorites-keys";
import { useToggleFavorite } from "../use-toggle-favorite";

setupMswServer();

const favUrl = (id: string) => `${API_BASE_URL}/api/v1/mobile/favorites/${id}`;

let qc: QueryClient;

beforeEach(() => {
  localStorage.clear();
  useFavoritesStore.setState({ favoriteSet: new Set<string>() });
  useToast.setState({ toasts: [] });
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function hasToast(message: string, type: string): boolean {
  return useToast.getState().toasts.some((t) => t.message === message && t.type === type);
}

describe("useToggleFavorite", () => {
  it("flips set optimistically before network resolves", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    server.use(
      http.post(favUrl("p1"), async () => {
        await gate; // network stays pending until we release it
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => result.current.toggle("p1"));

    // Optimistic: store already reflects the add while the network is gated.
    expect(useFavoritesStore.getState().has("p1")).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      release();
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(useFavoritesStore.getState().has("p1")).toBe(true);
  });

  it("reverts the optimistic update and toasts on add failure", async () => {
    server.use(http.post(favUrl("p2"), () => new HttpResponse(null, { status: 500 })));

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => result.current.toggle("p2"));

    await waitFor(() => expect(useFavoritesStore.getState().has("p2")).toBe(false));
    expect(hasToast("Impossible d'ajouter aux favoris", "error")).toBe(true);
  });

  it("reverts the optimistic update and toasts on remove failure", async () => {
    act(() => {
      useFavoritesStore.getState().add("p3");
    });
    server.use(http.delete(favUrl("p3"), () => new HttpResponse(null, { status: 500 })));

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => result.current.toggle("p3"));

    await waitFor(() => expect(useFavoritesStore.getState().has("p3")).toBe(true)); // reverted back
    expect(hasToast("Impossible de retirer des favoris", "error")).toBe(true);
  });

  it("invalidates favorites ids query on successful mutation", async () => {
    server.use(http.post(favUrl("p4"), () => new HttpResponse(null, { status: 204 })));
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });
    act(() => result.current.toggle("p4"));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: favoritesKeys.ids() });
  });

  it("prevents double-tap via module-level mutex per productId", async () => {
    let count = 0;
    server.use(
      http.post(favUrl("p5"), () => {
        count += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    // Both taps in the same tick: the module-level mutex is set synchronously by
    // the first toggle, so the second is ignored before any network call.
    act(() => {
      result.current.toggle("p5");
      result.current.toggle("p5");
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(count).toBe(1);
  });
});
