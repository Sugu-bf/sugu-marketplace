import type { RelatedSearch, PriceRange } from "../models/search";
import type { ProductListItem } from "@/features/product";

// ─── Mock Search Products (richer, 12 items) ────────────────

const mockSearchProducts: ProductListItem[] = [
  {
    id: 1,
    slug: "fraises-fraiches-bio",
    name: "Fraises Fraîches Bio",
    price: 2500,
    originalPrice: 3500,
    discount: 29,
    thumbnail: "/products/strawberries.png",
    rating: 4.5,
    reviewCount: 128,
    stock: 12,
    sold: 85,
    vendorName: "Ferme du Soleil",
    categoryName: "Fruits & Légumes",
  },
  {
    id: 2,
    slug: "oranges-navel-premium",
    name: "Oranges Navel Premium",
    price: 1800,
    originalPrice: 2500,
    discount: 28,
    thumbnail: "/products/oranges.png",
    rating: 4.8,
    reviewCount: 256,
    stock: 45,
    sold: 320,
    vendorName: "Saveurs d'Afrique",
    categoryName: "Fruits & Légumes",
  },
  {
    id: 3,
    slug: "citrons-verts-frais",
    name: "Citrons Verts Frais",
    price: 1200,
    originalPrice: 1500,
    discount: 20,
    thumbnail: "/products/limes.png",
    rating: 4.2,
    reviewCount: 67,
    stock: 30,
    sold: 98,
    vendorName: "Ferme du Soleil",
    categoryName: "Fruits & Légumes",
  },
  {
    id: 4,
    slug: "raisins-rouges-sans-pepins",
    name: "Raisins Rouges sans Pépins",
    price: 3200,
    originalPrice: 4000,
    discount: 20,
    thumbnail: "/products/grapes.png",
    rating: 4.6,
    reviewCount: 189,
    stock: 8,
    sold: 156,
    vendorName: "Oasis Market",
    categoryName: "Fruits & Légumes",
  },
  {
    id: 5,
    slug: "pommes-golden",
    name: "Pommes Golden Delicious",
    price: 2800,
    originalPrice: 3500,
    discount: 20,
    thumbnail: "/products/apple.png",
    rating: 4.4,
    reviewCount: 94,
    stock: 22,
    sold: 210,
    vendorName: "Saveurs d'Afrique",
    categoryName: "Fruits & Légumes",
  },
  {
    id: 6,
    slug: "lot-fruits-mixtes",
    name: "Lot de Fruits Mixtes",
    price: 4500,
    originalPrice: 6000,
    discount: 25,
    thumbnail: "/products/strawberries.png",
    rating: 4.7,
    reviewCount: 312,
    stock: 15,
    sold: 420,
    vendorName: "Oasis Market",
    categoryName: "Fruits & Légumes",
  },
  {
    id: 7,
    slug: "mangues-kent-premium",
    name: "Mangues Kent Premium",
    price: 3500,
    originalPrice: 4500,
    discount: 22,
    thumbnail: "/products/oranges.png",
    rating: 4.9,
    reviewCount: 412,
    stock: 18,
    sold: 580,
    vendorName: "Tropicana Afrique",
    categoryName: "Fruits & Légumes",
  },
  {
    id: 8,
    slug: "bananes-plantain-mures",
    name: "Bananes Plantain Mûres",
    price: 900,
    originalPrice: 1200,
    discount: 25,
    thumbnail: "/products/limes.png",
    rating: 4.3,
    reviewCount: 178,
    stock: 50,
    sold: 290,
    vendorName: "Ferme du Soleil",
    categoryName: "Fruits & Légumes",
  },
  {
    id: 9,
    slug: "papayes-solo-fraiches",
    name: "Papayes Solo Fraîches",
    price: 2200,
    originalPrice: 2800,
    discount: 21,
    thumbnail: "/products/grapes.png",
    rating: 4.1,
    reviewCount: 56,
    stock: 10,
    sold: 75,
    vendorName: "Bio Marché",
    categoryName: "Fruits & Légumes",
  },
  {
    id: 10,
    slug: "ananas-victoria",
    name: "Ananas Victoria",
    price: 1600,
    originalPrice: 2000,
    discount: 20,
    thumbnail: "/products/apple.png",
    rating: 4.6,
    reviewCount: 203,
    stock: 35,
    sold: 310,
    vendorName: "Tropicana Afrique",
    categoryName: "Fruits & Légumes",
  },
  {
    id: 11,
    slug: "tomates-cerises-grappe",
    name: "Tomates Cerises en Grappe",
    price: 1400,
    originalPrice: 1800,
    discount: 22,
    thumbnail: "/products/strawberries.png",
    rating: 4.4,
    reviewCount: 145,
    stock: 40,
    sold: 195,
    vendorName: "Bio Marché",
    categoryName: "Légumes Frais",
  },
  {
    id: 12,
    slug: "avocat-hass-bio",
    name: "Avocat Hass Bio",
    price: 2000,
    originalPrice: 2500,
    discount: 20,
    thumbnail: "/products/limes.png",
    rating: 4.7,
    reviewCount: 267,
    stock: 25,
    sold: 350,
    vendorName: "Bio Marché",
    categoryName: "Fruits & Légumes",
  },
];

