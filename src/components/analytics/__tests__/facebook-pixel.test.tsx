// @vitest-environment jsdom
/**
 * The Meta Pixel sends the full address of the page with each event. It
 * leaked `/checkout?session=<id>` (P0-7): once loaded on a product page, it
 * stayed loaded and sent a PageView on every client-side navigation. No event
 * may leave from a checkout, payment, account, order or invoice page, nor
 * with a query that is not a campaign's.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";

vi.mock("@/features/consent/consent", () => ({
  useConsent: () => "granted",
  readConsent: () => "granted",
}));

import { FacebookPixel } from "../FacebookPixel";
import { canTrackPage, isPrivatePath } from "../pixel-privacy";
import { __resetMetaPixel } from "@/features/consent/meta-pixel";

const pixel = (
  <FacebookPixel contentId="SKU-1" contentName="Riz" contentCategory="Épicerie" value={5000} />
);

describe("canTrackPage", () => {
  it.each([
    "/checkout",
    "/payments/success",
    "/payments/failed",
    "/account",
    "/account/orders",
    "/track-order",
    "/invoices/" + "a".repeat(64),
    "/messages/01jkqz3m5baxnp9c7hd2fewyr4",
    "/support-chat",
  ])("never tracks %s", (path) => {
    expect(isPrivatePath(path)).toBe(true);
    expect(canTrackPage(path, "")).toBe(false);
  });

  it("tracks a product page, with or without campaign parameters", () => {
    expect(canTrackPage("/product/riz-parfume", "")).toBe(true);
    expect(canTrackPage("/product/riz-parfume", "?utm_source=facebook&utm_campaign=x&fbclid=abc")).toBe(true);
  });

  it("never sends a page whose query holds anything else", () => {
    expect(canTrackPage("/product/riz-parfume", "?session=01jkqz3m5baxnp9c7hd2fewyr4")).toBe(false);
    expect(canTrackPage("/product/riz-parfume", "?utm_source=x&token=abc")).toBe(false);
  });

  it("does not take a public page for a private one", () => {
    expect(isPrivatePath("/accounting-tips")).toBe(false);
    expect(isPrivatePath("/checkout-guide")).toBe(false);
  });
});

describe("FacebookPixel", () => {
  const fbq = vi.fn();

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123");
    __resetMetaPixel();
    fbq.mockReset();
    window.fbq = fbq as unknown as typeof window.fbq;
    window.history.replaceState(null, "", "/product/riz-parfume");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    window.history.replaceState(null, "", "/");
  });

  it("sends the view of the product from a product page, with consent", () => {
    render(pixel);

    expect(fbq).toHaveBeenCalledWith("set", "autoConfig", false, "123");
    expect(fbq).toHaveBeenCalledWith("track", "ViewContent", expect.objectContaining({ content_ids: ["SKU-1"] }));
  });

  it("sends nothing when the address holds a query that is not a campaign's", () => {
    window.history.replaceState(null, "", "/product/riz-parfume?session=01jkqz3m5baxnp9c7hd2fewyr4");

    render(pixel);

    expect(fbq).not.toHaveBeenCalled();
  });

  it("sends nothing from a private page", () => {
    window.history.replaceState(null, "", "/checkout?session=01jkqz3m5baxnp9c7hd2fewyr4");

    render(pixel);

    expect(fbq).not.toHaveBeenCalled();
  });
});
