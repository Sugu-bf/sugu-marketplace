import type {
  BannerSlide,
  HeroBanner,
  CategoryPill,
  FreshCategory,
  PromotionalDeal,
  Brand,
  TrustBadge,
  DailyDealCard,
  DailyBestSaleProduct,
  WeeklyDeal,
  ProductColumnItem,
  Tag,
} from "../models/home";

// ─── Hero Banner Slides ─────────────────────────────────────

export const mockBannerSlides: BannerSlide[] = [
  { id: 1, image: "/banners/fathers-day.png", alt: "Fête des pères — Jusqu'à 50% de réduction" },
  { id: 2, image: "/banners/shopping-festival.png", alt: "Festival Shopping — Promotions exclusives" },
  { id: 3, image: "/banners/summer-drinks.png", alt: "Boissons rafraîchissantes d'été" },
];

export const mockHeroBanner: HeroBanner = {
  image: "/banners/mothers-day.png",
  alt: "Fête des mères — Remplissez la fête d'amour et de douceur",
};

// ─── Category Pills ─────────────────────────────────────────

export const mockCategoryPills: CategoryPill[] = [
  { name: "Pain", icon: "wheat", slug: "pain" },
  { name: "Fromage", icon: "cheese", slug: "fromage" },
  { name: "Boissons", icon: "wine", slug: "boissons" },
  { name: "Yaourt", icon: "cup-soda", slug: "yaourt" },
  { name: "Fruits", icon: "apple", slug: "fruits" },
  { name: "Pastèque", icon: "citrus", slug: "pasteque" },
  { name: "Snacks", icon: "popcorn", slug: "snacks" },
  { name: "Gâteau", icon: "cake-slice", slug: "gateau" },
  { name: "Bonbons", icon: "candy", slug: "bonbons" },
  { name: "Légumes", icon: "carrot", slug: "legumes" },
  { name: "Agrumes", icon: "citrus", slug: "agrumes" },
  { name: "Surgelés", icon: "snowflake", slug: "surgeles" },
  { name: "Viande", icon: "beef", slug: "viande" },
  { name: "Fruits de mer", icon: "fish", slug: "fruits-de-mer" },
  { name: "Boulangerie", icon: "croissant", slug: "boulangerie" },
  { name: "Jus", icon: "glass-water", slug: "jus" },
];

// ─── Fresh Categories ───────────────────────────────────────

export const mockFreshCategories: FreshCategory[] = [
  { id: 1, title: "Everyday Fresh", subtitle: "Viande", price: 6099, image: "/categories/meat.png", bgColor: "#E8EDF3" },
  { id: 2, title: "Daily Fresh", subtitle: "Légumes", price: 6099, image: "/categories/vegetables.png", bgColor: "#EAF0E4" },
  { id: 3, title: "Everyday Fresh", subtitle: "Lait", price: 100, image: "/categories/milk.png", bgColor: "#E3EEF0" },
  { id: 4, title: "Everyday Fresh", subtitle: "Fruits", price: 6099, image: "/categories/fruits.png", bgColor: "#F0EDE3" },
];

// ─── Promotional Deals ──────────────────────────────────────

export const mockPromotionalDeals: PromotionalDeal[] = [
  {
    id: 1,
    title: "X-Connect Smart Television",
    subtitle: "Temps restant jusqu'à la fin de l'offre.",
    image: "/promos/pasta.png",
    variant: "light",
    countdown: { days: 677, hours: 15, minutes: 32, seconds: 37 },
  },
  {
    id: 2,
    title: "Vegetables Combo Box",
    subtitle: "Temps restant jusqu'à la fin de l'offre.",
    image: "/promos/vegetables.png",
    variant: "dark",
    countdown: { days: 616, hours: 15, minutes: 32, seconds: 37 },
  },
];

// ─── Tags (Trending Stores) ─────────────────────────────────

export const mockTrendingTags: Tag[] = [
  { label: "Boulangerie fraîche", slug: "boulangerie-fraiche" },
  { label: "Bio", slug: "bio" },
  { label: "Fruits frais", slug: "fruits-frais" },
  { label: "Produits laitiers", slug: "produits-laitiers" },
  { label: "Viande & Poisson", slug: "viande-poisson" },
  { label: "Boissons", slug: "boissons" },
  { label: "Snacks", slug: "snacks" },
  { label: "Épicerie fine", slug: "epicerie-fine" },
  { label: "Surgelés", slug: "surgeles" },
  { label: "Bébé & Enfant", slug: "bebe-enfant" },
];

// ─── Daily Deal Card (sidebar orange) ───────────────────────

export const mockDailyDealCard: DailyDealCard = {
  category: "Équipement médical",
  title: "Deals of the day",
  subtitle: "Save up to 50% off on your first order",
  expiry: "Offre expirée — actualisation...",
  image: "/promos/grocery-basket.png",
};

// ─── Brands ─────────────────────────────────────────────────

export const mockBrands: Brand[] = [
  { id: 1, name: "Organic Fresh", image: "/brands/brand1.png" },
  { id: 2, name: "Passion Healthy", image: "/brands/brand2.png" },
  { id: 3, name: "Organic Quality", image: "/brands/brand3.png" },
  { id: 4, name: "Best Organic", image: "/brands/brand4.png" },
  { id: 5, name: "The Organic Shop", image: "/brands/brand3.png" },
  { id: 6, name: "Fresh Organic", image: "/brands/brand1.png" },
  { id: 7, name: "Passion Foods", image: "/brands/brand2.png" },
  { id: 8, name: "Top Organic", image: "/brands/brand4.png" },
  { id: 9, name: "Nature Pure", image: "/brands/brand3.png" },
  { id: 10, name: "Green Valley", image: "/brands/brand1.png" },
  { id: 11, name: "Vital Life", image: "/brands/brand2.png" },
  { id: 12, name: "Earth Harvest", image: "/brands/brand4.png" },
];

