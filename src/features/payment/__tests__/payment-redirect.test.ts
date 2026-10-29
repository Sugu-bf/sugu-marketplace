/**
 * The browser only leaves the site for an https URL on a trusted payment
 * provider host: any other URL handed back by the API is refused.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAYMENT_REDIRECT_HOSTS,
  isTrustedPaymentUrl,
  parsePaymentRedirectHosts,
  safePaymentRedirectUrl,
} from "../utils/payment-redirect";

const HOSTS = ["app.ligdicash.com", "api.sugupay.net"];

describe("safePaymentRedirectUrl", () => {
  it.each([
    "https://app.ligdicash.com/pay/v01/redirect/checkout-invoice/confirm/?invoice=abc",
    "https://api.sugupay.net/checkout/9f2c?ref=SGU-2026-00042",
    "HTTPS://APP.LIGDICASH.COM/pay",
    "https://app.ligdicash.com:443/pay",
  ])("accepts the provider URL %s", (url) => {
    expect(isTrustedPaymentUrl(url, HOSTS)).toBe(true);
  });

  it("returns the normalized URL", () => {
    expect(safePaymentRedirectUrl("HTTPS://APP.LIGDICASH.COM:443/pay?x=1", HOSTS)).toBe(
      "https://app.ligdicash.com/pay?x=1"
    );
  });

  it.each([
    ["plain http", "http://app.ligdicash.com/pay"],
    ["javascript scheme", "javascript:alert(document.cookie)"],
    ["data scheme", "data:text/html,<script>alert(1)</script>"],
    ["protocol-relative", "//app.ligdicash.com/pay"],
    ["relative path", "/payments/success"],
    ["lookalike suffix", "https://app.ligdicash.com.evil.tld/pay"],
    ["lookalike prefix", "https://evilapp.ligdicash.com/pay"],
    ["other subdomain", "https://www.app.ligdicash.com/pay"],
    ["parent domain", "https://ligdicash.com/pay"],
    ["trailing dot", "https://app.ligdicash.com./pay"],
    ["userinfo", "https://user:pass@app.ligdicash.com/pay"],
    ["host hidden behind userinfo", "https://app.ligdicash.com@evil.tld/pay"],
    ["backslash trick", "https://app.ligdicash.com\\@evil.tld/pay"],
    ["non-default port", "https://app.ligdicash.com:8443/pay"],
    ["leading whitespace", " https://app.ligdicash.com/pay"],
    ["unknown host", "https://evil.tld/pay"],
    ["not a URL", "https://"],
    ["empty string", ""],
  ])("refuses a %s URL", (_label, url) => {
    expect(safePaymentRedirectUrl(url, HOSTS)).toBeNull();
  });

  it.each([null, undefined, 42, {}])("refuses a non-string value %s", (value) => {
    expect(safePaymentRedirectUrl(value, HOSTS)).toBeNull();
  });

  it("refuses everything when no host is allowed", () => {
    expect(isTrustedPaymentUrl("https://app.ligdicash.com/pay", [])).toBe(false);
  });

  it("trusts the production providers by default", () => {
    expect(isTrustedPaymentUrl("https://app.ligdicash.com/pay")).toBe(true);
    expect(isTrustedPaymentUrl("https://api.sugupay.net/pay")).toBe(true);
  });
});

describe("parsePaymentRedirectHosts", () => {
  it("reads a comma-separated list, trimmed and lowercased", () => {
    expect(parsePaymentRedirectHosts(" App.LigdiCash.com , sandbox.sugupay.net,, ")).toEqual([
      "app.ligdicash.com",
      "sandbox.sugupay.net",
    ]);
  });

  it.each([undefined, "", " , "])("falls back to the production providers for %j", (raw) => {
    expect(parsePaymentRedirectHosts(raw)).toEqual([...DEFAULT_PAYMENT_REDIRECT_HOSTS]);
  });
});
