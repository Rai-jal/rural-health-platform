import { z } from "zod";

// Schema for creating consultation requests (new admin-led workflow)
export const createConsultationRequestSchema = z.object({
  consultation_type: z.enum(["video", "voice", "sms"], {
    errorMap: () => ({
      message: "Consultation type must be video, voice, or sms",
    }),
  }),
  consultation_category: z.enum(["maternal_health", "reproductive_health", "general_inquiry", "childcare", "nutrition", "other"], {
    errorMap: () => ({
      message: "Invalid consultation category",
    }),
  }),
  preferred_date: z.string().min(1, "Preferred date is required"),
  preferred_time_range: z.string().optional(),
  reason_for_consultation: z.string().optional(),
  consent_acknowledged: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge consent to continue",
  }),
  // ✅ FIX: Add patient_phone and patient_name to schema
  patient_phone: z.string().optional(),
  patient_name: z.string().optional(),
});

export type CreateConsultationRequestInput = z.infer<typeof createConsultationRequestSchema>;

// Schema for creating consultations with provider (legacy/backward compatible)
export const createConsultationSchema = z.object({
  provider_id: z.string().uuid("Invalid provider ID").optional(),
  consultation_type: z.enum(["video", "voice", "sms"], {
    errorMap: () => ({
      message: "Consultation type must be video, voice, or sms",
    }),
  }),
  scheduled_at: z.string().datetime("Invalid date format").optional(),
  cost_leone: z.number().int().positive("Cost must be a positive number"),
  reason_for_consultation: z.string().optional(),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;

// Schema for admin assigning a provider
export const assignProviderSchema = z.object({
  provider_id: z.string().uuid("Invalid provider ID"),
  scheduled_at: z.union([
    z.string().datetime("Invalid date format. Please use ISO datetime format"),
    z.literal(""),
    z.undefined()
  ]).optional().transform((val) => val === "" ? undefined : val),
  cost_leone: z.number().int().positive("Cost must be a positive number").optional(),
});

export type AssignProviderInput = z.infer<typeof assignProviderSchema>;

// Schema for patient confirming/switching provider
export const confirmConsultationSchema = z.object({
  provider_id: z.string().uuid("Invalid provider ID"),
  confirmed: z.boolean(),
});

export type ConfirmConsultationInput = z.infer<typeof confirmConsultationSchema>;
