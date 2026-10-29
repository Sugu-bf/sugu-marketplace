/**
 * Coming Soon gate — single source of truth.
 *
 * Before launch the marketplace catalogue (products, stores, cart, checkout) is
 * walled off, but the editorial and ecosystem pages must stay reachable: they
 * are what Google indexes and what the pre-launch footer links to. Keeping the
 * wall, robots.txt and the sitemap driven by the same list is what stops them
 * from contradicting each other — the wall used to 307 every sitemap URL to "/".
 *
 * `COMING_SOON_ENABLED` is server-only on purpose (no NEXT_PUBLIC_ prefix) so it
 * never reaches the client bundle. Every consumer here runs server-side:
 * middleware, robots.ts and the sitemap route handlers.
 */

/** Exact paths reachable while the wall is up. */
const ALLOWED_EXACT = [
  "/",
  "/acheter",
  "/vendeurs",
  "/agences-de-livraison",
  "/coursiers",
  "/sugupay",
  "/blog",
  "/help",
  "/conditions-generales",
  "/politique-de-confidentialite",
  "/politique-livraison-retours",
  "/politique-anti-fraude",
] as const;

/** Subtrees reachable while the wall is up (editorial content only). */
const ALLOWED_PREFIXES = ["/blog/", "/pages/"] as const;

/** Reachable, but canonicalised to pro.sugu.pro: never listed in a sitemap. */
const CANONICAL_ELSEWHERE: readonly string[] = ["/vendeurs", "/agences-de-livraison", "/coursiers"];

export function isComingSoon(): boolean {
  return process.env.COMING_SOON_ENABLED === "true";
}

export function isAllowedDuringComingSoon(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  return (
    ALLOWED_EXACT.some((allowed) => allowed === path) ||
    ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

/**
 * The URLs advertised to search engines while the wall is up. Anything else in
 * the catalogue would be crawled straight into a redirect.
 */
export function comingSoonSitemapPaths(): string[] {
  return ALLOWED_EXACT.filter((path) => !CANONICAL_ELSEWHERE.includes(path));
}

/**
 * robots.txt Allow rules while the wall is up, next to `Disallow: /`.
 *
 * The longest matching rule wins, and on a tie Allow wins: `Allow: /` against
 * `Disallow: /` opened the whole site. Exact paths end with `$`, so "/" only
 * allows the home page.
 */
export function comingSoonRobotsAllow(): string[] {
  return [...ALLOWED_EXACT.map((path) => `${path}$`), ...ALLOWED_PREFIXES];
}
