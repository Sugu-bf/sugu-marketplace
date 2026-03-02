// ─── FAQ Feature Module ──────────────────────────────────────
// Public API for the FAQ feature

export {
  FaqCategorySchema,
  FaqItemSchema,
  FaqApiResponseSchema,
} from "./models/faq";

export type {
  FaqCategory,
  FaqItem,
  FaqApiResponse,
} from "./models/faq";

export {
  queryFaqItems,
  groupFaqsByCategory,
} from "./queries/faq-queries";
