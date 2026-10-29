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
