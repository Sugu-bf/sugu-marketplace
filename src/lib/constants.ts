// ─── Site / Brand ────────────────────────────────────────────
export const SITE_NAME = "Sugu";
export const SITE_TAGLINE = "La plus grande plateforme de vente en ligne";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sugu.pro";
export const CDN_URL = "https://cdn.sugu.pro";

// ─── Analytics ───────────────────────────────────────────────
/** Facebook / Meta Pixel ID. Set NEXT_PUBLIC_META_PIXEL_ID in .env.local */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

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
// Single source of truth for the site's currency.
// Change these values to switch the entire marketplace to another currency.
export const CURRENCY = {
  /** ISO 4217 code (e.g. "XOF", "EUR", "USD") */
  code: "XOF",
  /** Short symbol shown next to prices (e.g. "FCFA", "€", "$") */
  symbol: "FCFA",
  /** Intl locale used by Intl.NumberFormat (e.g. "fr-BF") */
  locale: "fr-BF",
  /** Human-readable label for settings / selects (e.g. "FCFA (XOF)") */
  label: "FCFA (XOF)",
} as const;

/**
 * Format a price with the site currency.
 * Uses Intl.NumberFormat for correct thousand-separators and symbol placement.
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: "currency",
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Build a human-readable price-range label using the site currency symbol.
 * Examples:
 *   formatPriceRangeLabel(0, 1000)       → "Moins de 1 000 FCFA"
 *   formatPriceRangeLabel(1000, 2000)    → "1 000 – 2 000 FCFA"
 *   formatPriceRangeLabel(5000, Infinity) → "Plus de 5 000 FCFA"
 */
export function formatPriceRangeLabel(min: number, max: number): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat(CURRENCY.locale, {
      maximumFractionDigits: 0,
    }).format(n);

  if (min === 0 || min <= 0) return `Moins de ${fmt(max)} ${CURRENCY.symbol}`;
  if (max >= 999_999 || max === Infinity) return `Plus de ${fmt(min)} ${CURRENCY.symbol}`;
  return `${fmt(min)} – ${fmt(max)} ${CURRENCY.symbol}`;
}

/**
 * Default price-range buckets used across filters (search, category, etc.).
 * Labels are auto-generated from the CURRENCY constant.
 */
export const DEFAULT_PRICE_RANGES = [
  { min: 0, max: 1000, label: formatPriceRangeLabel(0, 1000) },
  { min: 1000, max: 2000, label: formatPriceRangeLabel(1000, 2000) },
  { min: 2000, max: 3000, label: formatPriceRangeLabel(2000, 3000) },
  { min: 3000, max: 5000, label: formatPriceRangeLabel(3000, 5000) },
  { min: 5000, max: 999999, label: formatPriceRangeLabel(5000, 999999) },
] as const;
