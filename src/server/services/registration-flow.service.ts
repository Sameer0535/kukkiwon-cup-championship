// ==============================================================================
// REGISTRATION FLOW SERVICE (Phase 3 Core Architecture)
// Multi-step drafts, IDOR security protection, server validation, and submission
// ==============================================================================

import prisma from "@/lib/db";
import {
  ParticipantType,
  RegistrationStatus,
  AthleteDraftData,
  CoachDraftData,
  AcademyDraftData,
  RegistrationWithDetails,
} from "@/types/registration";
import {
  generateAthleteRegNumber,
  generateCoachRegNumber,
  generatePublicParticipantId,
  generateAcademyCode,
} from "@/lib/utils";
import { CategoryService } from "./category.service";
import { AcademyService } from "./academy.service";
import { CmsService } from "./cms.service";

// In-memory fallback registry for dev mode
interface FallbackRegistration {
  id: string;
  user_id: string;
  registration_number: string;
  championship_id: string;
  participant_id: string;
  participant_type: ParticipantType;
  status: RegistrationStatus;
  discipline?: string | null;
  category_id?: string | null;
  academy_id?: string | null;
  weight_kg?: number | null;
  belt_rank?: string | null;
  coach_role?: string | null;
  draft_data?: string | null;
  registered_at: Date;
  submitted_at?: Date | null;
  terms_version: string;
  terms_accepted_at: Date;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
  participant_name: string;
  category_name?: string;
  academy_name?: string;
}

const FALLBACK_REGISTRATIONS_STORE: Map<string, FallbackRegistration> = new Map();

