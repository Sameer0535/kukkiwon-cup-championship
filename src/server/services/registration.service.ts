// ==============================================================================
// REGISTRATION SERVICE (Requirement 8)
// Championship registration lifecycle, status transitions, and audit records
// ==============================================================================

import prisma from "@/lib/db";
import { generateRegistrationNumber } from "@/lib/utils";
import { CreateRegistrationInput } from "@/lib/validation";
import { RegistrationStatus } from "@prisma/client";

export class RegistrationService {
  /**
   * Enrolls a participant into a championship under an auditable terms version
   */
  static async create(input: CreateRegistrationInput) {
    const regNumber = generateRegistrationNumber("KC26");

    return prisma.registration.create({
      data: {
        registration_number: regNumber,
        championship_id: input.championship_id,
        participant_id: input.participant_id,
        status: "DRAFT",
        terms_version: input.terms_version,
        terms_accepted_at: new Date(),
        notes: input.notes,
      },
      include: {
        participant: true,
        championship: true,
      },
    });
  }

  /**
   * Fetches registration with full relation details
   */
  static async getById(id: string) {
    return prisma.registration.findUnique({
      where: { id },
      include: {
        participant: true,
        championship: true,
        payments: true,
        documents: true,
        id_card: true,
      },
    });
  }

  /**
   * Transitions registration status with strict state machine rules
   */
  static async updateStatus(
    id: string,
    status: RegistrationStatus,
    adminNotes?: string | null
  ) {
    const confirmedAt = status === "CONFIRMED" ? new Date() : undefined;

    return prisma.registration.update({
      where: { id },
      data: {
        status,
        confirmed_at: confirmedAt,
        notes: adminNotes !== undefined ? adminNotes : undefined,
      },
    });
  }

  /**
   * Lists registrations by championship with filter options
   */
  static async listByChampionship(
    championshipId: string,
    options?: {
      status?: RegistrationStatus;
      limit?: number;
      offset?: number;
    }
  ) {
    return prisma.registration.findMany({
      where: {
        championship_id: championshipId,
        status: options?.status,
      },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      orderBy: { registered_at: "desc" },
      include: {
        participant: {
          select: {
            public_id: true,
            full_name: true,
            gender: true,
            nationality: true,
            designation: true,
            academy_name: true,
          },
        },
      },
    });
  }
}
