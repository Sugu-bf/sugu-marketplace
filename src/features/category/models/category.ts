import { z } from "zod";

// ─── Category Schemas ─────────────────────────────────────────

export const CategorySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  image: z.string(),
  bannerImage: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.number().nullable().default(null),
  productCount: z.number().nonnegative(),
  children: z.array(z.lazy((): z.ZodTypeAny => CategorySchema)).optional(),
});

export const SubcategorySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  image: z.string(),
  productCount: z.number().nonnegative(),
  parentSlug: z.string(),
});

export const CategoryPageDataSchema = z.object({
  category: CategorySchema,
  subcategories: z.array(SubcategorySchema),
  totalProducts: z.number().nonnegative(),
});

// ─── Derived Types ───────────────────────────────────────────

export type Category = z.infer<typeof CategorySchema>;
export type Subcategory = z.infer<typeof SubcategorySchema>;
export type CategoryPageData = z.infer<typeof CategoryPageDataSchema>;
