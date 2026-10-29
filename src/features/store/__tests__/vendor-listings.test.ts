/**
 * P0-17 (audit 2026-10-29): /stores was made entirely of mock stores, and
 * /fournisseurs fell back to mock suppliers on any error, ignored its page
 * number (the same 12 every time), counted the current page as the total
 * and filtered on a sector the API does not send.
 *
 * Both read GET /api/v1/vendors now: cursor pages, no invented count, and an
 * outage goes to the error boundary.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { queryAllStores } from "@/features/store/queries/store-queries";
import { queryAllSuppliers } from "@/features/supplier/queries/supplier-queries";
import { buildSupplierListingUrl, parseSupplierSearchParams } from "@/features/supplier/utils/queryState";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const vendorCard = {
  id: "01JB8Z5K3M4N5P6Q7R8S9T0V2X",
  slug: "atelier-koko",
  name: "Atelier Koko",
  cover_image: { url: "https://cdn.sugu.pro/s/cover.png", alt: "Atelier Koko" },
  logo: { url: "https://cdn.sugu.pro/s/logo.png", alt: "Atelier Koko" },
  rating: { avg: 4.5, count: 12 },
  contact: { address_line: "Bobo-Dioulasso, Burkina Faso", zip: "", email: "", phone: "" },
  stats: { total_products: 30, total_sales: 7 },
  member_since: null,
  is_followed: false,
};

const page = (hasMore: boolean) => ({
  success: true,
  items: [vendorCard],
  facets: { rating: [] },
  meta: { limit: 12, next_cursor: hasMore ? "eyJpZCI6IjAxIn0" : null, has_more: hasMore },
});

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("/stores and /fournisseurs listings", () => {
  it("list the real vendors, page by page with the API cursor", async () => {
    fetchMock.mockResolvedValue(jsonResponse(page(true)));
    const state = parseSupplierSearchParams({ q: "koko", sort: "newest", cursor: "abc" });

    const { stores, nextCursor } = await queryAllStores(state);

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/v1/vendors");
    expect(url.searchParams.get("cursor")).toBe("abc");
    expect(url.searchParams.get("q")).toBe("koko");
    expect(url.searchParams.get("sort")).toBe("newest");
    expect(stores).toHaveLength(1);
    expect(stores[0]).toMatchObject({ id: vendorCard.id, slug: "atelier-koko", name: "Atelier Koko", memberSince: "" });
    expect(nextCursor).toBe("eyJpZCI6IjAxIn0");
  });

  it("stop where the API stops", async () => {
    fetchMock.mockResolvedValue(jsonResponse(page(false)));

    const { suppliers, nextCursor } = await queryAllSuppliers(parseSupplierSearchParams({}));

    expect(suppliers.map((s) => s.slug)).toEqual(["atelier-koko"]);
    expect(nextCursor).toBeNull();
  });

  it("throw on an outage instead of showing stand-in vendors", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Server Error" }, 503));

    await expect(queryAllStores(parseSupplierSearchParams({}))).rejects.toThrow();
    await expect(queryAllSuppliers(parseSupplierSearchParams({}))).rejects.toThrow();
  });

  it("keep sort, search and cursor in the URL of each listing", () => {
    expect(buildSupplierListingUrl({ sort: "top_rated", q: "pagne", cursor: "c1" }, "/stores")).toBe(
      "/stores?q=pagne&sort=top_rated&cursor=c1",
    );
    expect(buildSupplierListingUrl({ sort: "popular", q: "" })).toBe("/fournisseurs");
    expect(parseSupplierSearchParams({ cursor: "x".repeat(501) }).cursor).toBeNull();
  });
});
