// ==============================================================================
// REGISTRATION VALIDATION SCHEMAS (ZOD)
// Server-side registration validation
// ==============================================================================

import { z } from "zod";

export const RegistrationStatusEnum = z.enum([
  "DRAFT",
  "PENDING_PAYMENT",
  "PAYMENT_FAILED",
  "PAID",
  "UNDER_REVIEW",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
]);

export const CreateRegistrationSchema = z.object({
  championship_id: z.string().uuid("Invalid championship ID"),
  participant_id: z.string().uuid("Invalid participant ID"),
  terms_version: z.string().min(1, "Terms version required"),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the championship terms and conditions",
  }),
  notes: z.string().optional().nullable(),
});

export const UpdateRegistrationStatusSchema = z.object({
  status: RegistrationStatusEnum,
  notes: z.string().optional().nullable(),
});

export type CreateRegistrationInput = z.infer<typeof CreateRegistrationSchema>;
export type UpdateRegistrationStatusInput = z.infer<typeof UpdateRegistrationStatusSchema>;
