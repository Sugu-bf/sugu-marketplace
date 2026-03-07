/**
 * Home API — fetches homepage data from the backend.
 *
 * Endpoints consumed:
 * - GET /api/v1/home/brands?limit=12          → Brand logos
 * - GET /api/v1/home/recommended?limit=12     → Recommended products
 * - GET /api/v1/home/hot-deals?limit=10       → Hot deals
 * - GET /api/v1/banners?slot=hero             → Hero banners
 * - GET /api/v1/banners/slots/{key}           → Banner by slot
 */

import { z } from "zod";
import { api, v1Url, CacheTags, RevalidatePresets } from "@/lib/api";

// ─── Zod Schemas ─────────────────────────────────────────────

const BrandLogoSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
});

const ApiBrandSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  logo: BrandLogoSchema.nullable().optional(),
  position: z.number().optional(),
});

const BrandsResponseSchema = z.object({
  items: z.array(ApiBrandSchema),
  meta: z.object({
    limit: z.number(),
    count: z.number(),
  }),
});

const ApiBannerSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  image: z.object({
    url: z.string(),
    alt: z.string().optional(),
  }).nullable().optional(),
  link: z.string().nullable().optional(),
  position: z.number().optional(),
});

const BannersSlotResponseSchema = z.object({
  slot: z.string(),
  banners: z.array(ApiBannerSchema),
  meta: z.object({
    count: z.number(),
  }).optional(),
});

// ─── Types ───────────────────────────────────────────────────

export type ApiBrand = z.infer<typeof ApiBrandSchema>;
export type ApiBanner = z.infer<typeof ApiBannerSchema>;

// ─── API Functions ───────────────────────────────────────────

/**
 * Fetch home page brands (shop by brand section).
 */
export async function fetchHomeBrands(limit = 12): Promise<ApiBrand[]> {
  try {
    const { data } = await api.get(v1Url("home/brands", { limit }), {
      schema: BrandsResponseSchema,
      revalidate: RevalidatePresets.standard,
      tags: [CacheTags.brands(), CacheTags.homeSections()],
      skipCredentials: true,
    });
    return data.items;
  } catch (error) {
    console.error("[Home] Failed to fetch brands:", (error as Error).message);
    return [];
  }
}

/**
 * Fetch banners for a specific slot (e.g. "hero", "sidebar").
 */
export async function fetchBannersBySlot(slotKey: string): Promise<ApiBanner[]> {
  try {
    const { data } = await api.get(
      v1Url(`banners/slots/${encodeURIComponent(slotKey)}`),
      {
        schema: BannersSlotResponseSchema,
        revalidate: RevalidatePresets.frequent,
        tags: [CacheTags.homeBanners()],
        skipCredentials: true,
      }
    );
    return data.banners;
  } catch (error) {
    console.error(`[Home] Failed to fetch banners for slot "${slotKey}":`, (error as Error).message);
    return [];
  }
}

/**
 * Fetch all banners (generic listing).
 */
export async function fetchBanners(): Promise<ApiBanner[]> {
  try {
    const { data } = await api.get<{ data: ApiBanner[] }>(v1Url("banners"), {
      revalidate: RevalidatePresets.frequent,
      tags: [CacheTags.homeBanners()],
      skipCredentials: true,
    });
    return data.data ?? [];
  } catch (error) {
    console.error("[Home] Failed to fetch banners:", (error as Error).message);
    return [];
  }
}
