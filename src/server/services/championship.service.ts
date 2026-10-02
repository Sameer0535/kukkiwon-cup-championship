// ==============================================================================
// CHAMPIONSHIP SERVICE (Requirements 6 & 22)
// Multi-event management and public query layer
// ==============================================================================

import prisma from "@/lib/db";
import { CreateChampionshipInput, UpdateChampionshipInput } from "@/lib/validation";

export class ChampionshipService {
  /**
   * Retrieves active championship by unique URL slug
   */
  static async getBySlug(slug: string) {
    return prisma.championship.findUnique({
      where: { slug },
      include: {
        site_settings: true,
        terms_versions: {
          where: { is_active: true },
          take: 1,
        },
      },
    });
  }

  /**
   * Lists all published championships for the public tournament portal
   */
  static async listPublicChampionships() {
    return prisma.championship.findMany({
      where: {
        status: { in: ["UPCOMING", "REGISTRATION_OPEN", "ONGOING"] },
      },
      orderBy: { start_date: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        short_name: true,
        subtitle: true,
        status: true,
        start_date: true,
        end_date: true,
        venue: true,
        city: true,
        state: true,
        country: true,
        registration_open: true,
        registration_close: true,
        banner_url: true,
        poster_url: true,
      },
    });
  }

  /**
   * Administrative creation of a new championship edition
   */
  static async create(input: CreateChampionshipInput) {
    return prisma.championship.create({
      data: {
        slug: input.slug,
        name: input.name,
        short_name: input.short_name,
        subtitle: input.subtitle,
        description: input.description,
        status: input.status,
        start_date: new Date(input.start_date),
        end_date: new Date(input.end_date),
        venue: input.venue,
        city: input.city,
        state: input.state,
        country: input.country || "India",
        registration_open: new Date(input.registration_open),
        registration_close: new Date(input.registration_close),
        currency: input.currency || "INR",
        entry_fee_athlete: input.entry_fee_athlete,
        entry_fee_coach: input.entry_fee_coach,
        entry_fee_official: input.entry_fee_official,
        banner_url: input.banner_url,
        poster_url: input.poster_url,
        rules_document_url: input.rules_document_url,
      },
    });
  }

  /**
   * Administrative update of an existing championship
   */
  static async update(id: string, input: UpdateChampionshipInput) {
    return prisma.championship.update({
      where: { id },
      data: {
        ...input,
        start_date: input.start_date ? new Date(input.start_date) : undefined,
        end_date: input.end_date ? new Date(input.end_date) : undefined,
        registration_open: input.registration_open ? new Date(input.registration_open) : undefined,
        registration_close: input.registration_close ? new Date(input.registration_close) : undefined,
      },
    });
  }
}
