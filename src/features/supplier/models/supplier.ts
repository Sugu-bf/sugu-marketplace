import { z } from "zod";

// ─── Supplier Sector (inside the supplier) ───────────────
export const SupplierSectorSchema = z.object({
  name: z.string(),
  icon: z.string().optional(), // Lucide icon name
});

// ─── Supplier List Item (for /fournisseurs listing page) ──
export const SupplierListItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string(),
  name: z.string(),
  logoUrl: z.string().optional(),
  logoInitials: z.string(),          // "KN" pour Karité du Niger
  logoColor: z.string(),             // "#A855F7"
  location: z.string(),              // "Niamey, Niger"
  country: z.string(),               // "Niger"
  countryFlag: z.string(),           // "🇳🇪"
  memberSince: z.string(),           // "Mars 2023"
  tagline: z.string(),               // "Beurre de karité 100% bio"
  rating: z.number(),                // 4.8
  reviewCount: z.number(),           // 156
  totalProducts: z.number(),         // 234
  totalSales: z.number(),            // 12400
  isFeatured: z.boolean().default(false),
  sectors: z.array(SupplierSectorSchema),
});

// ─── Derived types ──────────────────────────────────────
export type SupplierSector = z.infer<typeof SupplierSectorSchema>;
export type SupplierListItem = z.infer<typeof SupplierListItemSchema>;
