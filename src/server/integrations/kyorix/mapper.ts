// ==============================================================================
// KYORIX INTEGRATION MAPPER (Phase 10)
// Explicit Data Minimization: converts internal entities to sanitized Kyorix DTOs
// Prevents leakage of internal credentials, secrets, private tokens, and notes
// ==============================================================================

import {
  KyorixAthleteDTO,
  KyorixRegistrationDTO,
  KyorixAcademyDTO,
} from "./types";

export interface LocalRegistrationInput {
  id: string;
  registration_number?: string | null;
  status: string;
  confirmed_at?: Date | null;
  submitted_at?: Date | null;
  participant?: {
    id: string;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    gender: any;
    date_of_birth: Date | string;
    nationality?: string | null;
    belt_rank?: string | null;
    kukkiwon_dan_number?: string | null;
    kukkiwon_id?: string | null;
    athlete_id?: string | null;
    public_id?: string | null;
  } | null;
  category?: {
    id?: string;
    code?: string | null;
    name: string;
    gender?: any;
    weight_category?: any;
    age_category?: string | null;
  } | null;
  academy?: {
    code?: string | null;
    name: string;
    short_name?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
  payments?: Array<{
    status: string;
    amount?: any;
  }> | null;
  payment_orders?: Array<{
    status: string;
    amount?: any;
  }> | null;
  id_card?: {
    athlete_id?: string | null;
    status: string;
  } | null;
  id_cards?: Array<{
    athlete_id?: string | null;
    status: string;
  }> | null;
}

export class KyorixIntegrationMapper {
  /**
   * Minimizes and transforms local participant details into a safe KyorixAthleteDTO.
   * Strictly filters out Aadhaar/Passport document paths, phone numbers, and emails.
   */
  static toKyorixAthleteDTO(registration: LocalRegistrationInput): KyorixAthleteDTO {
    const participant = registration.participant;
    if (!participant) {
      throw new Error("Cannot map to Kyorix Athlete: participant record is missing.");
    }

    let firstName = participant.first_name || "";
    let lastName = participant.last_name || "";

    if (!firstName && participant.full_name) {
      const parts = participant.full_name.trim().split(/\s+/);
      firstName = parts[0] || "Athlete";
      lastName = parts.slice(1).join(" ") || "";
    }

    const localAthleteId =
      registration.id_card?.athlete_id ||
      (Array.isArray(registration.id_cards) && registration.id_cards[0]?.athlete_id) ||
      participant.athlete_id ||
      participant.public_id ||
      `ATH-${participant.id.substring(0, 8).toUpperCase()}`;

    let dobString = "";
    if (participant.date_of_birth instanceof Date) {
      dobString = participant.date_of_birth.toISOString().split("T")[0];
    } else if (typeof participant.date_of_birth === "string") {
      dobString = participant.date_of_birth.split("T")[0];
    }

    return {
      localAthleteId,
      firstName: firstName.trim() || "Athlete",
      lastName: lastName.trim() || "",
      gender: (String(participant.gender || "OTHER").toUpperCase() as "MALE" | "FEMALE" | "OTHER") || "OTHER",
      dateOfBirth: dobString,
      nationality: participant.nationality?.trim() || "India",
      beltRank: participant.belt_rank?.trim() || undefined,
      kukkiwonDanNumber: (participant.kukkiwon_dan_number || participant.kukkiwon_id)?.trim() || undefined,
      academyCode: registration.academy?.code || undefined,
      academyName: registration.academy?.name || undefined,
    };
  }

  /**
   * Minimizes and transforms local academy info into safe KyorixAcademyDTO.
   */
  static toKyorixAcademyDTO(academy?: LocalRegistrationInput["academy"]): KyorixAcademyDTO | undefined {
    if (!academy || !academy.name) return undefined;

    return {
      code: academy.code || "ACA-DEFAULT",
      name: academy.name.trim(),
      shortName: academy.short_name?.trim() || undefined,
      city: academy.city?.trim() || "New Delhi",
      state: academy.state?.trim() || "Delhi",
      country: academy.country?.trim() || "India",
    };
  }

  /**
   * Minimizes and transforms local registration into KyorixRegistrationDTO.
   * Extracts high-level payment status without exposing transaction IDs or secrets.
   */
  static toKyorixRegistrationDTO(
    registration: LocalRegistrationInput,
    kyorixChampionshipId: string
  ): KyorixRegistrationDTO {
    const athlete = this.toKyorixAthleteDTO(registration);
    const academy = this.toKyorixAcademyDTO(registration.academy);

    // Compute safe, high-level payment status without exposing payment credentials
    let safePaymentStatus: "PAID" | "PENDING" | "REFUNDED" | "EXEMPT" = "PENDING";
    const hasPaidOrder = registration.payment_orders?.some(
      (o) => o.status === "PAID"
    );
    const hasPaidPayment = registration.payments?.some(
      (p) => p.status === "SUCCESS"
    );

    if (hasPaidOrder || hasPaidPayment || registration.status === "APPROVED" || registration.status === "CONFIRMED") {
      safePaymentStatus = "PAID";
    }

    return {
      localRegistrationId: registration.id,
      registrationNumber: registration.registration_number || `REG-${registration.id.substring(0, 8)}`,
      championshipId: kyorixChampionshipId,
      categoryCode: registration.category?.code || undefined,
      categoryName: registration.category?.name || undefined,
      genderCategory: registration.category?.gender || undefined,
      weightCategory: registration.category?.weight_category || undefined,
      ageCategory: registration.category?.age_category || undefined,
      athlete,
      academy,
      paymentStatus: safePaymentStatus,
      registrationStatus: registration.status,
      approvedAt: registration.confirmed_at
        ? registration.confirmed_at.toISOString()
        : registration.submitted_at
        ? registration.submitted_at.toISOString()
        : undefined,
    };
  }
}
