import { z } from "zod";

export const cardInputSchema = z.object({
  number: z.string().min(12).max(19),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2000),
  cvc: z.string().min(3).max(4),
});

export const createPaymentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  reference: z.string().min(1),
  captureNow: z.boolean(),
  returnUrl: z.string().url(),
  webhookUrl: z.string().url(),
  card: cardInputSchema.optional(),
});

export type CreatePaymentBody = z.infer<typeof createPaymentSchema>;

export const amountOverrideSchema = z.object({
  amount: z.number().int().positive().optional(),
});
