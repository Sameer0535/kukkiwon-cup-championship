// ==============================================================================
// PARTICIPANT SERVICE (Requirement 7)
// Master participant registration, public ID generation, and profile management
// ==============================================================================

import prisma from "@/lib/db";
import { generatePublicParticipantId } from "@/lib/utils";
import { CreateParticipantInput, UpdateParticipantInput } from "@/lib/validation";

export class ParticipantService {
  /**
   * Creates a new participant with a secure non-sequential public ID
   */
  static async create(input: CreateParticipantInput) {
    const publicId = generatePublicParticipantId();

    return prisma.participant.create({
      data: {
        public_id: publicId,
        full_name: input.full_name,
        date_of_birth: new Date(input.date_of_birth),
        gender: input.gender,
        nationality: input.nationality,
        designation: input.designation,
        academy_name: input.academy_name,
        academy_country: input.academy_country,
        academy_state: input.academy_state,
        academy_city: input.academy_city,
        kukkiwon_id: input.kukkiwon_id,
        photo_url: input.photo_url,
        email: input.email,
        phone: input.phone,
        registration_status: "ACTIVE",
      },
    });
  }

  /**
   * Retrieves participant by public ID (safe for external references)
   */
  static async getByPublicId(publicId: string) {
    return prisma.participant.findUnique({
      where: { public_id: publicId },
      include: {
        registrations: {
          include: {
            championship: {
              select: { name: true, slug: true, status: true },
            },
          },
        },
      },
    });
  }

  /**
   * Searches participants by name, public ID, or Kukkiwon ID
   */
  static async search(query: string, limit = 20) {
    return prisma.participant.findMany({
      where: {
        OR: [
          { full_name: { contains: query, mode: "insensitive" } },
          { public_id: { contains: query, mode: "insensitive" } },
          { kukkiwon_id: { contains: query, mode: "insensitive" } },
          { academy_name: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Administrative update of participant record
   */
  static async update(id: string, input: UpdateParticipantInput) {
    return prisma.participant.update({
      where: { id },
      data: {
        ...input,
        date_of_birth: input.date_of_birth ? new Date(input.date_of_birth) : undefined,
      },
    });
  }
}
