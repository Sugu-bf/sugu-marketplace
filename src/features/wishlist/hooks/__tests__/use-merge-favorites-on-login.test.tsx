// @vitest-environment jsdom
/**
 * useMergeFavoritesOnLogin — Lot 3. Reconciliation-on-mount merge with
 * idempotency guards and flag-before-call race protection. MSW + mocked auth.
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
import { useToast } from "@/features/toast/toast-store";
import { useFavoritesStore } from "../../store/favorites-store";
import { favoritesKeys } from "../../queries/favorites-keys";
import { useMergeFavoritesOnLogin } from "../use-merge-favorites-on-login";

vi.mock("@/features/auth/services/auth-service", () => ({
  hasAuthSession: vi.fn(() => true),
}));

setupMswServer();

const BULK_URL = `${API_BASE_URL}/api/v1/mobile/favorites/bulk-merge`;
const FLAG_KEY = "sugu_favorites_merge_attempted_v1";

let qc: QueryClient;

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  useFavoritesStore.setState({ favoriteSet: new Set<string>() });
  useToast.setState({ toasts: [] });
  vi.mocked(hasAuthSession).mockReturnValue(true);
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function seedGuest(ids: string[]) {
  act(() => {
    ids.forEach((id) => useFavoritesStore.getState().add(id));
  });
}

const mergeOk = (extra?: Partial<{ merged_count: number; skipped_count: number; truncated: boolean }>) =>
  http.post(BULK_URL, () =>
    HttpResponse.json({ merged_count: 1, skipped_count: 0, truncated: false, ...extra }),
  );

describe("useMergeFavoritesOnLogin", () => {
  it("merges guest set then invalidates query and clears storage when authenticated and guest set non-empty", async () => {
    let body: unknown;
    server.use(
      http.post(BULK_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ merged_count: 2, skipped_count: 0, truncated: false });
      }),
    );
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    seedGuest(["g1", "g2"]);

    renderHook(() => useMergeFavoritesOnLogin(), { wrapper });

    await waitFor(() => expect(useFavoritesStore.getState().size()).toBe(0));
    expect(body).toEqual({ ids: ["g1", "g2"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: favoritesKeys.ids() });
  });

  it("does nothing when guest set is empty", async () => {
    let called = false;
    server.use(http.post(BULK_URL, () => {
      called = true;
      return HttpResponse.json({ merged_count: 0, skipped_count: 0, truncated: false });
    }));

    renderHook(() => useMergeFavoritesOnLogin(), { wrapper });

    await Promise.resolve();
    expect(called).toBe(false);
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });

  it("does nothing when hasAuthSession returns false", async () => {
    vi.mocked(hasAuthSession).mockReturnValue(false);
    let called = false;
    server.use(http.post(BULK_URL, () => {
      called = true;
      return HttpResponse.json({ merged_count: 0, skipped_count: 0, truncated: false });
    }));
    seedGuest(["g1"]);

    renderHook(() => useMergeFavoritesOnLogin(), { wrapper });

    await Promise.resolve();
    expect(called).toBe(false);
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });

  it("does nothing when sessionStorage flag is already set (cross-mount idempotency)", async () => {
    sessionStorage.setItem(FLAG_KEY, "1");
    let called = false;
    server.use(http.post(BULK_URL, () => {
      called = true;
      return HttpResponse.json({ merged_count: 0, skipped_count: 0, truncated: false });
    }));
    seedGuest(["g1"]);

    renderHook(() => useMergeFavoritesOnLogin(), { wrapper });

    await Promise.resolve();
    expect(called).toBe(false);
  });

  it("does not merge twice across re-renders (idempotent)", async () => {
    let count = 0;
    server.use(http.post(BULK_URL, () => {
      count += 1;
      return HttpResponse.json({ merged_count: 1, skipped_count: 0, truncated: false });
    }));
    seedGuest(["g1"]);

    const { rerender } = renderHook(() => useMergeFavoritesOnLogin(), { wrapper });
    await waitFor(() => expect(count).toBe(1));
    rerender();
    await Promise.resolve();
    expect(count).toBe(1);
  });

  it("sets sessionStorage flag BEFORE the bulk-merge call (race protection)", async () => {
    let flagAtCall: string | null = "UNSET";
    server.use(
      http.post(BULK_URL, () => {
        flagAtCall = sessionStorage.getItem(FLAG_KEY);
        return HttpResponse.json({ merged_count: 1, skipped_count: 0, truncated: false });
      }),
    );
    seedGuest(["g1"]);

    renderHook(() => useMergeFavoritesOnLogin(), { wrapper });

    await waitFor(() => expect(flagAtCall).toBe("1"));
  });

  it("shows toast.info with exact FR message when result.truncated is true", async () => {
    server.use(mergeOk({ truncated: true }));
    seedGuest(["g1"]);

    renderHook(() => useMergeFavoritesOnLogin(), { wrapper });

    await waitFor(() =>
      expect(
        useToast
          .getState()
          .toasts.some(
            (t) =>
              t.type === "info" &&
              t.message === "Certains favoris n'ont pas pu être transférés (limite atteinte)",
          ),
      ).toBe(true),
    );
  });

  it("logs silently to console.info when skippedCount > 0", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    server.use(mergeOk({ skipped_count: 2 }));
    seedGuest(["g1"]);

    renderHook(() => useMergeFavoritesOnLogin(), { wrapper });

    await waitFor(() => expect(infoSpy).toHaveBeenCalledWith("Bulk-merge skipped 2 items"));
    infoSpy.mockRestore();
  });

  it("logs error and keeps flag set when network fails (no retry loop)", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.post(BULK_URL, () => new HttpResponse(null, { status: 500 })));
    seedGuest(["g1"]);

    renderHook(() => useMergeFavoritesOnLogin(), { wrapper });

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(sessionStorage.getItem(FLAG_KEY)).toBe("1"); // flag kept → no retry loop
    errorSpy.mockRestore();
  });
});
