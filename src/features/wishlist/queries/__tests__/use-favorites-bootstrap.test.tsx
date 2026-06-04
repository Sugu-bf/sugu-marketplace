// @vitest-environment jsdom
/**
 * useFavoritesBootstrap — Lot 3. Network bootstrap via TanStack Query with
 * ETag/304 and per-query refetchOnWindowFocus. MSW opt-in; auth mocked.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@/test/render";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { hasAuthSession } from "@/features/auth/services/auth-service";
import { useFavoritesBootstrap } from "../use-favorites-bootstrap";

vi.mock("@/features/auth/services/auth-service", () => ({
  hasAuthSession: vi.fn(() => true),
}));

setupMswServer();

const IDS_URL = `${API_BASE_URL}/api/v1/mobile/favorites/ids`;

let qc: QueryClient;

beforeEach(() => {
  vi.mocked(hasAuthSession).mockReturnValue(true);
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});

afterEach(() => {
  focusManager.setFocused(undefined); // restore default focus behavior
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useFavoritesBootstrap", () => {
  it("fetches and parses /favorites/ids on mount when authenticated", async () => {
    server.use(
      http.get(IDS_URL, () =>
        HttpResponse.json({ ids: ["a", "b"], updated_at: "2026-06-01T10:00:00+00:00" }),
      ),
    );

    const { result } = renderHook(() => useFavoritesBootstrap(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.ids).toEqual(["a", "b"]);
    expect(result.current.data?.updatedAt).toBe("2026-06-01T10:00:00+00:00");
  });

  it("stores etag from response", async () => {
    server.use(
      http.get(IDS_URL, () =>
        HttpResponse.json({ ids: [], updated_at: null }, { headers: { etag: '"v1"' } }),
      ),
    );

    const { result } = renderHook(() => useFavoritesBootstrap(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.etag).toBe('"v1"');
  });

  it("sends If-None-Match header on refetch using previous etag", async () => {
    const sent: (string | null)[] = [];
    server.use(
      http.get(IDS_URL, ({ request }) => {
        sent.push(request.headers.get("if-none-match"));
        return HttpResponse.json({ ids: ["a"], updated_at: "t" }, { headers: { etag: '"v1"' } });
      }),
    );

    const { result } = renderHook(() => useFavoritesBootstrap(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.refetch();
    });

    expect(sent[0]).toBeNull();
    expect(sent[1]).toBe('"v1"');
  });

  it("returns previousData on 304 (no state change)", async () => {
    let call = 0;
    server.use(
      http.get(IDS_URL, () => {
        call += 1;
        if (call === 1) {
          return HttpResponse.json({ ids: ["a"], updated_at: "t" }, { headers: { etag: '"v1"' } });
        }
        return new HttpResponse(null, { status: 304, headers: { etag: '"v1"' } });
      }),
    );

    const { result } = renderHook(() => useFavoritesBootstrap(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data?.ids).toEqual(["a"]);
    expect(result.current.data?.etag).toBe('"v1"');
  });

  it("is disabled when hasAuthSession returns false", async () => {
    vi.mocked(hasAuthSession).mockReturnValue(false);
    let requested = false;
    server.use(
      http.get(IDS_URL, () => {
        requested = true;
        return HttpResponse.json({ ids: [], updated_at: null });
      }),
    );

    const { result } = renderHook(() => useFavoritesBootstrap(), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(requested).toBe(false);
  });

  it("overrides refetchOnWindowFocus to true (per-query)", async () => {
    let count = 0;
    server.use(
      http.get(IDS_URL, () => {
        count += 1;
        return HttpResponse.json({ ids: [], updated_at: null });
      }),
    );

    const { result } = renderHook(() => useFavoritesBootstrap(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(count).toBe(1);

    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    await waitFor(() => expect(count).toBe(2));
  });
});
