/**
 * robots.txt and sitemap while the coming-soon wall is up (audit 2026-10-29,
 * catalogue/SEO low findings).
 *
 * `Allow: /` next to `Disallow: /`: same length, so Allow won and the whole
 * site was open to crawlers. And the sitemaps listed /vendeurs,
 * /agences-de-livraison and /coursiers, canonicalised to pro.sugu.pro.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import robots from "../robots";
import { comingSoonSitemapPaths } from "@/lib/coming-soon";

/** Google's precedence: the longest matching pattern wins, Allow on a tie. */
function isAllowed(path: string, allow: string[], disallow: string[]): boolean {
  const matchLength = (pattern: string) => {
    const exact = pattern.endsWith("$");
    const body = exact ? pattern.slice(0, -1) : pattern;
    const matches = exact ? path === body : path.startsWith(body);
    return matches ? pattern.length : -1;
  };
  const bestAllow = Math.max(-1, ...allow.map(matchLength));
  const bestDisallow = Math.max(-1, ...disallow.map(matchLength));
  return bestAllow >= bestDisallow;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("robots.txt during coming soon", () => {
  it("opens only the pages the wall lets through", () => {
    vi.stubEnv("COMING_SOON_ENABLED", "true");
    const rule = [robots().rules].flat()[0]!;
    const allow = [rule.allow ?? []].flat();
    const disallow = [rule.disallow ?? []].flat();

    expect(isAllowed("/", allow, disallow)).toBe(true);
    expect(isAllowed("/blog/un-article", allow, disallow)).toBe(true);
    expect(isAllowed("/help", allow, disallow)).toBe(true);
    expect(isAllowed("/product/pagne", allow, disallow)).toBe(false);
    expect(isAllowed("/stores", allow, disallow)).toBe(false);
    expect(isAllowed("/checkout", allow, disallow)).toBe(false);
  });
});

describe("sitemap paths", () => {
  it("list no page canonicalised to pro.sugu.pro", () => {
    for (const path of ["/vendeurs", "/agences-de-livraison", "/coursiers"]) {
      expect(comingSoonSitemapPaths()).not.toContain(path);
    }
    expect(comingSoonSitemapPaths()).toContain("/");
  });
});
