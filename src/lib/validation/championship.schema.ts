// ==============================================================================
// CHAMPIONSHIP VALIDATION SCHEMAS (ZOD)
// Server-side parameterized validation (Requirement 25)
// ==============================================================================

import { z } from "zod";

export const ChampionshipStatusEnum = z.enum([
  "DRAFT",
  "UPCOMING",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "ONGOING",
  "COMPLETED",
  "ARCHIVED",
]);

export const CreateChampionshipSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  name: z.string().min(3, "Name must be at least 3 characters").max(255),
  short_name: z.string().max(50).optional().nullable(),
  subtitle: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  status: ChampionshipStatusEnum.default("DRAFT"),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()),
  venue: z.string().min(2, "Venue is required").max(255),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  country: z.string().default("India"),
  registration_open: z.string().or(z.date()),
  registration_close: z.string().or(z.date()),
  currency: z.string().default("INR"),
  entry_fee_athlete: z.number().nonnegative().default(0),
  entry_fee_coach: z.number().nonnegative().default(0),
  entry_fee_official: z.number().nonnegative().default(0),
  banner_url: z.string().url().optional().nullable(),
  poster_url: z.string().url().optional().nullable(),
  rules_document_url: z.string().url().optional().nullable(),
});

export const UpdateChampionshipSchema = CreateChampionshipSchema.partial();

export type CreateChampionshipInput = z.infer<typeof CreateChampionshipSchema>;
export type UpdateChampionshipInput = z.infer<typeof UpdateChampionshipSchema>;