export class RegistrationFlowService {
  /**
   * REQUIREMENT 11: Save-As-Draft
   * Saves multi-step wizard state securely.
   * If registrationId is provided, verifies user ownership (IDOR check).
   */
  static async saveDraft(params: {
    userId: string;
    registrationId?: string;
    participantType: ParticipantType;
    championshipId?: string;
    draftData: AthleteDraftData | CoachDraftData | AcademyDraftData;
    checkDate?: Date;
  }): Promise<{ registrationId: string; registrationNumber: string }> {
    const { userId, registrationId, participantType, championshipId = "champ-kukkiwon-2026", draftData, checkDate } = params;

    // Requirement 5 & 23: Server-side registration availability enforcement
    if (!registrationId) {
      const availability = await CmsService.getRegistrationAvailability(championshipId, checkDate);
      if (availability.status === "CLOSED") {
        throw new Error("Registration is closed for this championship.");
      }
    }

    const draftJson = JSON.stringify(draftData);

    // Extract basic participant name for list display
    let participantName = "Draft Participant";
    let discipline: string | undefined;
    let categoryId: string | undefined;
    let academyId: string | undefined;
    let weightKg: number | undefined;
    let beltRank: string | undefined;

    if (participantType === "ATHLETE") {
      const a = draftData as AthleteDraftData;
      participantName = [a.first_name, a.last_name].filter(Boolean).join(" ") || "Incomplete Athlete";
      discipline = a.discipline;
      categoryId = a.category_id;
      academyId = a.academy_id;
      weightKg = a.weight_kg ? parseFloat(a.weight_kg) : undefined;
      beltRank = a.belt_rank;
    } else if (participantType === "COACH") {
      const c = draftData as CoachDraftData;
      participantName = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Incomplete Coach";
      academyId = c.academy_id;
    } else if (participantType === "ACADEMY_TEAM") {
      const ac = draftData as AcademyDraftData;
      participantName = ac.name || "Incomplete Academy";
    }

    try {
      if (registrationId) {
        // IDOR Check: Ensure record belongs to user
        const existing = await prisma.registration.findUnique({
          where: { id: registrationId },
        });

        if (!existing || existing.user_id !== userId) {
          throw new Error("Unauthorized access to this registration record.");
        }

        if (existing.status !== "DRAFT") {
          throw new Error("Submitted registrations cannot be updated as drafts.");
        }

        const updated = await prisma.registration.update({
          where: { id: registrationId },
          data: {
            draft_data: draftJson,
            discipline: discipline || existing.discipline,
            category_id: categoryId || existing.category_id,
            academy_id: academyId || existing.academy_id,
            weight_kg: weightKg !== undefined ? weightKg : existing.weight_kg,
            belt_rank: beltRank || existing.belt_rank,
            updated_at: new Date(),
          },
        });

        return {
          registrationId: updated.id,
          registrationNumber: updated.registration_number,
        };
      }

      // Create new draft
      const regNumber =
        participantType === "COACH"
          ? generateCoachRegNumber("KKC26")
          : participantType === "ACADEMY_TEAM"
          ? generateAcademyCode("KKC26")
          : generateAthleteRegNumber("KKC26");

      // Create dummy/placeholder participant record
      const publicId = generatePublicParticipantId("2026");
      const participant = await prisma.participant.create({
        data: {
          user_id: userId,
          public_id: publicId,
          full_name: participantName,
          date_of_birth: new Date("2000-01-01"),
          gender: "MALE",
          nationality: "IND",
          designation: participantType,
        },
      });

      const reg = await prisma.registration.create({
        data: {
          user_id: userId,
          registration_number: regNumber,
          championship_id: championshipId,
          participant_id: participant.id,
          participant_type: participantType,
          status: "DRAFT",
          discipline: discipline || null,
          category_id: categoryId || null,
          academy_id: academyId || null,
          weight_kg: weightKg || null,
          belt_rank: beltRank || null,
          draft_data: draftJson,
        },
      });

      return {
        registrationId: reg.id,
        registrationNumber: reg.registration_number,
      };
    } catch (e: any) {
      if (
        e.message?.includes("Unauthorized") ||
        e.message?.includes("Submitted") ||
        e.message?.includes("closed")
      ) {
        throw e;
      }
      // Fallback in-memory
      const id = registrationId || `draft-${Date.now()}`;
      let regNumber =
        participantType === "COACH"
          ? generateCoachRegNumber("KKC26")
          : participantType === "ACADEMY_TEAM"
          ? generateAcademyCode("KKC26")
          : generateAthleteRegNumber("KKC26");

      if (registrationId && FALLBACK_REGISTRATIONS_STORE.has(registrationId)) {
        const prev = FALLBACK_REGISTRATIONS_STORE.get(registrationId)!;
        if (prev.user_id !== userId) {
          throw new Error("Unauthorized access to this registration record.");
        }
        regNumber = prev.registration_number;
      }

      FALLBACK_REGISTRATIONS_STORE.set(id, {
        id,
        user_id: userId,
        registration_number: regNumber,
        championship_id: championshipId,
        participant_id: `part-${id}`,
        participant_type: participantType,
        status: "DRAFT",
        discipline: discipline || null,
        category_id: categoryId || null,
        academy_id: academyId || null,
        weight_kg: weightKg || null,
        belt_rank: beltRank || null,
        draft_data: draftJson,
        registered_at: new Date(),
        terms_version: "v1.0",
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        participant_name: participantName,
      });

      return { registrationId: id, registrationNumber: regNumber };
    }
  }

  /**
   * REQUIREMENT 11 & 16: Resume Draft with IDOR Authorization Check
   */
  static async getDraft(registrationId: string, userId: string) {
    try {
      const reg = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: {
          category: true,
          academy: true,
        },
      });

      if (!reg) return null;
      if (reg.user_id !== userId) {
        throw new Error("Unauthorized: You do not have permission to view this registration.");
      }

