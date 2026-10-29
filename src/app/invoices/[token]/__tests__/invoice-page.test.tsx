/**
 * A public invoice is read with the secret token in its address. A token of
 * another shape never reaches the backend (404 at once), the page is never
 * cached (it was kept 60 s by ISR) and it is never indexed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound }));

import InvoicePage, { dynamic, generateMetadata, revalidate } from "../page";

const TOKEN = "a1".repeat(32);
const fetchMock = vi.fn();
const params = (token: string) => ({ params: Promise.resolve({ token }) });

const INVOICE = {
  invoice_number: "FAC-2026-0001",
  status: "paid",
  status_label: "Payée",
  currency: "XOF",
  subtotal: 10000,
  discount: 0,
  shipping: 1000,
  tax: 0,
  total: 11000,
  paid: 11000,
  balance_due: 0,
  issued_at: "2026-10-21T10:00:00Z",
  created_at: "2026-10-21T10:00:00Z",
  company: { name: "Sugu" },
  customer: { name: "Awa" },
  billing_address: {},
  shipping_address: {},
  items: [],
  download_url: "https://api.sugu.test/invoices/x/download",
};

beforeEach(() => {
  fetchMock.mockReset();
  notFound.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("public invoice page", () => {
  it("is rendered on each request, never cached", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(0);
  });

  it.each([
    "short",
    "A1".repeat(32),
    `${"a".repeat(64)}0`,
    `${"a".repeat(63)}g`,
    "../../api/v1/admin",
  ])("answers 404 for the token %s without asking the backend", async (token) => {
    await expect(InvoicePage(params(token))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is never indexed, nor its address sent on, even for a bad token", async () => {
    const metadata = await generateMetadata(params("short"));

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.referrer).toBe("no-referrer");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks the backend without any cache for a well-formed token", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: INVOICE }), { status: 200 }));

    const metadata = await generateMetadata(params(TOKEN));

    expect(metadata.title).toBe("Facture FAC-2026-0001 — Sugu");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(new RegExp(`/api/v1/public/invoices/${TOKEN}$`));
    expect(init).toEqual({ cache: "no-store" });
  });

  it("answers 404 when the backend does not know the token", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "Not found" }), { status: 404 }));

    await expect(InvoicePage(params(TOKEN))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
