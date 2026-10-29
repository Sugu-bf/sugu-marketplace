/**
 * The paths served by the App Router. They can never be the source of an SEO
 * redirect (they ARE destinations), so the proxy skips the backend lookup for
 * them. Keep in sync with the src/app directory structure.
 */

/** A route and everything below it: "/account" covers "/account/orders". */
const ROUTE_TREES = [
  "/search",
  "/acheter",
  "/vendeurs",
  "/agences-de-livraison",
  "/coursiers",
  "/sugupay",
  "/fournisseurs",
  "/blog",
  "/cart",
  "/checkout",
  "/payments",
  "/track-order",
  "/help",
  "/support-chat",
  "/banners",
  "/conditions-generales",
  "/politique-de-confidentialite",
  "/politique-anti-fraude",
  "/politique-livraison-retours",
  "/login",
  "/register",
  "/onboarding",
  "/forgot-password",
  "/product",
  "/category",
  "/store",
  "/stores",
  "/account",
  "/messages",
  "/pages",
  "/invoices",
] as const;

export function isKnownAppRoute(pathname: string): boolean {
  // The home page is matched exactly: as a prefix, "/" would cover every path.
  if (pathname === "/") return true;

  return ROUTE_TREES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
