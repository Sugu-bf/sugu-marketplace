/**
 * The server-side cart call forwards only the cookie the API reads (the
 * guest cart's), never the visitor's other cookies.
 */

import { describe, expect, test } from "vitest";
import { forwardedCookies } from "./cart.api";

describe("cookies forwarded to the cart API", () => {
  test("keeps the guest cart cookie only", () => {
    expect(
      forwardedCookies("_fbp=fb.1.2; auth_token=secret; guest_cart=abc.def; _ga=GA1")
    ).toBe("guest_cart=abc.def");
  });

  test("forwards nothing when the API needs nothing", () => {
    expect(forwardedCookies("_fbp=fb.1.2; auth_token=secret")).toBeUndefined();
    expect(forwardedCookies(undefined)).toBeUndefined();
  });
});
