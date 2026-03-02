/**
 * Shared Zod Schemas — reusable across features.
 *
 * These define common response shapes from the Laravel backend.
 */

import { z } from "zod";

// ─── Pagination ──────────────────────────────────────────────

/** Standard Laravel pagination meta */
export const PaginationMetaSchema = z.object({
  current_page: z.number(),
  last_page: z.number(),
  per_page: z.number(),
  total: z.number(),
  from: z.number().nullable(),
  to: z.number().nullable(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/** Standard Laravel pagination links */
export const PaginationLinksSchema = z.object({
  first: z.string().nullable(),
  last: z.string().nullable(),
  prev: z.string().nullable(),
  next: z.string().nullable(),
});

export type PaginationLinks = z.infer<typeof PaginationLinksSchema>;

/** Create a paginated response schema for any item type */
export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
    links: PaginationLinksSchema,
  });
}

// ─── Common Response Wrappers ────────────────────────────────

/** Success response wrapper { success: true, data: T } */
export function successSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

/** Generic API response with message */
export const MessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type MessageResponse = z.infer<typeof MessageResponseSchema>;

// ─── Common Field Schemas ────────────────────────────────────

/** ISO date string */
export const DateStringSchema = z.string();

/** Media attachment schema (from Spatie MediaLibrary) */
export const MediaSchema = z.object({
  id: z.union([z.string(), z.number()]),
  url: z.string(),
  thumb_url: z.string().nullable().optional(),
  name: z.string(),
  mime_type: z.string(),
  size: z.number(),
});

export type Media = z.infer<typeof MediaSchema>;

/** Image with responsive variants */
export const ImageSchema = z.object({
  url: z.string(),
  thumb_url: z.string().nullable().optional(),
  alt: z.string().optional(),
});

export type ImageData = z.infer<typeof ImageSchema>;

/** Price in smallest unit (XOF has no decimals) */
export const PriceSchema = z.number();

/** Slug field */
export const SlugSchema = z.string().min(1);

/** ULID field */
export const UlidSchema = z.string().min(1);
