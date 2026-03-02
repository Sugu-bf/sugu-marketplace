import { z } from "zod";

// ─── FAQ Category ────────────────────────────────────────────

export const FaqCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
});

// ─── FAQ Item ────────────────────────────────────────────────

export const FaqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(), // pre-sanitized HTML from backend
  category: FaqCategorySchema.nullable(),
  sort_order: z.number(),
});

// ─── FAQ API Response ────────────────────────────────────────

export const FaqApiResponseSchema = z.object({
  faqs: z.array(FaqItemSchema),
});

// ─── Derived Types ───────────────────────────────────────────

export type FaqCategory = z.infer<typeof FaqCategorySchema>;
export type FaqItem = z.infer<typeof FaqItemSchema>;
export type FaqApiResponse = z.infer<typeof FaqApiResponseSchema>;
