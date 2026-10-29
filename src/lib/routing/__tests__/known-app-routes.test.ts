/**
 * Known App Router routes (audit M5): "/" used to be a prefix, which made
 * every path "known" — no SEO redirect was ever looked up.
 */
import { describe, it, expect } from "vitest";
import { isKnownAppRoute } from "@/lib/routing/known-app-routes";

describe("isKnownAppRoute", () => {
  it("knows the home page exactly, not as a prefix", () => {
    expect(isKnownAppRoute("/")).toBe(true);
    expect(isKnownAppRoute("/ancienne-categorie")).toBe(false);
    expect(isKnownAppRoute("/old/legacy/page")).toBe(false);
  });

  it("knows a route and what lies below it", () => {
    expect(isKnownAppRoute("/account")).toBe(true);
    expect(isKnownAppRoute("/account/orders/42")).toBe(true);
    expect(isKnownAppRoute("/product/iphone-15")).toBe(true);
    expect(isKnownAppRoute("/invoices/abc")).toBe(true);
  });

  it("knows the payment return pages", () => {
    expect(isKnownAppRoute("/payments/success")).toBe(true);
    expect(isKnownAppRoute("/payments/failed")).toBe(true);
  });

  it("does not mistake a longer segment for a known route", () => {
    expect(isKnownAppRoute("/blogue")).toBe(false);
    expect(isKnownAppRoute("/products-old")).toBe(false);
    expect(isKnownAppRoute("/storefront")).toBe(false);
  });
});
