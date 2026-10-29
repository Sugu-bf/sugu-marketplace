import { z } from "zod";

// ─── Retry Order Payment (POST /orders/{orderId}/payment) ────

export const RetryOrderPaymentResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    order_id: z.string(),
    payment_url: z.string().nullable(),
    next_step: z.string(),
  }),
});

export type RetryOrderPaymentResponse = z.infer<typeof RetryOrderPaymentResponseSchema>;

// ─── Payment Status (GET /payments/status?ref=…) ─────────────

export const PaymentStatusValueSchema = z.enum(["processing", "succeeded", "failed", "under_review"]);

export const PaymentStatusSchema = z.object({
  order_id: z.string(),
  order_number: z.string(),
  purpose: z.string(),
  status: PaymentStatusValueSchema,
  terminal: z.boolean(),
  /** Whole francs. */
  amount: z.number(),
  currency: z.string(),
});

export const PaymentStatusResponseSchema = z.object({
  success: z.literal(true),
  data: PaymentStatusSchema,
});

export type PaymentStatusValue = z.infer<typeof PaymentStatusValueSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
