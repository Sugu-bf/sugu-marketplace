/**
 * queryCart degrades to an empty cart when the API fails, but must let
 * Next's own control-flow errors through: swallowing the dynamic-usage
 * signal during a build hid it behind a "[Cart SSR] Failed" log.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const headers = vi.fn();
vi.mock("next/headers", () => ({ headers: () => headers() }));

const fetchCartSSR = vi.fn();
vi.mock("../../api/cart.api", () => ({ fetchCartSSR: (...args: unknown[]) => fetchCartSSR(...args) }));

import { queryCart } from "../cart-queries";

afterEach(() => {
  headers.mockReset();
  fetchCartSSR.mockReset();
  vi.restoreAllMocks();
});

describe("queryCart", () => {
  it("lets Next's dynamic-usage signal through instead of rendering an empty cart", async () => {
    const dynamicUsage = Object.assign(new Error("Dynamic server usage: headers"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    headers.mockRejectedValue(dynamicUsage);

    await expect(queryCart()).rejects.toBe(dynamicUsage);
  });

  it("renders an empty cart when the API is unreachable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    headers.mockResolvedValue(new Headers({ cookie: "sugu_cart_token=abc" }));
    fetchCartSSR.mockRejectedValue(new Error("network down"));

    const cart = await queryCart();

    expect(cart.lines).toEqual([]);
  });
});