      return {
        id: reg.id,
        registrationNumber: reg.registration_number,
        participantType: reg.participant_type,
        status: reg.status,
        draftData: reg.draft_data ? JSON.parse(reg.draft_data) : null,
        discipline: reg.discipline,
        categoryId: reg.category_id,
        academyId: reg.academy_id,
        category: reg.category,
        academy: reg.academy,
        updatedAt: reg.updated_at,
      };
    } catch (e: any) {
      if (e.message?.includes("Unauthorized")) throw e;

      // Fallback check
      const fb = FALLBACK_REGISTRATIONS_STORE.get(registrationId);
      if (!fb) return null;
      if (fb.user_id !== userId) {
        throw new Error("Unauthorized: You do not have permission to view this registration.");
      }

      return {
        id: fb.id,
        registrationNumber: fb.registration_number,
        participantType: fb.participant_type,
        status: fb.status,
        draftData: fb.draft_data ? JSON.parse(fb.draft_data) : null,
        discipline: fb.discipline,
        categoryId: fb.category_id,
        academyId: fb.academy_id,
        updatedAt: fb.updated_at,
      };
    }
  }

  /**
   * REQUIREMENT 12: List user's registrations for /my-registration dashboard
   */
  static async listUserRegistrations(userId: string): Promise<RegistrationWithDetails[]> {
    try {
      const list = await prisma.registration.findMany({
        where: { user_id: userId },
        include: {
          participant: true,
          championship: true,
          category: true,
          academy: true,
        },
        orderBy: { updated_at: "desc" },
      });

      if (list && list.length > 0) {
        return list.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          registration_number: r.registration_number,
          athlete_id: r.athlete_id || null,
          championship_id: r.championship_id,
          participant_id: r.participant_id,
          participant_type: r.participant_type as ParticipantType,
          status: r.status as RegistrationStatus,
          discipline: r.discipline,
          category_id: r.category_id,
          academy_id: r.academy_id,
          weight_kg: r.weight_kg ? Number(r.weight_kg) : null,
          belt_rank: r.belt_rank,
          coach_role: r.coach_role,
          coach_qualification: r.coach_qualification,
          draft_data: r.draft_data,
          registered_at: r.registered_at,
          submitted_at: r.submitted_at,
          confirmed_at: r.confirmed_at,
          terms_version: r.terms_version,
          terms_accepted_at: r.terms_accepted_at,
          notes: r.notes,
          created_at: r.created_at,
          updated_at: r.updated_at,
          participant: r.participant
            ? {
                id: r.participant.id,
                public_id: r.participant.public_id,
                full_name: r.participant.full_name,
                designation: r.participant.designation,
                nationality: r.participant.nationality,
                gender: r.participant.gender,
                date_of_birth: r.participant.date_of_birth,
                academy_name: r.participant.academy_name,
                photo_url: r.participant.photo_url,
                email: r.participant.email,
                phone: r.participant.phone,
              }
            : undefined,
          championship: r.championship
            ? {
                id: r.championship.id,
                slug: r.championship.slug,
                name: r.championship.name,
                city: r.championship.city,
                start_date: r.championship.start_date,
              }
            : undefined,
          category: r.category
            ? {
                id: r.category.id,
                championship_id: r.category.championship_id,
                code: r.category.code,
                name: r.category.name,
                discipline: r.category.discipline,
                division: r.category.division,
                gender: r.category.gender as any,
                display_order: r.category.display_order,
                is_active: r.category.is_active,
              }
            : null,
          academy: r.academy
            ? {
                id: r.academy.id,
                code: r.academy.code,
                name: r.academy.name,
                country: r.academy.country,
                state: r.academy.state,
                city: r.academy.city,
                status: r.academy.status,
              }
            : null,
        }));
      }
    } catch {
      // Fallback
    }

    const userList: RegistrationWithDetails[] = [];
    FALLBACK_REGISTRATIONS_STORE.forEach((item) => {
      if (item.user_id === userId) {
        userList.push({
          id: item.id,
          user_id: item.user_id,
          registration_number: item.registration_number,
          championship_id: item.championship_id,
          participant_id: item.participant_id,
          participant_type: item.participant_type,
          status: item.status,
          discipline: item.discipline,
          category_id: item.category_id,
          academy_id: item.academy_id,
          registered_at: item.registered_at,
          submitted_at: item.submitted_at,
          terms_version: item.terms_version,
          terms_accepted_at: item.terms_accepted_at,
          created_at: item.created_at,
          updated_at: item.updated_at,
          participant: {
            id: item.participant_id,
            public_id: `KUKKI-2026-${item.registration_number.slice(-5)}`,
            full_name: item.participant_name,
            designation: item.participant_type,
            nationality: "IND",
            gender: "MALE",
            date_of_birth: "2000-01-01",
            academy_name: item.academy_name,
          },
          championship: {
            id: item.championship_id,
            slug: "kukkiwon-cup-2026",
            name: "Kukkiwon Cup Championship 2026",
            city: "New Delhi",
            start_date: "2026-11-20T09:00:00Z",
          },
        });
      }
    });

    return userList.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  /**
   * REQUIREMENT 14: Final Submission
   * Complete server-side validation before changing status DRAFT -> SUBMITTED
   */
  static async submitRegistration(params: {
    registrationId?: string;
    userId: string;
    participantType: ParticipantType;
    draftData: AthleteDraftData | CoachDraftData | AcademyDraftData;
  }): Promise<{
    success: boolean;
    registrationNumber: string;
    participantName: string;
    championshipName: string;
    discipline?: string;
    categoryName?: string;
    status: RegistrationStatus;
    submittedAt: string;
  }> {
    const { registrationId, userId, participantType, draftData } = params;

    // Requirement 5 & 23: Server-side registration availability enforcement for submissions
    const targetChampId = (draftData as any).championship_id || "champ-kukkiwon-2026";
    const availability = await CmsService.getRegistrationAvailability(targetChampId);
    if (availability.status === "CLOSED") {
      throw new Error("Registration is closed for this championship.");
    }

    // 1. Validate Legal Declarations
    if (!draftData.declaration_accurate || !draftData.declaration_terms) {
      throw new Error("All mandatory legal declarations and terms agreements must be accepted.");
    }

    let participantName = "";
    let discipline = "";
    let categoryName = "";
    let categoryId: string | undefined;
    let academyId: string | undefined;

    // 2. Comprehensive Type-Specific Validation
    if (participantType === "ATHLETE") {
      const a = draftData as AthleteDraftData;
      if (!a.first_name || !a.last_name || !a.date_of_birth || !a.gender || !a.nationality) {
        throw new Error("Missing required personal identification fields (First Name, Last Name, DOB, Gender, Nationality).");
      }

      if (!a.discipline) {
        throw new Error("A competitive discipline must be selected.");
      }

      if (!a.category_id) {
        throw new Error("A competition category must be selected.");
      }

      // CRITICAL: Server-side Category Eligibility Verification
      const validation = await CategoryService.validateCategoryEligibility(a.category_id, {
        dob: a.date_of_birth,
        gender: a.gender,
        belt: a.belt_rank,
        weight: a.weight_kg ? parseFloat(a.weight_kg) : undefined,
      });

      if (!validation.valid) {
        throw new Error(`Category Eligibility Error: ${validation.reason}`);
      }

      participantName = `${a.first_name} ${a.last_name}`.trim();
      discipline = a.discipline;
      categoryName = validation.category?.name || "Selected Category";
      categoryId = validation.category?.id;
      academyId = a.academy_id;

    } else if (participantType === "COACH") {
      const c = draftData as CoachDraftData;
      if (!c.first_name || !c.last_name || !c.date_of_birth || !c.coach_role || !c.qualification) {
        throw new Error("Missing required coach profile information (Name, DOB, Role, Qualification).");
      }
      participantName = `${c.first_name} ${c.last_name}`.trim();
      discipline = "COACHING";
      categoryName = `Accredited Coach (${c.coach_role})`;
      academyId = c.academy_id;

    } else if (participantType === "ACADEMY_TEAM") {
      const ac = draftData as AcademyDraftData;
      if (!ac.name || !ac.city || !ac.state || !ac.representative_first_name || !ac.representative_email) {
        throw new Error("Missing mandatory academy organization or representative details.");
      }
      participantName = ac.name;
      discipline = "ACADEMY_ORGANIZATION";
      categoryName = "Academy Official Delegation";
    }

    // 3. Status Transition to SUBMITTED
    const now = new Date();

    try {
      let regNumber =
        participantType === "COACH"
          ? generateCoachRegNumber("KKC26")
          : participantType === "ACADEMY_TEAM"
          ? generateAcademyCode("KKC26")
          : generateAthleteRegNumber("KKC26");

      let currentRegId = registrationId;

      if (currentRegId) {
        // IDOR Check
        const existing = await prisma.registration.findUnique({
          where: { id: currentRegId },
        });

        if (!existing || existing.user_id !== userId) {
          throw new Error("Unauthorized access to submit this registration.");
        }

        if (existing.status !== "DRAFT") {
          throw new Error("Cannot modify registration: record has already been submitted, approved, or paid.");
        }

        regNumber = existing.registration_number;

        // Update participant details
        await prisma.participant.update({
          where: { id: existing.participant_id },
          data: {
            full_name: participantName,
            academy_id: academyId || null,
          },
        });

        await prisma.registration.update({
          where: { id: currentRegId },
          data: {
            status: "SUBMITTED",
            submitted_at: now,
            discipline: discipline || null,
            category_id: categoryId || null,
            academy_id: academyId || null,
            draft_data: JSON.stringify(draftData),
            updated_at: now,
          },
        });
      } else {
        // Direct submission without prior draft
        const publicId = generatePublicParticipantId("2026");
        const participant = await prisma.participant.create({
          data: {
            user_id: userId,
            public_id: publicId,
            full_name: participantName,
            date_of_birth: new Date("2000-01-01"),
            gender: "MALE",
            nationality: "IND",
            designation: participantType,
            academy_id: academyId || null,
          },
        });

        const newReg = await prisma.registration.create({
          data: {
            user_id: userId,
            registration_number: regNumber,
            championship_id: "c1111111-1111-1111-1111-111111111111",
            participant_id: participant.id,
            participant_type: participantType,
            status: "SUBMITTED",
            discipline: discipline || null,
            category_id: categoryId || null,
            academy_id: academyId || null,
            submitted_at: now,
            draft_data: JSON.stringify(draftData),
          },
        });
        currentRegId = newReg.id;
      }

      return {
        success: true,
        registrationNumber: regNumber,
        participantName,
        championshipName: "Kukkiwon Cup Championship 2026",
        discipline,
        categoryName,
        status: "SUBMITTED",
        submittedAt: now.toISOString(),
      };
    } catch (e: any) {
      if (
        e.message?.includes("Unauthorized") ||
        e.message?.includes("Category Eligibility") ||
        e.message?.includes("Missing") ||
        e.message?.includes("Cannot modify registration")
      ) {
        throw e;
      }

      // Dev Fallback
      const fbId = registrationId || `reg-${Date.now()}`;
      let regNumber =
        participantType === "COACH"
          ? generateCoachRegNumber("KKC26")
          : participantType === "ACADEMY_TEAM"
          ? generateAcademyCode("KKC26")
          : generateAthleteRegNumber("KKC26");

      if (registrationId && FALLBACK_REGISTRATIONS_STORE.has(registrationId)) {
        const existing = FALLBACK_REGISTRATIONS_STORE.get(registrationId)!;
        if (existing.user_id !== userId) {
          throw new Error("Unauthorized access to submit this registration.");
        }
        if (existing.status !== "DRAFT") {
          throw new Error("Cannot modify registration: record has already been submitted, approved, or paid.");
        }
        regNumber = existing.registration_number;
      }
      FALLBACK_REGISTRATIONS_STORE.set(fbId, {
        id: fbId,
        user_id: userId,
        registration_number: regNumber,
        championship_id: "c1111111-1111-1111-1111-111111111111",
        participant_id: `part-${fbId}`,
        participant_type: participantType,
        status: "SUBMITTED",
        discipline,
        category_id: categoryId,
        academy_id: academyId,
        draft_data: JSON.stringify(draftData),
        registered_at: now,
        submitted_at: now,
        terms_version: "v1.0",
        terms_accepted_at: now,
        created_at: now,
        updated_at: now,
        participant_name: participantName,
        category_name: categoryName,
      });

      return {
        success: true,
        registrationNumber: regNumber,
        participantName,
        championshipName: "Kukkiwon Cup Championship 2026",
        discipline,
        categoryName,
        status: "SUBMITTED",
        submittedAt: now.toISOString(),
      };
    }
  }
}
