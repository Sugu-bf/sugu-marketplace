// ─── Site / Brand ────────────────────────────────────────────
export const SITE_NAME = "Sugu";
export const SITE_TAGLINE = "La plus grande plateforme de vente en ligne";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sugu.pro";
export const CDN_URL = "https://cdn.sugu.pro";

// ─── Contact ─────────────────────────────────────────────────
export const CONTACT = {
  phone: "+226 00 00 00 00",
  email: "contact@sugu.pro",
  address: "3252 Bobo Dioula Avenue, Guimbi Ouattara koko, Burkina Faso",
} as const;

// ─── SEO Defaults ────────────────────────────────────────────
export const SEO = {
  defaultTitle: `${SITE_NAME} — Votre marketplace en ligne`,
  titleTemplate: `%s | ${SITE_NAME}`,
  defaultDescription:
    "Découvrez des milliers de produits au meilleur prix sur Sugu. Livraison rapide, paiement sécurisé, et un large choix de catégories.",
  locale: "fr_BF",
  type: "website",
  twitterHandle: "@sugu_pro",
} as const;

// ─── Pagination ──────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;

// ─── Currency ────────────────────────────────────────────────
export const CURRENCY = {
  code: "XOF",
  symbol: "FCFA",
  locale: "fr-BF",
} as const;

/**
 * Format a price with the site currency.
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: "currency",
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
