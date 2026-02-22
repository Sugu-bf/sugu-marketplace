import type { Category, Subcategory } from "../models/category";
import type { ProductListItem } from "@/features/product";

// ─── Mock Categories ─────────────────────────────────────────

export const mockCategories: Category[] = [
  {
    id: 1,
    slug: "fruits-legumes",
    name: "Fruits & Légumes",
    description:
      "Découvrez notre sélection de fruits et légumes frais, bio et de saison. Livraison rapide pour une fraîcheur garantie.",
    image: "/categories/fruits.png",
    bannerImage: "/categories/fruits.png",
    productCount: 245,
    parentId: null,
  },
  {
    id: 2,
    slug: "viande-poisson",
    name: "Viande & Poisson",
    description:
      "Viandes de qualité supérieure et poissons frais du jour. Sélectionnés auprès des meilleurs fournisseurs.",
    image: "/categories/meat.png",
    bannerImage: "/categories/meat.png",
    productCount: 180,
    parentId: null,
  },
  {
    id: 3,
    slug: "produits-laitiers",
    name: "Produits Laitiers",
    description:
      "Lait, fromage, yaourt et crème fraîche. Des produits laitiers frais pour toute la famille.",
    image: "/categories/milk.png",
    bannerImage: "/categories/milk.png",
    productCount: 132,
    parentId: null,
  },
  {
    id: 4,
    slug: "legumes-frais",
    name: "Légumes Frais",
    description:
      "Légumes fraîchement récoltés. Tomates, carottes, oignons, poivrons et bien plus encore.",
    image: "/categories/vegetables.png",
    bannerImage: "/categories/vegetables.png",
    productCount: 98,
    parentId: null,
  },
  {
    id: 5,
    slug: "electronique",
    name: "Électronique",
    description:
      "Les dernières nouveautés high-tech : smartphones, tablettes, accessoires et plus encore.",
    image: "/categories/fruits.png",
    bannerImage: "/categories/fruits.png",
    productCount: 567,
    parentId: null,
  },
  {
    id: 6,
    slug: "vetements",
    name: "Vêtements",
    description:
      "Mode homme, femme et enfant. Les dernières tendances à prix imbattables.",
    image: "/categories/vegetables.png",
    bannerImage: "/categories/vegetables.png",
    productCount: 890,
    parentId: null,
  },
  {
    id: 7,
    slug: "maison-jardin",
    name: "Maison & Jardin",
    description:
      "Équipez votre maison et votre jardin avec nos produits de qualité.",
    image: "/categories/milk.png",
    bannerImage: "/categories/milk.png",
    productCount: 456,
    parentId: null,
  },
  {
    id: 8,
    slug: "beaute-sante",
    name: "Beauté & Santé",
    description:
      "Soins de la peau, maquillage, parfums et produits de bien-être.",
    image: "/categories/meat.png",
    bannerImage: "/categories/meat.png",
    productCount: 324,
    parentId: null,
  },
];

// ─── Mock Subcategories ──────────────────────────────────────

export const mockSubcategories: Record<string, Subcategory[]> = {
  "fruits-legumes": [
    { id: 101, slug: "fruits-frais", name: "Fruits Frais", image: "/categories/fruits.png", productCount: 89, parentSlug: "fruits-legumes" },
    { id: 102, slug: "legumes-racines", name: "Légumes Racines", image: "/categories/vegetables.png", productCount: 42, parentSlug: "fruits-legumes" },
    { id: 103, slug: "fruits-exotiques", name: "Fruits Exotiques", image: "/categories/fruits.png", productCount: 35, parentSlug: "fruits-legumes" },
    { id: 104, slug: "salades-herbes", name: "Salades & Herbes", image: "/categories/vegetables.png", productCount: 28, parentSlug: "fruits-legumes" },
    { id: 105, slug: "fruits-secs", name: "Fruits Secs", image: "/categories/fruits.png", productCount: 51, parentSlug: "fruits-legumes" },
  ],
  "viande-poisson": [
    { id: 201, slug: "boeuf", name: "Bœuf", image: "/categories/meat.png", productCount: 45, parentSlug: "viande-poisson" },
    { id: 202, slug: "poulet", name: "Poulet", image: "/categories/meat.png", productCount: 38, parentSlug: "viande-poisson" },
    { id: 203, slug: "poisson-frais", name: "Poisson Frais", image: "/categories/meat.png", productCount: 52, parentSlug: "viande-poisson" },
    { id: 204, slug: "fruits-de-mer", name: "Fruits de Mer", image: "/categories/meat.png", productCount: 25, parentSlug: "viande-poisson" },
  ],
  "produits-laitiers": [
    { id: 301, slug: "lait", name: "Lait", image: "/categories/milk.png", productCount: 35, parentSlug: "produits-laitiers" },
    { id: 302, slug: "fromage", name: "Fromage", image: "/categories/milk.png", productCount: 42, parentSlug: "produits-laitiers" },
    { id: 303, slug: "yaourt", name: "Yaourt", image: "/categories/milk.png", productCount: 28, parentSlug: "produits-laitiers" },
    { id: 304, slug: "beurre-creme", name: "Beurre & Crème", image: "/categories/milk.png", productCount: 27, parentSlug: "produits-laitiers" },
  ],
  "electronique": [
    { id: 501, slug: "smartphones", name: "Smartphones", image: "/categories/fruits.png", productCount: 120, parentSlug: "electronique" },
    { id: 502, slug: "ordinateurs", name: "Ordinateurs", image: "/categories/fruits.png", productCount: 95, parentSlug: "electronique" },
    { id: 503, slug: "accessoires", name: "Accessoires", image: "/categories/fruits.png", productCount: 180, parentSlug: "electronique" },
    { id: 504, slug: "audio", name: "Audio", image: "/categories/fruits.png", productCount: 72, parentSlug: "electronique" },
    { id: 505, slug: "tv-ecrans", name: "TV & Écrans", image: "/categories/fruits.png", productCount: 100, parentSlug: "electronique" },
  ],
};

