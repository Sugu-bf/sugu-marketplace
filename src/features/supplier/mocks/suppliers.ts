import type { SupplierListItem } from "../models/supplier";

// ─── Mock data for /fournisseurs listing ─────────────────
// icon values are Lucide icon names (resolved by getSectorIcon utility)

export const mockSuppliersList: SupplierListItem[] = [
  {
    id: "sup-1",
    slug: "karite-du-niger",
    name: "Karité du Niger",
    logoInitials: "KN",
    logoColor: "#A855F7",
    location: "Niamey, Niger",
    country: "Niger",
    countryFlag: "🇳🇪",
    memberSince: "Mars 2023",
    tagline: "Beurre de karité 100% bio",
    rating: 4.8,
    reviewCount: 156,
    totalProducts: 234,
    totalSales: 12400,
    isFeatured: true,
    sectors: [
      { name: "Cosmétique", icon: "SprayCan" },
      { name: "Bio", icon: "Leaf" },
    ],
  },
  {
    id: "sup-2",
    slug: "savons-du-faso",
    name: "Savons du Faso",
    logoInitials: "SF",
    logoColor: "#22C55E",
    location: "Bobo-Dioulasso, Burkina Faso",
    country: "Burkina Faso",
    countryFlag: "🇧🇫",
    memberSince: "Janvier 2023",
    tagline: "Savons artisanaux naturels",
    rating: 4.7,
    reviewCount: 203,
    totalProducts: 178,
    totalSales: 9800,
    isFeatured: true,
    sectors: [
      { name: "Hygiène", icon: "Bath" },
      { name: "Cosmétique", icon: "SprayCan" },
    ],
  },
  {
    id: "sup-3",
    slug: "mali-grains-sa",
    name: "Mali Grains SA",
    logoInitials: "MG",
    logoColor: "#F59E0B",
    location: "Bamako, Mali",
    country: "Mali",
    countryFlag: "🇲🇱",
    memberSince: "Juin 2022",
    tagline: "Céréales et grains du Sahel",
    rating: 4.6,
    reviewCount: 312,
    totalProducts: 89,
    totalSales: 25600,
    isFeatured: true,
    sectors: [
      { name: "Alimentaire", icon: "UtensilsCrossed" },
      { name: "Bio", icon: "Leaf" },
    ],
  },
  {
    id: "sup-4",
    slug: "textile-abidjan",
    name: "Textile d'Abidjan",
    logoInitials: "TA",
    logoColor: "#EC4899",
    location: "Abidjan, Côte d'Ivoire",
    country: "Côte d'Ivoire",
    countryFlag: "🇨🇮",
    memberSince: "Septembre 2023",
    tagline: "Wax et tissus africains authentiques",
    rating: 4.9,
    reviewCount: 187,
    totalProducts: 456,
    totalSales: 15200,
    isFeatured: true,
    sectors: [
      { name: "Textile", icon: "Shirt" },
      { name: "Maison", icon: "Home" },
    ],
  },
  {
    id: "sup-5",
    slug: "accra-electronics",
    name: "Accra Electronics",
    logoInitials: "AE",
    logoColor: "#3B82F6",
    location: "Accra, Ghana",
    country: "Ghana",
    countryFlag: "🇬🇭",
    memberSince: "Février 2023",
    tagline: "Composants et matériel informatique",
    rating: 4.5,
    reviewCount: 98,
    totalProducts: 567,
    totalSales: 8900,
    isFeatured: false,
    sectors: [
      { name: "Électronique", icon: "Monitor" },
      { name: "Industriel", icon: "Factory" },
    ],
  },
  {
    id: "sup-6",
    slug: "dakar-pharma",
    name: "Dakar Pharma",
    logoInitials: "DP",
    logoColor: "#14B8A6",
    location: "Dakar, Sénégal",
    country: "Sénégal",
    countryFlag: "🇸🇳",
    memberSince: "Avril 2023",
    tagline: "Produits pharmaceutiques et parapharmaceutiques",
    rating: 4.8,
    reviewCount: 267,
    totalProducts: 312,
    totalSales: 18700,
    isFeatured: false,
    sectors: [
      { name: "Santé", icon: "Cross" },
      { name: "Hygiène", icon: "Bath" },
    ],
  },
  {
    id: "sup-7",
    slug: "ouaga-papeterie",
    name: "Ouaga Papeterie",
    logoInitials: "OP",
    logoColor: "#F97316",
    location: "Ouagadougou, Burkina Faso",
    country: "Burkina Faso",
    countryFlag: "🇧🇫",
    memberSince: "Août 2023",
    tagline: "Fournitures scolaires et de bureau",
    rating: 4.4,
    reviewCount: 87,
    totalProducts: 423,
    totalSales: 6500,
    isFeatured: false,
    sectors: [
      { name: "Papeterie", icon: "BookOpen" },
      { name: "Maison", icon: "Home" },
    ],
  },
  {
    id: "sup-8",
    slug: "agro-sahel",
    name: "Agro Sahel Industries",
    logoInitials: "AS",
    logoColor: "#22C55E",
    location: "Koudougou, Burkina Faso",
    country: "Burkina Faso",
    countryFlag: "🇧🇫",
    memberSince: "Mai 2022",
    tagline: "Transformation agroalimentaire certifiée",
    rating: 4.7,
    reviewCount: 145,
    totalProducts: 67,
    totalSales: 32100,
    isFeatured: false,
    sectors: [
      { name: "Alimentaire", icon: "UtensilsCrossed" },
      { name: "Industriel", icon: "Factory" },
    ],
  },
  {
    id: "sup-9",
    slug: "lome-cosmetiques",
    name: "Lomé Cosmétiques",
    logoInitials: "LC",
    logoColor: "#EC4899",
    location: "Lomé, Togo",
    country: "Togo",
    countryFlag: "🇹🇬",
    memberSince: "Novembre 2023",
    tagline: "Cosmétiques naturels à base de plantes",
    rating: 4.6,
    reviewCount: 76,
    totalProducts: 198,
    totalSales: 4300,
    isFeatured: false,
    sectors: [
      { name: "Cosmétique", icon: "SprayCan" },
      { name: "Santé", icon: "Cross" },
    ],
  },
  {
    id: "sup-10",
    slug: "cotonou-import",
    name: "Cotonou Import-Export",
    logoInitials: "CI",
    logoColor: "#6366F1",
    location: "Cotonou, Bénin",
    country: "Bénin",
    countryFlag: "🇧🇯",
    memberSince: "Juillet 2023",
    tagline: "Import et distribution de produits divers",
    rating: 4.3,
    reviewCount: 54,
    totalProducts: 789,
    totalSales: 11200,
    isFeatured: false,
    sectors: [
      { name: "Maison", icon: "Home" },
      { name: "Électronique", icon: "Monitor" },
    ],
  },
  {
    id: "sup-11",
    slug: "conakry-metal",
    name: "Conakry Métal SA",
    logoInitials: "CM",
    logoColor: "#EF4444",
    location: "Conakry, Guinée",
    country: "Guinée",
    countryFlag: "🇬🇳",
    memberSince: "Octobre 2022",
    tagline: "Matériaux de construction et quincaillerie",
    rating: 4.2,
    reviewCount: 43,
    totalProducts: 345,
    totalSales: 7600,
    isFeatured: false,
    sectors: [
      { name: "Industriel", icon: "Factory" },
      { name: "Maison", icon: "Home" },
    ],
  },
  {
    id: "sup-12",
    slug: "douala-textiles",
    name: "Douala Textiles",
    logoInitials: "DT",
    logoColor: "#A855F7",
    location: "Douala, Cameroun",
    country: "Cameroun",
    countryFlag: "🇨🇲",
    memberSince: "Décembre 2023",
    tagline: "Tissus et pagnes haut de gamme",
    rating: 4.5,
    reviewCount: 112,
    totalProducts: 278,
    totalSales: 5400,
    isFeatured: false,
    sectors: [
      { name: "Textile", icon: "Shirt" },
      { name: "Cosmétique", icon: "SprayCan" },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────

export function getMockAllSuppliers(
  sector?: string,
  search?: string,
  page = 1,
  perPage = 12,
): { suppliers: SupplierListItem[]; total: number; totalPages: number } {
  let filtered = [...mockSuppliersList];

  if (sector && sector !== "all") {
    filtered = filtered.filter((s) =>
      s.sectors.some(
        (sec) => sec.name.toLowerCase() === sector.toLowerCase(),
      ),
    );
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q),
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  return { suppliers: filtered.slice(start, start + perPage), total, totalPages };
}

export function getMockFeaturedSuppliers(): SupplierListItem[] {
  return mockSuppliersList.filter((s) => s.isFeatured);
}
