/**
 * Coming Soon gate — single source of truth.
 *
 * Before launch the marketplace catalogue (products, stores, cart, checkout) is
 * walled off, but the editorial and ecosystem pages must stay reachable: they
 * are what Google indexes and what the pre-launch footer links to. Keeping the
 * wall, robots.txt and the sitemap driven by the same list is what stops them
 * from contradicting each other — the wall used to 307 every sitemap URL to "/".
 *
 * `COMING_SOON_ENABLED` is fixed at build time (next.config `env`), so the
 * proxy, the prerendered pages, robots.txt and the sitemap always agree: read
 * at runtime by the proxy but at prerender by the pages, the two used to
 * disagree after a switch. While it is on, the proxy serves /coming-soon in
 * place of "/".
 *
 * Switching it: change the variable, rebuild and redeploy, then purge the CDN
 * cache (Cloudflare) for "/" and the editorial pages — they are cached with
 * stale-while-revalidate and would keep serving the previous mode.
 */

/** The route serving the landing page in place of "/" while coming soon. */
export const COMING_SOON_ROUTE = "/coming-soon";

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
  return [...ALLOWED_EXACT];
}
