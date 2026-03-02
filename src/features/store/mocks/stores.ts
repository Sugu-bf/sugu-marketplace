import type { StoreListItem } from "../models/store";

// ─── Mock data for /stores listing ──────────────────────
// icon values are Lucide icon names (resolved by getCategoryIcon utility)

export const mockStoresList: StoreListItem[] = [
  {
    id: "1",
    slug: "amidoutelecom",
    name: "Amidou Telecom",
    logoInitials: "AT",
    logoColor: "#F15412",
    location: "Ouagadougou, Burkina Faso",
    memberSince: "Janvier 2024",
    rating: 4.6,
    reviewCount: 342,
    totalProducts: 1247,
    totalSales: 8540,
    isFeatured: true,
    categories: [
      { name: "Électronique", icon: "Monitor" },
      { name: "Accessoires", icon: "Headphones" },
    ],
  },
  {
    id: "2",
    slug: "fatima-fashion",
    name: "Fatima Fashion",
    logoInitials: "FF",
    logoColor: "#EC4899",
    location: "Bobo-Dioulasso, Burkina Faso",
    memberSince: "Mars 2024",
    rating: 4.8,
    reviewCount: 267,
    totalProducts: 856,
    totalSales: 5230,
    isFeatured: true,
    categories: [
      { name: "Mode", icon: "Shirt" },
      { name: "Sacs", icon: "ShoppingBag" },
    ],
  },
  {
    id: "3",
    slug: "sahel-bio-market",
    name: "Sahel Bio Market",
    logoInitials: "SB",
    logoColor: "#22C55E",
    location: "Ouagadougou, Burkina Faso",
    memberSince: "Juin 2024",
    rating: 4.7,
    reviewCount: 189,
    totalProducts: 432,
    totalSales: 3120,
    isFeatured: true,
    categories: [
      { name: "Alimentaire", icon: "UtensilsCrossed" },
      { name: "Bio", icon: "Leaf" },
    ],
  },
  {
    id: "4",
    slug: "techzone-bf",
    name: "TechZone BF",
    logoInitials: "TZ",
    logoColor: "#3B82F6",
    location: "Koudougou, Burkina Faso",
    memberSince: "Avril 2024",
    rating: 4.5,
    reviewCount: 156,
    totalProducts: 678,
    totalSales: 4210,
    isFeatured: true,
    categories: [
      { name: "Informatique", icon: "Laptop" },
      { name: "Bureautique", icon: "Printer" },
    ],
  },
  {
    id: "5",
    slug: "beaute-afrique",
    name: "Beauté d'Afrique",
    logoInitials: "BA",
    logoColor: "#A855F7",
    location: "Ouagadougou, Burkina Faso",
    memberSince: "Février 2024",
    rating: 4.9,
    reviewCount: 298,
    totalProducts: 312,
    totalSales: 6780,
    isFeatured: false,
    categories: [
      { name: "Cosmétique", icon: "SprayCan" },
      { name: "Soins", icon: "Sparkles" },
    ],
  },
  {
    id: "6",
    slug: "delices-du-faso",
    name: "Délices du Faso",
    logoInitials: "DF",
    logoColor: "#F97316",
    location: "Ouagadougou, Burkina Faso",
    memberSince: "Août 2024",
    rating: 4.7,
    reviewCount: 145,
    totalProducts: 278,
    totalSales: 2340,
    isFeatured: false,
    categories: [
      { name: "Miel", icon: "Cherry" },
      { name: "Karité", icon: "TreePine" },
    ],
  },
  {
    id: "7",
    slug: "sport-plus-bf",
    name: "Sport Plus BF",
    logoInitials: "SP",
    logoColor: "#EF4444",
    location: "Bobo-Dioulasso, Burkina Faso",
    memberSince: "Mai 2024",
    rating: 4.4,
    reviewCount: 87,
    totalProducts: 267,
    totalSales: 1890,
    isFeatured: false,
    categories: [
      { name: "Sport", icon: "Dumbbell" },
      { name: "Fitness", icon: "HeartPulse" },
    ],
  },
  {
    id: "8",
    slug: "librairie-sankore",
    name: "Librairie Sankoré",
    logoInitials: "LS",
    logoColor: "#F59E0B",
    location: "Ouagadougou, Burkina Faso",
    memberSince: "Janvier 2025",
    rating: 4.6,
    reviewCount: 112,
    totalProducts: 523,
    totalSales: 3450,
    isFeatured: false,
    categories: [
      { name: "Livres", icon: "BookOpen" },
      { name: "Fournitures", icon: "Pen" },
    ],
  },
  {
    id: "9",
    slug: "wax-et-style",
    name: "Wax & Style",
    logoInitials: "WS",
    logoColor: "#EC4899",
    location: "Bobo-Dioulasso, Burkina Faso",
    memberSince: "Juillet 2024",
    rating: 4.5,
    reviewCount: 76,
    totalProducts: 198,
    totalSales: 1230,
    isFeatured: false,
    categories: [
      { name: "Tissu Wax", icon: "Shirt" },
      { name: "Couture", icon: "Scissors" },
    ],
  },
  {
    id: "10",
    slug: "pharmasante",
    name: "PharmaSanté",
    logoInitials: "PS",
    logoColor: "#22C55E",
    location: "Ouagadougou, Burkina Faso",
    memberSince: "Septembre 2024",
    rating: 4.8,
    reviewCount: 234,
    totalProducts: 89,
    totalSales: 5670,
    isFeatured: false,
    categories: [
      { name: "Santé", icon: "Stethoscope" },
      { name: "Hygiène", icon: "SprayCan" },
    ],
  },
  {
    id: "11",
    slug: "meubles-sahel",
    name: "Meubles Sahel",
    logoInitials: "MS",
    logoColor: "#14B8A6",
    location: "Ouagadougou, Burkina Faso",
    memberSince: "Novembre 2024",
    rating: 4.3,
    reviewCount: 45,
    totalProducts: 189,
    totalSales: 890,
    isFeatured: false,
    categories: [
      { name: "Maison", icon: "Home" },
      { name: "Meubles", icon: "Armchair" },
    ],
  },
  {
    id: "12",
    slug: "mamadou-electronics",
    name: "Mamadou Electronics",
    logoInitials: "ME",
    logoColor: "#3B82F6",
    location: "Banfora, Burkina Faso",
    memberSince: "Décembre 2024",
    rating: 4.2,
    reviewCount: 34,
    totalProducts: 145,
    totalSales: 670,
    isFeatured: false,
    categories: [
      { name: "Téléphones", icon: "Smartphone" },
      { name: "Accessoires", icon: "Plug" },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────

export function getMockAllStores(
  category?: string,
  search?: string,
  page = 1,
  perPage = 12,
): { stores: StoreListItem[]; total: number; totalPages: number } {
  let filtered = [...mockStoresList];

  if (category && category !== "all") {
    filtered = filtered.filter((s) =>
      s.categories.some(
        (c) => c.name.toLowerCase() === category.toLowerCase(),
      ),
    );
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q),
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  return { stores: filtered.slice(start, start + perPage), total, totalPages };
}

export function getMockFeaturedStores(): StoreListItem[] {
  return mockStoresList.filter((s) => s.isFeatured);
}
