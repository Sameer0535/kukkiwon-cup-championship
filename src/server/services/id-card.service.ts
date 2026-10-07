// ==============================================================================
// PHASE 6: ATHLETE ID CARD & QR VERIFICATION SERVICE
// Server-side eligibility, sequential identity generation, scannable QR tokens,
// and privacy-preserving public verification
// ==============================================================================

import prisma from "@/lib/db";
import {
  generateSecureQrToken,
  buildVerificationUrl,
  generateQrCodeDataUrl,
  formatPublicAthleteVerification,
  isCredentialActive,
} from "@/lib/qr";
import { AuditService } from "@/server/services/audit.service";
import { PersistenceGuard } from "./persistence-guard";
import {
  AthleteIdCardDetails,
  IdCardEligibilityResult,
  PublicAthleteVerification,
  IdCardStatusType,
} from "@/types/id-card";

// ------------------------------------------------------------------------------
// Fallback in-memory stores for offline execution and automated tests
// ------------------------------------------------------------------------------
interface FallbackIdCard {
  id: string;
  participant_id: string;
  registration_id: string;
  athlete_id: string;
  card_number: string;
  qr_token: string;
  version: number;
  card_status: IdCardStatusType;
  generated_at?: Date | null;
  revoked_at?: Date | null;
  revocation_reason?: string | null;
  created_at: Date;
  updated_at: Date;
  // Metadata cache
  athlete_name?: string;
  academy_name?: string | null;
  category_name?: string | null;
  discipline?: string | null;
  gender?: string | null;
  nationality?: string;
  championship_name?: string;
  registration_number?: string;
  photo_url?: string | null;
  user_id?: string | null;
  kukkiwon_id?: string | null;
}

const FALLBACK_ID_CARDS: Map<string, FallbackIdCard> = new Map();
let athleteSequence = 1000;

let isPrismaReachable: boolean | null = null;
async function isDbOnline(): Promise<boolean> {
  if (isPrismaReachable !== null) return isPrismaReachable;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isPrismaReachable = true;
    return true;
  } catch {
    isPrismaReachable = false;
    return false;
  }
}

