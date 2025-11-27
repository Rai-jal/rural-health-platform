import { z } from "zod";

export const createConsultationSchema = z.object({
  provider_id: z.string().uuid("Invalid provider ID"),
  consultation_type: z.enum(["video", "voice", "sms"], {
    errorMap: () => ({
      message: "Consultation type must be video, voice, or sms",
    }),
  }),
  scheduled_at: z.string().datetime("Invalid date format"),
  cost_leone: z.number().int().positive("Cost must be a positive number"),
  reason_for_consultation: z.string().optional(),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
