import type { Product, ProductListItem } from "../models/product";
import { CURRENCY } from "@/lib/constants";

// ─── Mock Products ───────────────────────────────────────────

const baseMockProducts: Product[] = [
  {
    id: 1,
    slug: "fraises-fraiches-bio",
    name: "Fraises Fraîches Bio",
    description:
      "Fraises cultivées localement, 100% bio et sans pesticides. Idéales pour vos desserts, smoothies et salades de fruits. Récoltées à maturité pour un goût optimal et une fraîcheur incomparable. Nos fraises sont sélectionnées avec soin auprès de producteurs locaux engagés dans une agriculture durable.",
    price: 2500,
    originalPrice: 3500,
    currency: CURRENCY.code,
    discount: 29,
    images: [
      { id: 1, url: "/products/strawberries.png", alt: "Fraises fraîches vue de face" },
      { id: 2, url: "/products/strawberries.png", alt: "Fraises fraîches vue de côté" },
      { id: 3, url: "/products/strawberries.png", alt: "Fraises fraîches en gros plan" },
      { id: 4, url: "/products/strawberries.png", alt: "Fraises fraîches dans un panier" },
      { id: 5, url: "/products/strawberries.png", alt: "Fraises fraîches emballées" },
    ],
    thumbnail: "/products/strawberries.png",
    categoryId: 1,
    categoryName: "Fruits & Légumes",
    vendorId: 1,
    vendorName: "Ferme du Soleil",
    vendorSlug: "ferme-du-soleil",
    rating: 4.5,
    reviewCount: 128,
    stock: 12,
    sold: 85,
    tags: ["bio", "frais", "fruits"],
    isFeatured: true,
    createdAt: "2026-01-15T10:00:00Z",
    promoPrice: 2500,
    promoEndsAt: "2026-03-10T23:59:59Z",
    bulkPrices: [
      { minQty: 1, maxQty: 4, unitPrice: 2500, label: "1-4 unités" },
      { minQty: 5, maxQty: 9, unitPrice: 2200, label: "5-9 unités" },
      { minQty: 10, maxQty: 24, unitPrice: 1900, label: "10-24 unités" },
      { minQty: 25, unitPrice: 1600, label: "25+ unités" },
    ],
    variants: [
      {
        id: 1,
        name: "Poids",
        options: [
          { id: 1, value: "250g", available: true, priceAdjustment: -1000 },
          { id: 2, value: "500g", available: true, priceAdjustment: 0 },
          { id: 3, value: "1kg", available: true, priceAdjustment: 2000 },
        ],
      },
      {
        id: 2,
        name: "Conditionnement",
        options: [
          { id: 4, value: "Barquette", available: true, priceAdjustment: 0 },
          { id: 5, value: "Sachet", available: true, priceAdjustment: -200 },
        ],
      },
    ],
    specifications: {
      Origine: "Burkina Faso",
      Certification: "Agriculture Biologique",
      "Poids net": "500g",
      Conservation: "Réfrigérateur (2-5°C)",
      "Durée de vie": "5-7 jours",
      Allergènes: "Aucun",
    },
  },
  {
    id: 2,
    slug: "oranges-navel-premium",
    name: "Oranges Navel Premium",
    description:
      "Oranges juteuses et sucrées, parfaites pour le jus frais du matin. Sélectionnées pour leur calibre et leur qualité supérieure.",
    price: 1800,
    originalPrice: 2500,
    currency: CURRENCY.code,
    discount: 28,
    images: [
      { id: 2, url: "/products/oranges.png", alt: "Oranges Navel" },
    ],
    thumbnail: "/products/oranges.png",
    categoryId: 1,
    categoryName: "Fruits & Légumes",
    vendorId: 2,
    vendorName: "Saveurs d'Afrique",
    vendorSlug: "saveurs-dafrique",
    rating: 4.8,
    reviewCount: 256,
    stock: 45,
    sold: 320,
    tags: ["agrumes", "jus", "vitamine C"],
    isFeatured: true,
    createdAt: "2026-01-10T08:00:00Z",
    specifications: {
      Origine: "Côte d'Ivoire",
      Calibre: "Gros",
      "Poids net": "1kg",
    },
  },
  {
    id: 3,
    slug: "citrons-verts-frais",
    name: "Citrons Verts Frais",
    description:
      "Citrons verts aromatiques pour relever tous vos plats et cocktails.",
    price: 1200,
    originalPrice: 1500,
    currency: CURRENCY.code,
    discount: 20,
    images: [
      { id: 3, url: "/products/limes.png", alt: "Citrons verts" },
    ],
    thumbnail: "/products/limes.png",
    categoryId: 1,
    categoryName: "Fruits & Légumes",
    vendorId: 1,
    vendorName: "Ferme du Soleil",
    vendorSlug: "ferme-du-soleil",
    rating: 4.2,
    reviewCount: 67,
    stock: 30,
    sold: 98,
    tags: ["agrumes", "cuisine"],
    isFeatured: false,
    createdAt: "2026-01-20T14:30:00Z",
  },
  {
    id: 4,
    slug: "raisins-rouges-sans-pepins",
    name: "Raisins Rouges sans Pépins",
    description:
      "Raisins rouges croquants et sucrés, sans pépins pour plus de plaisir.",
    price: 3200,
    originalPrice: 4000,
    currency: CURRENCY.code,
    discount: 20,
    images: [
      { id: 4, url: "/products/grapes.png", alt: "Raisins rouges" },
    ],
    thumbnail: "/products/grapes.png",
    categoryId: 1,
    categoryName: "Fruits & Légumes",
    vendorId: 3,
    vendorName: "Oasis Market",
    vendorSlug: "oasis-market",
    rating: 4.6,
    reviewCount: 189,
    stock: 8,
    sold: 156,
    tags: ["raisins", "snack"],
    isFeatured: true,
    createdAt: "2026-02-01T09:00:00Z",
    bulkPrices: [
      { minQty: 1, maxQty: 4, unitPrice: 3200, label: "1-4 unités" },
      { minQty: 5, maxQty: 9, unitPrice: 2900, label: "5-9 unités" },
      { minQty: 10, unitPrice: 2500, label: "10+ unités" },
    ],
  },
  {
    id: 5,
    slug: "pommes-golden",
    name: "Pommes Golden Delicious",
    description:
      "Pommes golden croquantes et sucrées, importées de première qualité.",
    price: 2800,
    originalPrice: 3500,
    currency: CURRENCY.code,
    discount: 20,
    images: [
      { id: 5, url: "/products/apple.png", alt: "Pommes golden" },
    ],
    thumbnail: "/products/apple.png",
    categoryId: 1,
    categoryName: "Fruits & Légumes",
    vendorId: 2,
    vendorName: "Saveurs d'Afrique",
    vendorSlug: "saveurs-dafrique",
    rating: 4.4,
    reviewCount: 94,
    stock: 22,
    sold: 210,
    tags: ["pommes", "fruits"],
    isFeatured: false,
    createdAt: "2026-02-05T11:00:00Z",
  },
  {
    id: 6,
    slug: "lot-fruits-mixtes",
    name: "Lot de Fruits Mixtes",
    description:
      "Assortiment de fruits frais de saison pour toute la famille.",
    price: 4500,
    originalPrice: 6000,
    currency: CURRENCY.code,
    discount: 25,
    images: [
      { id: 6, url: "/products/strawberries.png", alt: "Fruits mixtes" },
    ],
    thumbnail: "/products/strawberries.png",
    categoryId: 1,
    categoryName: "Fruits & Légumes",
    vendorId: 3,
    vendorName: "Oasis Market",
    vendorSlug: "oasis-market",
    rating: 4.7,
    reviewCount: 312,
    stock: 15,
    sold: 420,
    tags: ["assortiment", "famille", "promo"],
    isFeatured: true,
    createdAt: "2026-02-10T16:00:00Z",
    promoPrice: 4500,
    promoEndsAt: "2026-03-15T23:59:59Z",
    variants: [
      {
        id: 3,
        name: "Taille",
        options: [
          { id: 6, value: "Petit (3 fruits)", available: true, priceAdjustment: -2000 },
          { id: 7, value: "Standard (5 fruits)", available: true, priceAdjustment: 0 },
          { id: 8, value: "Familial (8 fruits)", available: true, priceAdjustment: 3000 },
        ],
      },
    ],
  },
];

/**
 * Returns a list of mock products for design-only rendering.
 */
export function getMockProducts(count?: number): ProductListItem[] {
  const items: ProductListItem[] = baseMockProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    discount: p.discount,
    thumbnail: p.thumbnail,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stock: p.stock,
    sold: p.sold,
    vendorName: p.vendorName,
    categoryName: p.categoryName,
  }));

  return count ? items.slice(0, count) : items;
}

/**
 * Returns a single mock product by slug.
 */
export function getMockProductBySlug(slug: string): Product | undefined {
  return baseMockProducts.find((p) => p.slug === slug);
}

/**
 * Returns a single mock product by id.
 */
export function getMockProductById(id: number): Product | undefined {
  return baseMockProducts.find((p) => p.id === id);
}

export { baseMockProducts };
