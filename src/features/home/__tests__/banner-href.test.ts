/**
 * Banner links (audit 2026-10-29, catalogue low findings): the `cta_url` of a
 * banner, typed in the admin, went into the page as is. Only a site path or
 * an http(s) URL is kept now.
 */
import { describe, it, expect } from "vitest";
import { resolveHomeHref } from "../services/api-home-service";

describe("resolveHomeHref", () => {
  it.each([
    ["/category/mode", "/category/mode"],
    ["https://sugu.pro/search?q=pagne", "https://sugu.pro/search?q=pagne"],
    ["  /stores  ", "/stores"],
  ])("keeps %s", (url, expected) => {
    expect(resolveHomeHref(url)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)",
    " JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "//evil.example/phish",
    "/\\evil.example",
    "vbscript:msgbox(1)",
    "pas une url",
    "#",
    "",
  ])("falls back for %s", (url) => {
    expect(resolveHomeHref(url, "/search")).toBe("/search");
  });
});