// ─── Daily Best Sales ───────────────────────────────────────

export const mockDailyBestSaleProducts: DailyBestSaleProduct[] = [
  { id: 1, name: "iPhone 12 — Reconditionné Grade A", price: 993.51, originalPrice: 1197, rating: 0.0, reviews: 0, store: "TopVendor Store", soldCount: 8, totalStock: 20, promoPercent: 17 },
  { id: 2, name: "Chargeur USB-C 25W", price: 49.57, originalPrice: 97.2, rating: 0.0, reviews: 0, store: "TopVendor Store", soldCount: 14, totalStock: 24, promoPercent: 49 },
  { id: 3, name: "T-Shirt SUGU Unisexe", price: 29.83, originalPrice: 55.25, rating: 0.0, reviews: 0, store: "TopVendor Store", soldCount: 28, totalStock: 42, promoPercent: 46 },
  { id: 4, name: "Manette Ps4", price: 125000, originalPrice: 125000, rating: 0.0, reviews: 0, store: "TopVendor Store", soldCount: 1, totalStock: 20 },
  { id: 5, name: "Écouteurs Bluetooth Pro", price: 45.0, originalPrice: 89.0, rating: 0.0, reviews: 0, store: "TopVendor Store", soldCount: 5, totalStock: 15, promoPercent: 49 },
  { id: 6, name: "Coque iPhone 14 Silicone", price: 12.5, originalPrice: 25.0, rating: 0.0, reviews: 0, store: "TopVendor Store", soldCount: 33, totalStock: 50, promoPercent: 50 },
];

// ─── Product Columns (TrendingStoresSecond) ─────────────────

export const mockProduitsVedettes: ProductColumnItem[] = [
  { id: 1, name: "Manette Ps4", price: 125000, rating: 4.8, reviews: 0 },
  { id: 2, name: "iPhone 13 — Reconditionné…", price: 1117, originalPrice: 1595, rating: 4.8, reviews: 0 },
  { id: 3, name: "Dell XPS 13 — Reconditionné…", price: 1778, originalPrice: 2142, rating: 4.8, reviews: 0 },
  { id: 4, name: "Samsung Galaxy S21 —…", price: 961, originalPrice: 1131, rating: 4.8, reviews: 0 },
  { id: 5, name: "Sony WH-1000XM4 — Casqu…", price: 595, originalPrice: 888, rating: 4.8, reviews: 0 },
  { id: 6, name: "iPhone 13 — Reconditionné…", price: 1117, originalPrice: 1595, rating: 4.8, reviews: 0 },
];

export const mockMeilleuresVentes: ProductColumnItem[] = [
  { id: 7, name: "iPhone 13 — Reconditionné…", price: 1117, originalPrice: 1595, rating: 4.8, reviews: 0 },
  { id: 8, name: "Dell XPS 13 — Reconditionné…", price: 1778, originalPrice: 2142, rating: 4.8, reviews: 0 },
  { id: 9, name: "Samsung Galaxy S21 —…", price: 961, originalPrice: 1131, rating: 4.8, reviews: 0 },
  { id: 10, name: "Sony WH-1000XM4 — Casqu…", price: 595, originalPrice: 888, rating: 4.8, reviews: 0 },
  { id: 11, name: "iPhone 13 — Reconditionné…", price: 1117, originalPrice: 1595, rating: 4.8, reviews: 0 },
  { id: 12, name: "Dell XPS 13 — Reconditionné…", price: 1778, originalPrice: 2142, rating: 4.8, reviews: 0 },
];

export const mockEnPromotion: ProductColumnItem[] = [
  { id: 13, name: "iPhone 13 — Reconditionné…", price: 1117, originalPrice: 1595, rating: 4.8, reviews: 0 },
  { id: 14, name: "Dell XPS 13 — Reconditionné…", price: 1778, originalPrice: 2142, rating: 4.8, reviews: 0 },
  { id: 15, name: "Samsung Galaxy S21 —…", price: 961, originalPrice: 1131, rating: 4.8, reviews: 0 },
  { id: 16, name: "Sony WH-1000XM4 — Casqu…", price: 595, originalPrice: 888, rating: 4.8, reviews: 0 },
  { id: 17, name: "iPhone 13 — Reconditionné…", price: 1117, originalPrice: 1595, rating: 4.8, reviews: 0 },
  { id: 18, name: "Dell XPS 13 — Reconditionné…", price: 1778, originalPrice: 2142, rating: 4.8, reviews: 0 },
];

export const mockWeeklyDeal: WeeklyDeal = {
  id: 19,
  name: "Sony WH-1000XM4 — Casque Reconditionné A",
  price: 595,
  originalPrice: 888,
  rating: 5,
  reviews: 3,
};

// ─── Trust Badges ───────────────────────────────────────────

export const mockTrustBadges: TrustBadge[] = [
  { iconName: "truck", title: "Livraison Gratuite", subtitle: "Livraison gratuite partout" },
  { iconName: "award", title: "100% Satisfaction", subtitle: "Garantie de satisfaction totale" },
  { iconName: "shield-check", title: "Paiements Sécurisés", subtitle: "Transactions 100% sécurisées" },
  { iconName: "headphones", title: "Support 24/7", subtitle: "Support client disponible 24/7" },
];
