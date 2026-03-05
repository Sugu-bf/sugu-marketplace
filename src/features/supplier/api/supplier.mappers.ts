import type { SupplierListItem } from "../models/supplier";
import type { SupplierVendorCard } from "./supplier.schemas";

// ─── Country Detection ───────────────────────────────────

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  burkina: { name: "Burkina Faso", flag: "🇧🇫" },
  mali: { name: "Mali", flag: "🇲🇱" },
  niger: { name: "Niger", flag: "🇳🇪" },
  "côte d'ivoire": { name: "Côte d'Ivoire", flag: "🇨🇮" },
  ivoire: { name: "Côte d'Ivoire", flag: "🇨🇮" },
  ghana: { name: "Ghana", flag: "🇬🇭" },
  sénégal: { name: "Sénégal", flag: "🇸🇳" },
  senegal: { name: "Sénégal", flag: "🇸🇳" },
  togo: { name: "Togo", flag: "🇹🇬" },
  bénin: { name: "Bénin", flag: "🇧🇯" },
  benin: { name: "Bénin", flag: "🇧🇯" },
  cameroun: { name: "Cameroun", flag: "🇨🇲" },
  guinée: { name: "Guinée", flag: "🇬🇳" },
  guinee: { name: "Guinée", flag: "🇬🇳" },
};

function detectCountry(addressLine: string): { name: string; flag: string } {
  const lower = addressLine.toLowerCase();
  for (const [key, val] of Object.entries(COUNTRY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return { name: "Afrique", flag: "🌍" };
}

// ─── Initials ────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

// ─── Deterministic Color from Seed ───────────────────────

const COLORS = [
  "#A855F7",
  "#22C55E",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#EF4444",
  "#14B8A6",
  "#6366F1",
];

function getColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

// ─── Mapper ──────────────────────────────────────────────

/**
 * Map API VendorCard → frontend SupplierListItem.
 */
export function mapVendorToSupplier(
  item: SupplierVendorCard,
  featured: boolean = false,
): SupplierListItem {
  const country = detectCountry(item.contact.address_line);

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    logoUrl: item.logo.url || undefined,
    logoInitials: getInitials(item.name),
    logoColor: getColor(item.id),
    location: item.contact.address_line,
    country: country.name,
    countryFlag: country.flag,
    memberSince: "2023", // Backend doesn't return created_at in listing
    tagline: "",         // MVP — empty, could be enriched later
    rating: item.rating.avg,
    reviewCount: item.rating.count,
    totalProducts: 0,    // Not in listing API — placeholder
    totalSales: 0,       // Not in listing API — placeholder
    isFeatured: featured,
    sectors: [],         // Not in listing API — placeholder
  };
}
