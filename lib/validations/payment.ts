import { z } from "zod";

export const createPaymentSchema = z.object({
  consultation_id: z.string().uuid("Invalid consultation ID"),
  amount_leone: z.number().int().positive("Amount must be a positive number"),
  payment_method: z.string().min(1, "Payment method is required"),
  payment_provider: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