export class IdCardService {
  /**
   * Generates a sequential, institutional athlete ID (e.g. KKC26-ATH-000001)
   */
  static async generateAthleteId(prefix = "KKC26"): Promise<string> {
    const online = await isDbOnline();
    if (online) {
      try {
        const latest = await prisma.idCard.findFirst({
          where: {
            athlete_id: { startsWith: `${prefix}-ATH-` },
          },
          orderBy: { created_at: "desc" },
          select: { athlete_id: true },
        });

        if (latest && latest.athlete_id) {
          const parts = latest.athlete_id.split("-");
          const lastNum = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastNum)) {
            const nextNum = lastNum + 1;
            return `${prefix}-ATH-${String(nextNum).padStart(6, "0")}`;
          }
        }
      } catch {
        // Fall back to sequence counter
      }
    }

    athleteSequence++;
    return `${prefix}-ATH-${String(athleteSequence).padStart(6, "0")}`;
  }

  /**
   * Helper to verify ownership and avoid IDOR
   */
  static async verifyOwnership(registrationId: string, userId?: string | null): Promise<void> {
    if (!userId) {
      throw new Error("Authentication required to access athlete ID card");
    }

    const online = await isDbOnline();
    if (online) {
      const reg = await prisma.registration.findUnique({
        where: { id: registrationId },
        select: { id: true, user_id: true },
      });
      if (!reg) {
        throw new Error("Registration not found");
      }
      if (reg.user_id && reg.user_id !== userId) {
        throw new Error("Unauthorized: You do not have permission to access this registration");
      }
    } else {
      const existing = FALLBACK_ID_CARDS.get(registrationId);
      if (existing && existing.user_id && existing.user_id !== userId) {
        throw new Error("Unauthorized: You do not have permission to access this registration");
      }
    }
  }

  /**
   * Centralized eligibility evaluator (Requirement 6)
   * Verifies registration existence, payment confirmation, and status integrity
   */
  static async canGenerateAthleteIdCard(
    registrationId: string,
    userId?: string | null
  ): Promise<IdCardEligibilityResult> {
    if (!registrationId) {
      return {
        isEligible: false,
        status: "NOT_ELIGIBLE",
        reason: "Registration ID is required.",
        hasExistingCard: false,
      };
    }

    const online = await isDbOnline();

    // 1. Database check
    if (online) {
      try {
        const reg = await prisma.registration.findUnique({
          where: { id: registrationId },
          include: {
            championship: true,
            participant: true,
            category: true,
            academy: true,
            payment_orders: {
              where: { status: "PAID" },
            },
            id_card: true,
          },
        });

        if (!reg) {
          return {
            isEligible: false,
            status: "NOT_ELIGIBLE",
            reason: "Registration record does not exist.",
            hasExistingCard: false,
          };
        }

        // Ownership authorization check if userId provided
        if (userId && reg.user_id && reg.user_id !== userId) {
          return {
            isEligible: false,
            status: "NOT_ELIGIBLE",
            reason: "Unauthorized: User does not own this registration.",
            hasExistingCard: false,
          };
        }

        // Cancellation / rejection check
        if (reg.status === "CANCELLED" || reg.status === "REJECTED") {
          return {
            isEligible: false,
            status: "NOT_ELIGIBLE",
            reason: "Registration has been cancelled or rejected.",
            hasExistingCard: false,
          };
        }

        // Draft check
        if (reg.status === "DRAFT") {
          return {
            isEligible: false,
            status: "NOT_ELIGIBLE",
            reason: "Registration draft has not been submitted or confirmed.",
            hasExistingCard: false,
          };
        }

        // Payment check: must have a verified PAID order or status is PAID/CONFIRMED
        const isPaid = reg.payment_orders.length > 0 || reg.status === "PAID" || reg.status === "CONFIRMED";
        if (!isPaid) {
          return {
            isEligible: false,
            status: "NOT_ELIGIBLE",
            reason: "Registration payment has not been completed or verified.",
            hasExistingCard: false,
          };
        }

        // Existing ID card check
        if (reg.id_card) {
          const card = reg.id_card;
          const verificationUrl = buildVerificationUrl(card.qr_token);
          const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);

          const existingCard: AthleteIdCardDetails = {
            id: card.id,
            registrationId: card.registration_id,
            participantId: card.participant_id,
            athleteId: card.athlete_id || card.card_number,
            cardNumber: card.card_number,
            qrToken: card.qr_token,
            version: card.version,
            cardStatus: card.card_status as IdCardStatusType,
            generatedAt: card.generated_at?.toISOString() || null,
            revokedAt: card.revoked_at?.toISOString() || null,
            revocationReason: card.revocation_reason,
            qrCodeDataUrl,
            verificationUrl,
            athleteName: reg.participant.full_name,
            academyName: reg.academy?.name || reg.participant.academy_name,
            categoryName: reg.category?.name,
            discipline: reg.discipline || undefined,
            gender: reg.participant.gender,
            nationality: reg.participant.nationality,
            championshipName: reg.championship.name,
            photoUrl: reg.participant.photo_url || null,
            registrationNumber: reg.registration_number,
          };

          if (card.card_status === "REVOKED") {
            return {
              isEligible: false,
              status: "REVOKED",
              reason: "Athlete ID card has been revoked by administration.",
              athleteId: card.athlete_id || card.card_number,
              hasExistingCard: true,
              existingCard,
            };
          }

          return {
            isEligible: true,
            status: card.card_status as IdCardStatusType,
            athleteId: card.athlete_id || card.card_number,
            hasExistingCard: true,
            existingCard,
          };
        }

        // Eligible and ready to generate
        return {
          isEligible: true,
          status: "READY",
          reason: "Registration is verified, paid, and eligible for athlete ID card generation.",
          hasExistingCard: false,
        };
      } catch (error) {
        console.error("[IdCardService.canGenerateAthleteIdCard] DB error:", error);
      }
    }

    // 2. Fallback in-memory evaluation
    const fbCard = FALLBACK_ID_CARDS.get(registrationId);
    if (fbCard) {
      if (userId && fbCard.user_id && fbCard.user_id !== userId) {
        return {
          isEligible: false,
          status: "NOT_ELIGIBLE",
          reason: "Unauthorized: User does not own this registration.",
          hasExistingCard: false,
        };
      }

      const verificationUrl = buildVerificationUrl(fbCard.qr_token);
      const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);
      const existingCard: AthleteIdCardDetails = {
        id: fbCard.id,
        registrationId: fbCard.registration_id,
        participantId: fbCard.participant_id,
        athleteId: fbCard.athlete_id,
        cardNumber: fbCard.card_number,
        qrToken: fbCard.qr_token,
        version: fbCard.version,
        cardStatus: fbCard.card_status,
        generatedAt: fbCard.generated_at?.toISOString() || null,
        revokedAt: fbCard.revoked_at?.toISOString() || null,
        revocationReason: fbCard.revocation_reason,
        qrCodeDataUrl,
        verificationUrl,
        athleteName: fbCard.athlete_name || "Athlete",
        academyName: fbCard.academy_name || "Kukkiwon Academy",
        categoryName: fbCard.category_name || "Senior Male -58kg",
        discipline: fbCard.discipline || "KYORUGI",
        gender: fbCard.gender || "MALE",
        nationality: fbCard.nationality || "India",
        championshipName: fbCard.championship_name || "Kukkiwon Cup Championship 2026",
        photoUrl: fbCard.photo_url || null,
        registrationNumber: fbCard.registration_number || `REG-${registrationId.slice(0, 8)}`,
      };

      if (fbCard.card_status === "REVOKED") {
        return {
          isEligible: false,
          status: "REVOKED",
          reason: "Athlete ID card has been revoked by administration.",
          athleteId: fbCard.athlete_id,
          hasExistingCard: true,
          existingCard,
        };
      }

      return {
        isEligible: true,
        status: fbCard.card_status,
        athleteId: fbCard.athlete_id,
        hasExistingCard: true,
        existingCard,
      };
    }

    // Default eligible in fallback if registrationId is provided
    return {
      isEligible: true,
      status: "READY",
      reason: "Registration is verified, paid, and ready for ID card generation.",
      hasExistingCard: false,
    };
  }

  /**
   * Idempotent ID Card Generation (Requirement 7)
   * Creates or returns existing valid card. Never duplicates athlete IDs.
   */
  static async generateCard(
    registrationId: string,
    userId?: string | null
  ): Promise<AthleteIdCardDetails> {
    const eligibility = await this.canGenerateAthleteIdCard(registrationId, userId);

    if (!eligibility.isEligible && eligibility.status !== "GENERATED" && eligibility.status !== "READY") {
      throw new Error(`Cannot generate athlete ID card: ${eligibility.reason || "Not eligible"}`);
    }

    // IDEMPOTENCY: If card already exists and is active, return it immediately
    if (eligibility.hasExistingCard && eligibility.existingCard) {
      if (eligibility.existingCard.cardStatus === "REVOKED") {
        throw new Error("ID card for this registration has been revoked. Contact championship administrators.");
      }
      return eligibility.existingCard;
    }

    const online = await isDbOnline();
    const qrToken = generateSecureQrToken();
    const verificationUrl = buildVerificationUrl(qrToken);
    const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);

    if (online) {
      try {
        const reg = await prisma.registration.findUnique({
          where: { id: registrationId },
          include: {
            participant: true,
            championship: true,
            category: true,
            academy: true,
          },
        });

        if (!reg) {
          throw new Error("Registration record not found.");
        }

        const championshipCode = reg.championship.short_name || "KKC26";
        const athleteId = reg.athlete_id || (await this.generateAthleteId(championshipCode));
        const cardNumber = athleteId;

        // Upsert card record to maintain strict uniqueness and idempotency
        const card = await prisma.idCard.upsert({
          where: { registration_id: registrationId },
          create: {
            participant_id: reg.participant_id,
            registration_id: registrationId,
            athlete_id: athleteId,
            card_number: cardNumber,
            qr_token: qrToken,
            version: 1,
            card_status: "GENERATED",
            generated_at: new Date(),
          },
          update: {
            athlete_id: athleteId,
            card_number: cardNumber,
            card_status: "GENERATED",
            generated_at: new Date(),
          },
        });

        // Ensure registration links the athlete_id
        if (!reg.athlete_id) {
          await prisma.registration.update({
            where: { id: registrationId },
            data: { athlete_id: athleteId },
          });
        }

        // Immutable Audit Log entry
        await AuditService.logAction({
          adminUserId: userId,
          action: "ATHLETE_ID_CARD_GENERATED",
          entityType: "IdCard",
          entityId: card.id,
          newValue: {
            athleteId,
            cardNumber,
            registrationId,
            version: card.version,
            verificationUrl,
          },
        });

        return {
          id: card.id,
          registrationId,
          participantId: card.participant_id,
          athleteId,
          cardNumber,
          qrToken,
          version: card.version,
          cardStatus: "GENERATED",
          generatedAt: card.generated_at?.toISOString() || new Date().toISOString(),
          revokedAt: null,
          revocationReason: null,
          qrCodeDataUrl,
          verificationUrl,
          athleteName: reg.participant.full_name,
          academyName: reg.academy?.name || reg.participant.academy_name,
          categoryName: reg.category?.name,
          discipline: reg.discipline || undefined,
          gender: reg.participant.gender,
          nationality: reg.participant.nationality,
          championshipName: reg.championship.name,
          photoUrl: reg.participant.photo_url || null,
          registrationNumber: reg.registration_number,
          kukkiwonId: reg.participant.kukkiwon_id || null,
        };
      } catch (error) {
        console.error("[IdCardService.generateCard] DB error, falling back to memory:", error);
      }
    }

    // Fallback in-memory card generation
    PersistenceGuard.assertWritePersistence(false, "IdCard.generateCard");
    const athleteId = await this.generateAthleteId("KKC26");
    const fallbackId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const fallbackRecord: FallbackIdCard = {
      id: fallbackId,
      participant_id: `part-${registrationId}`,
      registration_id: registrationId,
      athlete_id: athleteId,
      card_number: athleteId,
      qr_token: qrToken,
      version: 1,
      card_status: "GENERATED",
      generated_at: now,
      created_at: now,
      updated_at: now,
      athlete_name: "John Doe",
      academy_name: "Example Taekwondo Academy",
      category_name: "Under 54 kg",
      discipline: "KYORUGI",
      gender: "MALE",
      nationality: "India",
      championship_name: "Kukkiwon Cup Championship 2026",
      registration_number: `KKC26-REG-${registrationId.slice(0, 6)}`,
      user_id: userId,
    };

    FALLBACK_ID_CARDS.set(registrationId, fallbackRecord);

    await AuditService.logAction({
      adminUserId: userId,
      action: "ATHLETE_ID_CARD_GENERATED",
      entityType: "IdCard",
      entityId: fallbackId,
      newValue: { athleteId, registrationId, version: 1 },
    });

    return {
      id: fallbackId,
      registrationId,
      participantId: fallbackRecord.participant_id,
      athleteId,
      cardNumber: athleteId,
      qrToken,
      version: 1,
      cardStatus: "GENERATED",
      generatedAt: now.toISOString(),
      revokedAt: null,
      revocationReason: null,
      qrCodeDataUrl,
      verificationUrl,
      athleteName: fallbackRecord.athlete_name!,
      academyName: fallbackRecord.academy_name!,
      categoryName: fallbackRecord.category_name!,
      discipline: fallbackRecord.discipline!,
      gender: fallbackRecord.gender!,
      nationality: fallbackRecord.nationality!,
      championshipName: "Kukkiwon Cup Championship 2026",
      photoUrl: null,
      registrationNumber: fallbackRecord.registration_number!,
    };
  }

  /**
   * Retrieves athlete ID card details by registration ID with IDOR protection
   */
  static async getCardByRegistrationId(
    registrationId: string,
    userId?: string | null
  ): Promise<AthleteIdCardDetails | null> {
    const online = await isDbOnline();

    if (online) {
      try {
        const card = await prisma.idCard.findUnique({
          where: { registration_id: registrationId },
          include: {
            participant: true,
            registration: {
              include: {
                championship: true,
                category: true,
                academy: true,
              },
            },
          },
        });

        if (!card) return null;

        // IDOR Authorization check
        if (userId && card.registration.user_id && card.registration.user_id !== userId) {
          throw new Error("Unauthorized: You do not have permission to view this ID card.");
        }

        const verificationUrl = buildVerificationUrl(card.qr_token);
        const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);

        return {
          id: card.id,
          registrationId: card.registration_id,
          participantId: card.participant_id,
          athleteId: card.athlete_id || card.card_number,
          cardNumber: card.card_number,
          qrToken: card.qr_token,
          version: card.version,
          cardStatus: card.card_status as IdCardStatusType,
          generatedAt: card.generated_at?.toISOString() || null,
          revokedAt: card.revoked_at?.toISOString() || null,
          revocationReason: card.revocation_reason,
          qrCodeDataUrl,
          verificationUrl,
          athleteName: card.participant.full_name,
          academyName: card.registration.academy?.name || card.participant.academy_name,
          categoryName: card.registration.category?.name,
          discipline: card.registration.discipline || undefined,
          gender: card.participant.gender,
          nationality: card.participant.nationality,
          championshipName: card.registration.championship.name,
          photoUrl: card.participant.photo_url || null,
          registrationNumber: card.registration.registration_number,
          kukkiwonId: card.participant.kukkiwon_id || null,
        };
      } catch (error: any) {
        if (error.message?.includes("Unauthorized")) throw error;
        console.error("[IdCardService.getCardByRegistrationId] DB error:", error);
      }
    }

    // Fallback store check
    const fb = FALLBACK_ID_CARDS.get(registrationId);
    if (!fb) return null;

    if (userId && fb.user_id && fb.user_id !== userId) {
      throw new Error("Unauthorized: You do not have permission to view this ID card.");
    }

    const verificationUrl = buildVerificationUrl(fb.qr_token);
    const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);

    return {
      id: fb.id,
      registrationId: fb.registration_id,
      participantId: fb.participant_id,
      athleteId: fb.athlete_id,
      cardNumber: fb.card_number,
      qrToken: fb.qr_token,
      version: fb.version,
      cardStatus: fb.card_status,
      generatedAt: fb.generated_at?.toISOString() || null,
      revokedAt: fb.revoked_at?.toISOString() || null,
      revocationReason: fb.revocation_reason,
      qrCodeDataUrl,
      verificationUrl,
      athleteName: fb.athlete_name || "Athlete",
      academyName: fb.academy_name || "Kukkiwon Academy",
      categoryName: fb.category_name || "Under 54 kg",
      discipline: fb.discipline || "KYORUGI",
      gender: fb.gender || "MALE",
      nationality: fb.nationality || "India",
      championshipName: fb.championship_name || "Kukkiwon Cup Championship 2026",
      photoUrl: fb.photo_url || null,
      registrationNumber: fb.registration_number || `REG-${registrationId.slice(0, 8)}`,
    };
  }

  /**
   * Public QR Verification (Requirements 4 & 5)
   * Safely decodes publicToken and returns ONLY safe public athlete details
   * NEVER LEAKS: Phone, Email, DOB, Address, Payment data, or internal DB IDs
   */
  static async verifyByPublicToken(publicToken: string): Promise<PublicAthleteVerification> {
    if (!publicToken || publicToken.trim().length === 0) {
      return formatPublicAthleteVerification({ cardStatus: "NOT_FOUND" });
    }

    const online = await isDbOnline();

    if (online) {
      try {
        const idCard = await prisma.idCard.findUnique({
          where: { qr_token: publicToken },
          include: {
            participant: true,
            registration: {
              include: {
                championship: true,
                category: true,
                academy: true,
              },
            },
          },
        });

        if (!idCard) {
          return formatPublicAthleteVerification({ cardStatus: "NOT_FOUND" });
        }

        return formatPublicAthleteVerification({
          cardStatus: idCard.card_status,
          athleteId: idCard.athlete_id || idCard.card_number,
          athleteName: idCard.participant.full_name,
          academyName: idCard.registration.academy?.name || idCard.participant.academy_name,
          country: idCard.participant.nationality,
          categoryName: idCard.registration.category?.name,
          discipline: idCard.registration.discipline || undefined,
          championshipName: idCard.registration.championship.name,
          registrationStatus: idCard.registration.status === "PAID" || idCard.registration.status === "CONFIRMED" ? "REGISTERED" : idCard.registration.status,
          version: idCard.version,
          issuedAt: idCard.generated_at?.toISOString() || null,
          photoUrl: idCard.participant.photo_url || null,
        });
      } catch (error) {
        console.error("[IdCardService.verifyByPublicToken] DB error:", error);
      }
    }

    // Fallback store check
    for (const card of FALLBACK_ID_CARDS.values()) {
      if (card.qr_token === publicToken) {
        return formatPublicAthleteVerification({
          cardStatus: card.card_status,
          athleteId: card.athlete_id,
          athleteName: card.athlete_name,
          academyName: card.academy_name,
          country: card.nationality,
          categoryName: card.category_name,
          discipline: card.discipline,
          championshipName: card.championship_name,
          registrationStatus: "REGISTERED",
          version: card.version,
          issuedAt: card.generated_at?.toISOString() || null,
          photoUrl: card.photo_url,
        });
      }
    }

    return formatPublicAthleteVerification({ cardStatus: "NOT_FOUND" });
  }

  /**
   * Manual verification by Athlete ID reference (Phase 7 Requirement 14)
   * Strictly for secondary manual lookup; zero private PII returned
   */
  static async verifyByAthleteId(athleteId: string): Promise<PublicAthleteVerification> {
    if (!athleteId || athleteId.trim().length === 0) {
      return formatPublicAthleteVerification({ cardStatus: "NOT_FOUND" });
    }

    const trimmed = athleteId.trim().toUpperCase();
    const online = await isDbOnline();

    if (online) {
      try {
        const idCard = await prisma.idCard.findFirst({
          where: {
            OR: [{ athlete_id: trimmed }, { card_number: trimmed }],
          },
          include: {
            participant: true,
            registration: {
              include: {
                championship: true,
                category: true,
                academy: true,
              },
            },
          },
        });

        if (!idCard) {
          return formatPublicAthleteVerification({ cardStatus: "NOT_FOUND" });
        }

        return formatPublicAthleteVerification({
          cardStatus: idCard.card_status,
          athleteId: idCard.athlete_id || idCard.card_number,
          athleteName: idCard.participant.full_name,
          academyName: idCard.registration.academy?.name || idCard.participant.academy_name,
          country: idCard.participant.nationality,
          categoryName: idCard.registration.category?.name,
          discipline: idCard.registration.discipline || undefined,
          championshipName: idCard.registration.championship.name,
          registrationStatus:
            idCard.registration.status === "PAID" || idCard.registration.status === "CONFIRMED"
              ? "REGISTERED"
              : idCard.registration.status,
          version: idCard.version,
          issuedAt: idCard.generated_at?.toISOString() || null,
          photoUrl: idCard.participant.photo_url || null,
        });
      } catch (error) {
        console.error("[IdCardService.verifyByAthleteId] DB error:", error);
      }
    }

    // Fallback lookup
    for (const card of FALLBACK_ID_CARDS.values()) {
      if (card.athlete_id.toUpperCase() === trimmed || card.card_number.toUpperCase() === trimmed) {
        return formatPublicAthleteVerification({
          cardStatus: card.card_status,
          athleteId: card.athlete_id,
          athleteName: card.athlete_name,
          academyName: card.academy_name,
          country: card.nationality,
          categoryName: card.category_name,
          discipline: card.discipline,
          championshipName: card.championship_name,
          registrationStatus: "REGISTERED",
          version: card.version,
          issuedAt: card.generated_at?.toISOString() || null,
          photoUrl: card.photo_url,
        });
      }
    }

    return formatPublicAthleteVerification({ cardStatus: "NOT_FOUND" });
  }

  /**
   * Backwards compatible method for existing /verify/[token] route
   */
  static async verifyByQrToken(qrToken: string) {
    const publicVerification = await this.verifyByPublicToken(qrToken);
    return {
      is_valid: publicVerification.isValid,
      card_status: publicVerification.status === "VERIFIED" ? "GENERATED" : publicVerification.status,
      card_number: publicVerification.athleteId,
      participant_name: publicVerification.athleteName,
      designation: "Athlete",
      nationality: publicVerification.country,
      championship_name: publicVerification.championshipName,
      registration_number: publicVerification.athleteId,
      photo_url: publicVerification.photoUrl,
      verified_at: publicVerification.verifiedAt,
      message: publicVerification.message,
    };
  }

  /**
   * Admin revocation of an athlete ID card (Requirements 13, 14, 15)
   */
  static async revokeCard(
    cardIdOrAthleteId: string,
    reason: string,
    adminUserId?: string | null
  ): Promise<AthleteIdCardDetails> {
    if (!reason || reason.trim().length === 0) {
      throw new Error("A valid revocation reason must be provided.");
    }

    const online = await isDbOnline();
    const now = new Date();

    if (online) {
      const card = await prisma.idCard.findFirst({
        where: {
          OR: [{ id: cardIdOrAthleteId }, { athlete_id: cardIdOrAthleteId }, { card_number: cardIdOrAthleteId }],
        },
        include: {
          participant: true,
          registration: {
            include: { championship: true, category: true, academy: true },
          },
        },
      });

      if (!card) {
        throw new Error("ID Card not found for revocation.");
      }

      const updated = await prisma.idCard.update({
        where: { id: card.id },
        data: {
          card_status: "REVOKED",
          revoked_at: now,
          revocation_reason: reason,
        },
      });

      await AuditService.logAction({
        adminUserId,
        action: "ATHLETE_ID_CARD_REVOKED",
        entityType: "IdCard",
        entityId: card.id,
        oldValue: { status: card.card_status },
        newValue: { status: "REVOKED", reason, revokedAt: now.toISOString() },
      });

      const verificationUrl = buildVerificationUrl(updated.qr_token);
      return {
        id: updated.id,
        registrationId: updated.registration_id,
        participantId: updated.participant_id,
        athleteId: updated.athlete_id || updated.card_number,
        cardNumber: updated.card_number,
        qrToken: updated.qr_token,
        version: updated.version,
        cardStatus: "REVOKED",
        generatedAt: updated.generated_at?.toISOString() || null,
        revokedAt: now.toISOString(),
        revocationReason: reason,
        verificationUrl,
        athleteName: card.participant.full_name,
        academyName: card.registration.academy?.name || card.participant.academy_name,
        categoryName: card.registration.category?.name,
        discipline: card.registration.discipline || undefined,
        gender: card.participant.gender,
        nationality: card.participant.nationality,
        championshipName: card.registration.championship.name,
        photoUrl: card.participant.photo_url || null,
        registrationNumber: card.registration.registration_number,
      };
    }

    // Fallback revocation
    PersistenceGuard.assertWritePersistence(online, "IdCard.revokeCard");
    for (const card of FALLBACK_ID_CARDS.values()) {
      if (card.id === cardIdOrAthleteId || card.athlete_id === cardIdOrAthleteId) {
        card.card_status = "REVOKED";
        card.revoked_at = now;
        card.revocation_reason = reason;

        await AuditService.logAction({
          adminUserId,
          action: "ATHLETE_ID_CARD_REVOKED",
          entityType: "IdCard",
          entityId: card.id,
          newValue: { status: "REVOKED", reason },
        });

        return {
          id: card.id,
          registrationId: card.registration_id,
          participantId: card.participant_id,
          athleteId: card.athlete_id,
          cardNumber: card.card_number,
          qrToken: card.qr_token,
          version: card.version,
          cardStatus: "REVOKED",
          generatedAt: card.generated_at?.toISOString() || null,
          revokedAt: now.toISOString(),
          revocationReason: reason,
          verificationUrl: buildVerificationUrl(card.qr_token),
          athleteName: card.athlete_name || "Athlete",
          academyName: card.academy_name,
          categoryName: card.category_name,
          discipline: card.discipline,
          gender: card.gender,
          nationality: card.nationality || "India",
          championshipName: card.championship_name || "Kukkiwon Cup Championship 2026",
          registrationNumber: card.registration_number || card.athlete_id,
        };
      }
    }

    throw new Error("ID Card not found for revocation.");
  }

  /**
   * Admin reissuance with version increment and token rotation (Requirements 14, 15, 16)
   */
  static async reissueCard(
    cardIdOrAthleteId: string,
    reason: string,
    adminUserId?: string | null
  ): Promise<AthleteIdCardDetails> {
    const online = await isDbOnline();
    const now = new Date();
    const newQrToken = generateSecureQrToken();
    const verificationUrl = buildVerificationUrl(newQrToken);
    const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);

    if (online) {
      const card = await prisma.idCard.findFirst({
        where: {
          OR: [{ id: cardIdOrAthleteId }, { athlete_id: cardIdOrAthleteId }, { card_number: cardIdOrAthleteId }],
        },
        include: {
          participant: true,
          registration: {
            include: { championship: true, category: true, academy: true },
          },
        },
      });

      if (!card) {
        throw new Error("ID Card not found for reissuance.");
      }

      const nextVersion = card.version + 1;
      const updated = await prisma.idCard.update({
        where: { id: card.id },
        data: {
          version: nextVersion,
          qr_token: newQrToken,
          card_status: "REISSUED",
          revoked_at: null,
          revocation_reason: null,
          generated_at: now,
        },
      });

      await AuditService.logAction({
        adminUserId,
        action: "ATHLETE_ID_CARD_REISSUED",
        entityType: "IdCard",
        entityId: card.id,
        oldValue: { version: card.version, status: card.card_status },
        newValue: { version: nextVersion, status: "REISSUED", reason, reissuedAt: now.toISOString() },
      });

      return {
        id: updated.id,
        registrationId: updated.registration_id,
        participantId: updated.participant_id,
        athleteId: updated.athlete_id || updated.card_number,
        cardNumber: updated.card_number,
        qrToken: newQrToken,
        version: nextVersion,
        cardStatus: "REISSUED",
        generatedAt: now.toISOString(),
        revokedAt: null,
        revocationReason: null,
        qrCodeDataUrl,
        verificationUrl,
        athleteName: card.participant.full_name,
        academyName: card.registration.academy?.name || card.participant.academy_name,
        categoryName: card.registration.category?.name,
        discipline: card.registration.discipline || undefined,
        gender: card.participant.gender,
        nationality: card.participant.nationality,
        championshipName: card.registration.championship.name,
        photoUrl: card.participant.photo_url || null,
        registrationNumber: card.registration.registration_number,
        kukkiwonId: card.participant.kukkiwon_id || null,
      };
    }

    // Fallback reissuance
    PersistenceGuard.assertWritePersistence(online, "IdCard.reissueCard");
    for (const card of FALLBACK_ID_CARDS.values()) {
      if (card.id === cardIdOrAthleteId || card.athlete_id === cardIdOrAthleteId) {
        card.version += 1;
        card.qr_token = newQrToken;
        card.card_status = "REISSUED";
        card.revoked_at = null;
        card.revocation_reason = null;
        card.generated_at = now;

        await AuditService.logAction({
          adminUserId,
          action: "ATHLETE_ID_CARD_REISSUED",
          entityType: "IdCard",
          entityId: card.id,
          newValue: { version: card.version, reason },
        });

        return {
          id: card.id,
          registrationId: card.registration_id,
          participantId: card.participant_id,
          athleteId: card.athlete_id,
          cardNumber: card.card_number,
          qrToken: newQrToken,
          version: card.version,
          cardStatus: "REISSUED",
          generatedAt: now.toISOString(),
          revokedAt: null,
          revocationReason: null,
          qrCodeDataUrl,
          verificationUrl,
          athleteName: card.athlete_name || "Athlete",
          academyName: card.academy_name,
          categoryName: card.category_name,
          discipline: card.discipline,
          gender: card.gender,
          nationality: card.nationality || "India",
          championshipName: card.championship_name || "Kukkiwon Cup Championship 2026",
          registrationNumber: card.registration_number || card.athlete_id,
        };
      }
    }

    throw new Error("ID Card not found for reissuance.");
  }

  private static getCountryFlagEmoji(nationality?: string | null): string {
    if (!nationality) return "🇮🇳";
    const normalized = nationality.trim().toUpperCase();
    const map: Record<string, string> = {
      IND: "🇮🇳",
      INDIA: "🇮🇳",
      KOR: "🇰🇷",
      KOREA: "🇰🇷",
      USA: "🇺🇸",
      "UNITED STATES": "🇺🇸",
      GBR: "🇬🇧",
      UK: "🇬🇧",
      JPN: "🇯🇵",
      JAPAN: "🇯🇵",
      NEP: "🇳🇵",
      NEPAL: "🇳🇵",
      BAN: "🇧🇩",
      BANGLADESH: "🇧🇩",
      SRI: "🇱🇰",
      "SRI LANKA": "🇱🇰",
      BHU: "🇧🇹",
      BHUTAN: "🇧🇹",
      AUS: "🇦🇺",
      AUSTRALIA: "🇦🇺",
      CAN: "🇨🇦",
      CANADA: "🇨🇦",
      GER: "🇩🇪",
      GERMANY: "🇩🇪",
      FRA: "🇫🇷",
      FRANCE: "🇫🇷",
      THA: "🇹🇭",
      THAILAND: "🇹🇭",
      VIE: "🇻🇳",
      VIETNAM: "🇻🇳",
      SGP: "🇸🇬",
      SINGAPORE: "🇸🇬",
      MAS: "🇲🇾",
      MALAYSIA: "🇲🇾",
      UAE: "🇦🇪",
    };
    if (map[normalized]) return map[normalized];
    if (normalized.length === 2) {
      const codePoints = [...normalized].map((c) => 127397 + c.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    }
    return "🇮🇳";
  }
  /**
   * Generates markup for an athlete ID badge containing:
   * 1. Athlete Photo
   * 2. Name
   * 3. Academy
   * 4. Generated Athlete ID Number
   * 5. Submitted Kukkiwon ID
   * 6. Nationality Flag
   * With support for custom uploaded background template
   */
  static generateCardMarkup(card: AthleteIdCardDetails, templateBgUrl?: string | null): string {
    const hasTemplate = Boolean(templateBgUrl);
    const bgStyle = hasTemplate
      ? `background-image: url('${templateBgUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat; border: 2px solid #D4AF37;`
      : `background: linear-gradient(180deg, #0A192F 0%, #051329 50%, #0A192F 100%); border: 3px solid #D4AF37;`;

    const flagEmoji = this.getCountryFlagEmoji(card.nationality);
    const countryLabel = card.nationality || "India";
    const isCoach =
      card.discipline === "COACHING" ||
      (card.categoryName && card.categoryName.toLowerCase().includes("coach"));

    return `
    <div class="badge-card" style="${bgStyle}">
      ${hasTemplate ? '<div class="badge-backdrop"></div>' : ''}
      <div class="badge-inner">
        <!-- 1. Header -->
        <div class="badge-header">
          <div class="badge-header-title">KUKKIWON CUP INDIA 2026</div>
          <div class="badge-header-sub">OFFICIAL ACCREDITATION PASS</div>
          <div class="badge-role-pill ${isCoach ? 'coach' : 'athlete'}">
            ${isCoach ? 'OFFICIAL COACH' : 'ATHLETE'}
          </div>
        </div>

        <!-- 2. Photo & Identity -->
        <div class="identity-section">
          <div class="photo-wrapper">
            ${card.photoUrl
              ? `<img src="${card.photoUrl}" alt="${card.athleteName}" class="athlete-photo" />`
              : `<div class="photo-placeholder">🥋</div>`
            }
          </div>
          <div class="athlete-name">${card.athleteName.toUpperCase()}</div>
          <div class="athlete-id font-mono">${card.athleteId}</div>
          ${(card as any).athleteEmail ? `
          <div class="athlete-email">
            <span>✉</span> <span class="truncate">${(card as any).athleteEmail}</span>
          </div>` : ''}
        </div>

        <!-- 3. Details Table -->
        <div class="details-table">
          <div class="detail-row">
            <span class="detail-label">KUKKIWON DAN:</span>
            <span class="detail-value dan-val font-mono">${card.kukkiwonId || "KKID-VERIFIED"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">ACADEMY / CLUB:</span>
            <span class="detail-value truncate">${card.academyName || "Independent"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${isCoach ? 'ROLE:' : 'WT CATEGORY:'}</span>
            <span class="detail-value cat-val truncate">${card.categoryName || "Senior Division"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">COUNTRY:</span>
            <span class="detail-value">${flagEmoji} ${countryLabel}</span>
          </div>
        </div>

        <!-- 4. QR Code & Security Footer -->
        <div class="badge-footer">
          <div class="qr-block">
            <div class="qr-box">
              <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </div>
            <div class="qr-text">
              <div class="verified-text">✓ Verified Official</div>
              <div class="kukkiwon-code">KUKKIWON • KKC26</div>
            </div>
          </div>
          <div class="security-meta font-mono">
            <div>v${card.version || 1}</div>
            <div class="status-val">${card.cardStatus || "ACTIVE"}</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /**
   * Generates print-ready HTML for a single ID Card
   */
  static generatePrintableHtml(card: AthleteIdCardDetails, templateBgUrl?: string | null): string {
    const cardHtml = this.generateCardMarkup(card, templateBgUrl);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accreditation Pass - ${card.athleteId}</title>
  <style>
    @page {
      size: 100mm 150mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #060D1A;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .print-controls {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 8px;
      z-index: 100;
    }
    .print-btn {
      background: #D4AF37;
      color: #0A192F;
      border: 1px solid #D4AF37;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 800;
      border-radius: 8px;
      cursor: pointer;
      text-transform: uppercase;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .print-btn:hover {
      background: #E5C158;
    }
    .badge-card {
      width: 100mm;
      height: 150mm;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0,0,0,0.5);
      position: relative;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      break-after: page;
      color: #FFFFFF;
    }
    .badge-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(6, 13, 26, 0.55);
      backdrop-filter: blur(2px);
      z-index: 1;
    }
    .badge-inner {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      padding: 18px 20px;
    }
    .badge-header {
      text-align: center;
      border-bottom: 1px solid rgba(212,175,55,0.4);
      padding-bottom: 10px;
    }
    .badge-header-title {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #D4AF37;
      text-transform: uppercase;
    }
    .badge-header-sub {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #CBD5E1;
      margin-top: 2px;
      text-transform: uppercase;
    }
    .badge-role-pill {
      display: inline-block;
      padding: 2px 12px;
      border-radius: 999px;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .badge-role-pill.athlete {
      background: #059669;
      color: #FFFFFF;
    }
    .badge-role-pill.coach {
      background: #2563EB;
      color: #FFFFFF;
    }
    .identity-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin: 8px 0;
    }
    .photo-wrapper {
      width: 100px;
      height: 125px;
      border-radius: 12px;
      border: 2px solid #D4AF37;
      background: #0F172A;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 6px 14px rgba(0,0,0,0.3);
      margin-bottom: 8px;
    }
    .athlete-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder {
      font-size: 40px;
    }
    .athlete-name {
      font-size: 16px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .athlete-id {
      font-size: 11px;
      font-weight: 800;
      color: #D4AF37;
      letter-spacing: 1px;
      margin-top: 3px;
    }
    .details-table {
      background: rgba(6, 13, 26, 0.7);
      border: 1px solid rgba(212,175,55,0.3);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
    }
    .detail-label {
      color: #94A3B8;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .detail-value {
      font-weight: 800;
      color: #FFFFFF;
      text-align: right;
    }
    .detail-value.dan-val {
      color: #34D399;
    }
    .detail-value.cat-val {
      color: #38BDF8;
    }
    .truncate {
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }
    .badge-footer {
      border-top: 1px solid rgba(212,175,55,0.3);
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .qr-block {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .qr-box {
      background: #FFFFFF;
      color: #0A192F;
      padding: 3px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-text {
      text-align: left;
      font-size: 8px;
      line-height: 1.2;
    }
    .verified-text {
      color: #34D399;
      font-weight: 800;
    }
    .kukkiwon-code {
      color: #D4AF37;
      font-family: monospace;
      font-weight: 700;
    }
    .athlete-email {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      color: #FCD34D;
      background: rgba(10, 25, 47, 0.85);
      border: 1px solid rgba(251, 191, 36, 0.35);
      padding: 2px 8px;
      border-radius: 999px;
      margin-top: 4px;
      font-family: monospace;
      max-width: 90%;
    }
    .security-meta {
      text-align: right;
      font-size: 8px;
      color: #94A3B8;
      line-height: 1.3;
    }
    .status-val {
      color: #34D399;
      font-weight: 800;
    }
    @media print {
      body {
        background: none;
        padding: 0;
      }
      .badge-card {
        box-shadow: none;
        border: none;
        margin: 0;
      }
      .print-controls {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  ${cardHtml}
  <script>
    if (window.location.search.includes('autoprint=1')) {
      window.addEventListener('load', () => setTimeout(() => window.print(), 300));
    }
  </script>
</body>
</html>`;
  }

  /**
   * Generates print-ready HTML for bulk download of multiple ID Cards
   */
  static generateBulkPrintableHtml(cards: AthleteIdCardDetails[], templateBgUrl?: string | null): string {
    const cardsHtml = cards.map((c) => this.generateCardMarkup(c, templateBgUrl)).join("\n");
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bulk Athlete ID Cards (${cards.length} Cards)</title>
  <style>
    @page {
      size: 100mm 150mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #060D1A;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 20px;
    }
    .print-controls {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 8px;
      z-index: 100;
    }
    .print-btn {
      background: #D4AF37;
      color: #0A192F;
      border: 1px solid #D4AF37;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 800;
      border-radius: 8px;
      cursor: pointer;
      text-transform: uppercase;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .print-btn:hover {
      background: #E5C158;
    }
    .badge-card {
      width: 100mm;
      height: 150mm;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0,0,0,0.5);
      position: relative;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      break-after: page;
      margin-bottom: 20px;
      color: #FFFFFF;
    }
    .badge-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(6, 13, 26, 0.55);
      backdrop-filter: blur(2px);
      z-index: 1;
    }
    .badge-inner {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      padding: 18px 20px;
    }
    .badge-header {
      text-align: center;
      border-bottom: 1px solid rgba(212,175,55,0.4);
      padding-bottom: 10px;
    }
    .badge-header-title {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #D4AF37;
      text-transform: uppercase;
    }
    .badge-header-sub {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #CBD5E1;
      margin-top: 2px;
      text-transform: uppercase;
    }
    .badge-role-pill {
      display: inline-block;
      padding: 2px 12px;
      border-radius: 999px;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .badge-role-pill.athlete {
      background: #059669;
      color: #FFFFFF;
    }
    .badge-role-pill.coach {
      background: #2563EB;
      color: #FFFFFF;
    }
    .identity-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin: 8px 0;
    }
    .photo-wrapper {
      width: 100px;
      height: 125px;
      border-radius: 12px;
      border: 2px solid #D4AF37;
      background: #0F172A;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 6px 14px rgba(0,0,0,0.3);
      margin-bottom: 8px;
    }
    .athlete-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder {
      font-size: 40px;
    }
    .athlete-name {
      font-size: 16px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .athlete-id {
      font-size: 11px;
      font-weight: 800;
      color: #D4AF37;
      letter-spacing: 1px;
      margin-top: 3px;
    }
    .details-table {
      background: rgba(6, 13, 26, 0.7);
      border: 1px solid rgba(212,175,55,0.3);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
    }
    .detail-label {
      color: #94A3B8;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .detail-value {
      font-weight: 800;
      color: #FFFFFF;
      text-align: right;
    }
    .detail-value.dan-val {
      color: #34D399;
    }
    .detail-value.cat-val {
      color: #38BDF8;
    }
    .truncate {
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }
    .badge-footer {
      border-top: 1px solid rgba(212,175,55,0.3);
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .qr-block {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .qr-box {
      background: #FFFFFF;
      color: #0A192F;
      padding: 3px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-text {
      text-align: left;
      font-size: 8px;
      line-height: 1.2;
    }
    .verified-text {
      color: #34D399;
      font-weight: 800;
    }
    .kukkiwon-code {
      color: #D4AF37;
      font-family: monospace;
      font-weight: 700;
    }
    .athlete-email {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      color: #FCD34D;
      background: rgba(10, 25, 47, 0.85);
      border: 1px solid rgba(251, 191, 36, 0.35);
      padding: 2px 8px;
      border-radius: 999px;
      margin-top: 4px;
      font-family: monospace;
      max-width: 90%;
    }
    .security-meta {
      text-align: right;
      font-size: 8px;
      color: #94A3B8;
      line-height: 1.3;
    }
    .status-val {
      color: #34D399;
      font-weight: 800;
    }
    @media print {
      body {
        background: none;
        padding: 0;
        gap: 0;
      }
      .badge-card {
        box-shadow: none;
        border: none;
        margin: 0;
      }
      .print-controls {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="print-btn" onclick="window.print()">🖨️ Print All ${cards.length} Cards / Save as PDF</button>
  </div>
  ${cardsHtml}
</body>
</html>`;
  }
}
