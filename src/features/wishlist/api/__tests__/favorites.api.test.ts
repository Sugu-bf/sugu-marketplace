/**
 * Favorites API — Lot 2. Node env; MSW opt-in. The api client short-circuits
 * the BFF under NODE_ENV==='test', so we mock the ABSOLUTE upstream URLs.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import {
  fetchFavoriteIds,
  addFavorite,
  removeFavorite,
  bulkMergeFavorites,
  fetchWishlistPage,
} from "../favorites.api";

setupMswServer();

const IDS_URL = `${API_BASE_URL}/api/v1/mobile/favorites/ids`;
const BULK_URL = `${API_BASE_URL}/api/v1/mobile/favorites/bulk-merge`;
const WISHLIST_URL = `${API_BASE_URL}/api/v1/mobile/wishlist`;
const favUrl = (id: string) => `${API_BASE_URL}/api/v1/mobile/favorites/${id}`;

describe("fetchFavoriteIds (bootstrap, Strategy A)", () => {
  it("parses /favorites/ids response and returns ids+updatedAt+etag", async () => {
    server.use(
      http.get(IDS_URL, () =>
        HttpResponse.json(
          { ids: ["a", "b"], updated_at: "2026-06-01T10:00:00+00:00" },
          { headers: { etag: '"abc"' } },
        ),
      ),
    );

    const result = await fetchFavoriteIds();

    expect(result).toEqual({
      notModified: false,
      ids: ["a", "b"],
      updatedAt: "2026-06-01T10:00:00+00:00",
      etag: '"abc"',
    });
  });

  it("returns null updatedAt when wishlist is empty (ids: [])", async () => {
    server.use(http.get(IDS_URL, () => HttpResponse.json({ ids: [], updated_at: null })));

    const result = await fetchFavoriteIds();

    expect(result).toMatchObject({ notModified: false, ids: [], updatedAt: null });
  });

  it("reads ETag from response headers", async () => {
    server.use(
      http.get(IDS_URL, () =>
        HttpResponse.json({ ids: [], updated_at: null }, { headers: { etag: '"empty"' } }),
      ),
    );

    const result = await fetchFavoriteIds();

    expect(result).toMatchObject({ etag: '"empty"' });
  });

  it("sends If-None-Match header when provided to fetchFavoriteIds", async () => {
    let received: string | null = "UNSET";
    server.use(
      http.get(IDS_URL, ({ request }) => {
        received = request.headers.get("if-none-match");
        return HttpResponse.json({ ids: [], updated_at: null });
      }),
    );

    await fetchFavoriteIds({ ifNoneMatch: '"abc"' });

    expect(received).toBe('"abc"');
  });

  it("returns notModified: true when server replies 304", async () => {
    server.use(
      http.get(IDS_URL, () => new HttpResponse(null, { status: 304, headers: { etag: '"abc"' } })),
    );

    const result = await fetchFavoriteIds({ ifNoneMatch: '"abc"' });

    expect(result).toEqual({ notModified: true, etag: '"abc"' });
  });

  it("throws when response.status is not ok and not 304", async () => {
    server.use(http.get(IDS_URL, () => new HttpResponse(null, { status: 500 })));

    await expect(fetchFavoriteIds()).rejects.toThrow(/500/);
  });

  it("throws ZodError when response body is malformed (missing ids field)", async () => {
    server.use(http.get(IDS_URL, () => HttpResponse.json({ updated_at: null })));

    await expect(fetchFavoriteIds()).rejects.toBeInstanceOf(z.ZodError);
  });
});

describe("addFavorite / removeFavorite", () => {
  it("calls addFavorite via POST to /mobile/favorites/{productId}", async () => {
    let method: string | undefined;
    server.use(
      http.post(favUrl("01prod"), ({ request }) => {
        method = request.method;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(addFavorite("01prod")).resolves.toBeUndefined();
    expect(method).toBe("POST");
  });

  it("calls removeFavorite via DELETE to /mobile/favorites/{productId}", async () => {
    let method: string | undefined;
    server.use(
      http.delete(favUrl("01prod"), ({ request }) => {
        method = request.method;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(removeFavorite("01prod")).resolves.toBeUndefined();
    expect(method).toBe("DELETE");
  });
});

describe("bulkMergeFavorites", () => {
  it("parses bulk-merge response and converts snake_case to camelCase", async () => {
    server.use(
      http.post(BULK_URL, () =>
        HttpResponse.json({ merged_count: 3, skipped_count: 1, truncated: false }),
      ),
    );

    const result = await bulkMergeFavorites(["a", "b", "c", "d"]);

    expect(result).toEqual({ mergedCount: 3, skippedCount: 1, truncated: false });
  });

  it("propagates truncated and skipped_count from bulk-merge", async () => {
    server.use(
      http.post(BULK_URL, () =>
        HttpResponse.json({ merged_count: 0, skipped_count: 2, truncated: true }),
      ),
    );

    const result = await bulkMergeFavorites(["a", "b"]);

    expect(result).toMatchObject({ truncated: true, skippedCount: 2 });
  });

  it("sends the ids array in the request body", async () => {
    let body: unknown;
    server.use(
      http.post(BULK_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ merged_count: 1, skipped_count: 0, truncated: false });
      }),
    );

    await bulkMergeFavorites(["a"]);

    expect(body).toEqual({ ids: ["a"] });
  });

  it("throws ZodError on malformed bulk-merge response", async () => {
    server.use(http.post(BULK_URL, () => HttpResponse.json({ merged_count: 1 })));

    await expect(bulkMergeFavorites(["a"])).rejects.toBeInstanceOf(z.ZodError);
  });
});

describe("fetchWishlistPage", () => {
  it("parses /mobile/wishlist page response (minimal strict schema)", async () => {
    server.use(
      http.get(WISHLIST_URL, () =>
        HttpResponse.json({
          wishlist: {
            items: [
              { product_id: "01prod", name: "Tomates", image_url: "https://cdn/x.jpg", price: 150000 },
            ],
            pagination: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
          },
          // extra top-level sections are ignored by the strict-minimal schema
          filter_counts: { all: 1, promo: 0 },
          counts: { cart_items: 0, wishlist_items: 1 },
          empty_state: null,
        }),
      ),
    );

    const result = await fetchWishlistPage();

    expect(result.wishlist.items).toHaveLength(1);
    expect(result.wishlist.items[0]).toEqual({
      product_id: "01prod",
      name: "Tomates",
      image_url: "https://cdn/x.jpg",
      price: 150000,
    });
    expect(result.wishlist.pagination.per_page).toBe(15);
  });

  it("accepts a null image_url", async () => {
    server.use(
      http.get(WISHLIST_URL, () =>
        HttpResponse.json({
          wishlist: {
            items: [{ product_id: "01prod", name: "No image", image_url: null, price: 5000 }],
            pagination: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
          },
        }),
      ),
    );

    const result = await fetchWishlistPage();

    expect(result.wishlist.items[0].image_url).toBeNull();
  });
});
