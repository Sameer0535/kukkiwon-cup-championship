// ==============================================================================
// PARTICIPANT VALIDATION SCHEMAS (ZOD)
// Server-side validation enforcing data integrity
// ==============================================================================

import { z } from "zod";

export const GenderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
export const ParticipantStatusEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);

export const CreateParticipantSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(255),
  date_of_birth: z.string().or(z.date()),
  gender: GenderEnum,
  nationality: z.string().min(2, "Nationality is required").max(50),
  designation: z.string().min(2, "Designation is required").max(100),
  academy_name: z.string().max(255).optional().nullable(),
  academy_country: z.string().max(100).optional().nullable(),
  academy_state: z.string().max(100).optional().nullable(),
  academy_city: z.string().max(100).optional().nullable(),
  kukkiwon_id: z.string().max(100).optional().nullable(),
  photo_url: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().min(6, "Valid contact number required").max(50).optional().nullable(),
});

export const UpdateParticipantSchema = CreateParticipantSchema.partial().extend({
  registration_status: ParticipantStatusEnum.optional(),
});

export type CreateParticipantInput = z.infer<typeof CreateParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof UpdateParticipantSchema>;
