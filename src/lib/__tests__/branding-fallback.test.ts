/**
 * The fallback branding only names icons the site really serves: the old
 * "/favicon.svg" answered 404 on every page while the branding API was down.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { BRANDING_FALLBACK } from "@/lib/branding.service";

const root = path.resolve(__dirname, "../../..");

function served(urlPath: string): boolean {
  const name = urlPath.replace(/^\//, "");
  return existsSync(path.join(root, "public", name)) || existsSync(path.join(root, "src/app", name));
}

describe("BRANDING_FALLBACK icons", () => {
  it.each([
    ["favicon", BRANDING_FALLBACK.logos.favicon_url],
    ["apple touch icon", BRANDING_FALLBACK.logos.apple_touch_icon_url],
  ])("serves the %s it names", (_label, url) => {
    expect(url).toMatch(/^\//);
    expect(served(url!)).toBe(true);
  });
});