// ─── Mock Category Products ─────────────────────────────────

const mockCategoryProducts: Record<string, ProductListItem[]> = {
  "fruits-legumes": [
    { id: 1, slug: "fraises-fraiches-bio", name: "Fraises Fraîches Bio", price: 2500, originalPrice: 3500, discount: 29, thumbnail: "/products/strawberries.png", rating: 4.5, reviewCount: 128, stock: 12, sold: 85, vendorName: "Ferme du Soleil", categoryName: "Fruits & Légumes" },
    { id: 2, slug: "oranges-navel-premium", name: "Oranges Navel Premium", price: 1800, originalPrice: 2500, discount: 28, thumbnail: "/products/oranges.png", rating: 4.8, reviewCount: 256, stock: 45, sold: 320, vendorName: "Saveurs d'Afrique", categoryName: "Fruits & Légumes" },
    { id: 3, slug: "citrons-verts-frais", name: "Citrons Verts Frais", price: 1200, originalPrice: 1500, discount: 20, thumbnail: "/products/limes.png", rating: 4.2, reviewCount: 67, stock: 30, sold: 98, vendorName: "Ferme du Soleil", categoryName: "Fruits & Légumes" },
    { id: 4, slug: "raisins-rouges-sans-pepins", name: "Raisins Rouges sans Pépins", price: 3200, originalPrice: 4000, discount: 20, thumbnail: "/products/grapes.png", rating: 4.6, reviewCount: 189, stock: 8, sold: 156, vendorName: "Oasis Market", categoryName: "Fruits & Légumes" },
    { id: 5, slug: "pommes-golden", name: "Pommes Golden Delicious", price: 2800, originalPrice: 3500, discount: 20, thumbnail: "/products/apple.png", rating: 4.4, reviewCount: 94, stock: 22, sold: 210, vendorName: "Saveurs d'Afrique", categoryName: "Fruits & Légumes" },
    { id: 6, slug: "lot-fruits-mixtes", name: "Lot de Fruits Mixtes", price: 4500, originalPrice: 6000, discount: 25, thumbnail: "/products/strawberries.png", rating: 4.7, reviewCount: 312, stock: 15, sold: 420, vendorName: "Oasis Market", categoryName: "Fruits & Légumes" },
    { id: 7, slug: "mangues-kent-premium", name: "Mangues Kent Premium", price: 3500, originalPrice: 4500, discount: 22, thumbnail: "/products/oranges.png", rating: 4.9, reviewCount: 412, stock: 18, sold: 580, vendorName: "Tropicana Afrique", categoryName: "Fruits & Légumes" },
    { id: 8, slug: "bananes-plantain-mures", name: "Bananes Plantain Mûres", price: 900, originalPrice: 1200, discount: 25, thumbnail: "/products/limes.png", rating: 4.3, reviewCount: 178, stock: 50, sold: 290, vendorName: "Ferme du Soleil", categoryName: "Fruits & Légumes" },
    { id: 9, slug: "papayes-solo-fraiches", name: "Papayes Solo Fraîches", price: 2200, originalPrice: 2800, discount: 21, thumbnail: "/products/grapes.png", rating: 4.1, reviewCount: 56, stock: 10, sold: 75, vendorName: "Bio Marché", categoryName: "Fruits & Légumes" },
    { id: 10, slug: "ananas-victoria", name: "Ananas Victoria", price: 1600, originalPrice: 2000, discount: 20, thumbnail: "/products/apple.png", rating: 4.6, reviewCount: 203, stock: 35, sold: 310, vendorName: "Tropicana Afrique", categoryName: "Fruits & Légumes" },
    { id: 11, slug: "tomates-cerises-grappe", name: "Tomates Cerises en Grappe", price: 1400, originalPrice: 1800, discount: 22, thumbnail: "/products/strawberries.png", rating: 4.4, reviewCount: 145, stock: 40, sold: 195, vendorName: "Bio Marché", categoryName: "Fruits & Légumes" },
    { id: 12, slug: "avocat-hass-bio", name: "Avocat Hass Bio", price: 2000, originalPrice: 2500, discount: 20, thumbnail: "/products/limes.png", rating: 4.7, reviewCount: 267, stock: 25, sold: 350, vendorName: "Bio Marché", categoryName: "Fruits & Légumes" },
    { id: 13, slug: "pastèque-sans-pepins", name: "Pastèque Sans Pépins", price: 3800, originalPrice: 4500, discount: 16, thumbnail: "/products/grapes.png", rating: 4.5, reviewCount: 98, stock: 7, sold: 120, vendorName: "Ferme du Soleil", categoryName: "Fruits & Légumes" },
    { id: 14, slug: "kiwis-bio-verts", name: "Kiwis Bio Verts", price: 2100, originalPrice: 2800, discount: 25, thumbnail: "/products/apple.png", rating: 4.3, reviewCount: 76, stock: 28, sold: 145, vendorName: "Bio Marché", categoryName: "Fruits & Légumes" },
    { id: 15, slug: "clémentines-corses", name: "Clémentines Corses", price: 1900, originalPrice: 2400, discount: 21, thumbnail: "/products/oranges.png", rating: 4.6, reviewCount: 187, stock: 32, sold: 260, vendorName: "Saveurs d'Afrique", categoryName: "Fruits & Légumes" },
    { id: 16, slug: "noix-de-coco-fraiche", name: "Noix de Coco Fraîche", price: 1500, originalPrice: 1800, discount: 17, thumbnail: "/products/limes.png", rating: 4.0, reviewCount: 45, stock: 20, sold: 88, vendorName: "Tropicana Afrique", categoryName: "Fruits & Légumes" },
  ],
  "viande-poisson": [
    { id: 20, slug: "filet-boeuf-premium", name: "Filet de Bœuf Premium", price: 8500, originalPrice: 10000, discount: 15, thumbnail: "/products/strawberries.png", rating: 4.8, reviewCount: 89, stock: 6, sold: 120, vendorName: "Boucherie Sahelienne", categoryName: "Viande & Poisson" },
    { id: 21, slug: "poulet-fermier-entier", name: "Poulet Fermier Entier", price: 4200, originalPrice: 5000, discount: 16, thumbnail: "/products/oranges.png", rating: 4.6, reviewCount: 234, stock: 15, sold: 380, vendorName: "Ferme du Soleil", categoryName: "Viande & Poisson" },
    { id: 22, slug: "tilapia-frais", name: "Tilapia Frais", price: 3000, originalPrice: 3800, discount: 21, thumbnail: "/products/limes.png", rating: 4.4, reviewCount: 156, stock: 20, sold: 245, vendorName: "Pêche Maritime", categoryName: "Viande & Poisson" },
    { id: 23, slug: "crevettes-roses", name: "Crevettes Roses", price: 6500, originalPrice: 8000, discount: 19, thumbnail: "/products/grapes.png", rating: 4.7, reviewCount: 78, stock: 10, sold: 90, vendorName: "Pêche Maritime", categoryName: "Viande & Poisson" },
    { id: 24, slug: "merguez-agneau", name: "Merguez d'Agneau", price: 3500, originalPrice: 4200, discount: 17, thumbnail: "/products/apple.png", rating: 4.3, reviewCount: 112, stock: 25, sold: 178, vendorName: "Boucherie Sahelienne", categoryName: "Viande & Poisson" },
    { id: 25, slug: "saumon-fume", name: "Saumon Fumé", price: 7200, originalPrice: 8500, discount: 15, thumbnail: "/products/strawberries.png", rating: 4.9, reviewCount: 198, stock: 8, sold: 310, vendorName: "Saveurs d'Afrique", categoryName: "Viande & Poisson" },
  ],
  "electronique": [
    { id: 40, slug: "ecouteurs-bluetooth-pro", name: "Écouteurs Bluetooth Pro", price: 15000, originalPrice: 20000, discount: 25, thumbnail: "/products/strawberries.png", rating: 4.5, reviewCount: 342, stock: 30, sold: 560, vendorName: "TechZone", categoryName: "Électronique" },
    { id: 41, slug: "chargeur-rapide-usbc", name: "Chargeur Rapide USB-C", price: 4500, originalPrice: 6000, discount: 25, thumbnail: "/products/oranges.png", rating: 4.3, reviewCount: 189, stock: 50, sold: 720, vendorName: "TechZone", categoryName: "Électronique" },
    { id: 42, slug: "coque-iphone-premium", name: "Coque iPhone Premium", price: 3500, originalPrice: 5000, discount: 30, thumbnail: "/products/limes.png", rating: 4.1, reviewCount: 567, stock: 100, sold: 1200, vendorName: "AccessPlus", categoryName: "Électronique" },
    { id: 43, slug: "batterie-externe-20000", name: "Batterie Externe 20000mAh", price: 12000, originalPrice: 15000, discount: 20, thumbnail: "/products/grapes.png", rating: 4.7, reviewCount: 243, stock: 18, sold: 385, vendorName: "TechZone", categoryName: "Électronique" },
    { id: 44, slug: "souris-gaming-rgb", name: "Souris Gaming RGB", price: 8000, originalPrice: 10000, discount: 20, thumbnail: "/products/apple.png", rating: 4.4, reviewCount: 156, stock: 22, sold: 290, vendorName: "GamerWorld", categoryName: "Électronique" },
    { id: 45, slug: "cable-hdmi-4k", name: "Câble HDMI 4K 2m", price: 2500, originalPrice: 3500, discount: 29, thumbnail: "/products/strawberries.png", rating: 4.2, reviewCount: 98, stock: 60, sold: 430, vendorName: "AccessPlus", categoryName: "Électronique" },
  ],
};

