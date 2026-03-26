import { z } from "zod";

// ─── Backend Response Schemas ────────────────────────────
// Mirror of VendorsListService::formatVendorCard() response.
// Same endpoint as stores — MVP reuses vendor listing.

export const SupplierVendorImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
});

export const SupplierVendorRatingSchema = z.object({
  avg: z.number(),
  count: z.number(),
});

export const SupplierVendorContactSchema = z.object({
  address_line: z.string(),
  zip: z.string(),
  email: z.string(),
  phone: z.string(),
});

export const SupplierVendorStatsSchema = z.object({
  total_products: z.number(),
  total_sales: z.number(),
});

export const SupplierVendorCardSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  cover_image: SupplierVendorImageSchema,
  logo: SupplierVendorImageSchema,
  rating: SupplierVendorRatingSchema,
  contact: SupplierVendorContactSchema,
  stats: SupplierVendorStatsSchema,
  member_since: z.string().nullable(),
  is_followed: z.boolean(),
});

export const SupplierFacetSchema = z.object({
  min: z.number(),
  label: z.string(),
  count: z.number(),
});

export const SuppliersResponseSchema = z.object({
  success: z.boolean(),
  items: z.array(SupplierVendorCardSchema),
  facets: z.object({
    rating: z.array(SupplierFacetSchema),
  }),
  meta: z.object({
    limit: z.number(),
    next_cursor: z.string().nullable(),
    has_more: z.boolean(),
  }),
});

// ─── Type Exports ────────────────────────────────────────
export type SupplierVendorCard = z.infer<typeof SupplierVendorCardSchema>;
export type SupplierFacet = z.infer<typeof SupplierFacetSchema>;
export type SuppliersResponse = z.infer<typeof SuppliersResponseSchema>;