// ─── Related Searches ────────────────────────────────────────

const mockRelatedSearches: RelatedSearch[] = [
  { label: "Fruits frais", query: "fruits frais" },
  { label: "Légumes bio", query: "légumes bio" },
  { label: "Panier de fruits", query: "panier de fruits" },
  { label: "Jus naturel", query: "jus naturel" },
  { label: "Fruits secs", query: "fruits secs" },
  { label: "Salade verte", query: "salade verte" },
  { label: "Fruits exotiques", query: "fruits exotiques" },
  { label: "Épicerie fine", query: "épicerie fine" },
];

// ─── Price Ranges ────────────────────────────────────────────

const mockPriceRanges: PriceRange[] = [
  { min: 0, max: 1000, label: "Moins de 1 000 FCFA" },
  { min: 1000, max: 2000, label: "1 000 – 2 000 FCFA" },
  { min: 2000, max: 3000, label: "2 000 – 3 000 FCFA" },
  { min: 3000, max: 5000, label: "3 000 – 5 000 FCFA" },
  { min: 5000, max: 999999, label: "Plus de 5 000 FCFA" },
];

// ─── Filter Categories ──────────────────────────────────────

const mockFilterCategories = [
  { slug: "fruits-legumes", name: "Fruits & Légumes", count: 245 },
  { slug: "legumes-frais", name: "Légumes Frais", count: 98 },
  { slug: "viande-poisson", name: "Viande & Poisson", count: 180 },
  { slug: "produits-laitiers", name: "Produits Laitiers", count: 132 },
  { slug: "electronique", name: "Électronique", count: 567 },
  { slug: "beaute-sante", name: "Beauté & Santé", count: 324 },
];

// ─── Exported Functions ─────────────────────────────────────

export function getMockSearchProducts(query: string, count?: number): ProductListItem[] {
  const q = query.toLowerCase();
  const filtered = mockSearchProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q) ||
      p.vendorName.toLowerCase().includes(q)
  );
  // If no match, return all (mock behavior)
  const results = filtered.length > 0 ? filtered : mockSearchProducts;
  return count ? results.slice(0, count) : results;
}

export function getMockRelatedSearches(): RelatedSearch[] {
  return mockRelatedSearches;
}

export function getMockPriceRanges(): PriceRange[] {
  return mockPriceRanges;
}

export function getMockFilterCategories() {
  return mockFilterCategories;
}

export function getMockSearchResultsCount(): number {
  return mockSearchProducts.length;
}