// Default fallback products for categories without specific mocks
const defaultProducts: ProductListItem[] = [
  { id: 90, slug: "produit-populaire-1", name: "Produit Populaire", price: 3500, originalPrice: 4500, discount: 22, thumbnail: "/products/strawberries.png", rating: 4.5, reviewCount: 128, stock: 20, sold: 180, vendorName: "Vendeur Top", categoryName: "Général" },
  { id: 91, slug: "produit-populaire-2", name: "Nouveauté Tendance", price: 2800, originalPrice: 3500, discount: 20, thumbnail: "/products/oranges.png", rating: 4.3, reviewCount: 89, stock: 15, sold: 120, vendorName: "Vendeur Top", categoryName: "Général" },
  { id: 92, slug: "produit-populaire-3", name: "Offre Spéciale", price: 1500, originalPrice: 2000, discount: 25, thumbnail: "/products/limes.png", rating: 4.6, reviewCount: 234, stock: 30, sold: 340, vendorName: "Saveurs d'Afrique", categoryName: "Général" },
  { id: 93, slug: "produit-populaire-4", name: "Meilleure Vente", price: 4200, originalPrice: 5500, discount: 24, thumbnail: "/products/grapes.png", rating: 4.8, reviewCount: 312, stock: 10, sold: 420, vendorName: "Oasis Market", categoryName: "Général" },
  { id: 94, slug: "produit-populaire-5", name: "Sélection Premium", price: 5500, originalPrice: 7000, discount: 21, thumbnail: "/products/apple.png", rating: 4.4, reviewCount: 167, stock: 12, sold: 256, vendorName: "Bio Marché", categoryName: "Général" },
  { id: 95, slug: "produit-populaire-6", name: "Choix Économique", price: 900, originalPrice: 1200, discount: 25, thumbnail: "/products/strawberries.png", rating: 4.1, reviewCount: 78, stock: 45, sold: 190, vendorName: "Ferme du Soleil", categoryName: "Général" },
];

// ─── Exported Functions ─────────────────────────────────────

export function getMockCategories(): Category[] {
  return mockCategories;
}

export function getMockCategoryBySlug(slug: string): Category | undefined {
  return mockCategories.find((c) => c.slug === slug);
}

export function getMockSubcategories(parentSlug: string): Subcategory[] {
  return mockSubcategories[parentSlug] ?? [];
}

export function getMockCategoryProducts(
  categorySlug: string,
  count?: number
): ProductListItem[] {
  const products = mockCategoryProducts[categorySlug] ?? defaultProducts;
  return count ? products.slice(0, count) : products;
}

export function getMockCategoryProductCount(categorySlug: string): number {
  const cat = mockCategories.find((c) => c.slug === categorySlug);
  return cat?.productCount ?? 0;
}
