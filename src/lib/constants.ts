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

// ─── Adresses ────────────────────────────────────────────────

/**
 * Libellés d'adresse — taxonomie UNIQUE pour le checkout et « Mes adresses ».
 *
 * Les deux écrans utilisaient auparavant des listes divergentes
 * ("Maison" vs "Domicile"), ce qui cassait le rendu des icônes selon l'écran
 * où l'adresse avait été créée.
 */
export const ADDRESS_LABELS = ["Domicile", "Bureau", "Famille", "Autre"] as const;

export const DEFAULT_ADDRESS_LABEL = ADDRESS_LABELS[0];

/**
 * Pays de livraison ouverts — UEMOA.
 *
 * Le champ pays était auparavant en saisie libre côté checkout tout en étant
 * forcé à "BF" à l'envoi : un acheteur pouvait saisir « Mali » et voir sa
 * commande enregistrée au Burkina. Liste fermée, codes ISO-3166-1 alpha-2.
 */
export const DELIVERY_COUNTRIES = [
  { code: "BF", name: "Burkina Faso" },
  { code: "BJ", name: "Bénin" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "GW", name: "Guinée-Bissau" },
  { code: "ML", name: "Mali" },
  { code: "NE", name: "Niger" },
  { code: "SN", name: "Sénégal" },
  { code: "TG", name: "Togo" },
] as const;

export const DEFAULT_COUNTRY_CODE = "BF";

/** Nom lisible d'un pays de livraison à partir de son code ISO. */
export function countryName(code: string | null | undefined): string {
  return (
    DELIVERY_COUNTRIES.find((c) => c.code === code)?.name ?? code ?? ""
  );
}
