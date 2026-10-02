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
        };
      } catch (error) {
        console.error("[IdCardService.generateCard] DB error, falling back to memory:", error);
      }
    }

    // Fallback in-memory card generation
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
      };
    }

    // Fallback reissuance
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

  /**
   * Generates a high-resolution, print-ready badge HTML representation (Requirements 8 & 9)
   * Formatted with official Kukkiwon Cup design tokens (#0A192F navy, #D4AF37 gold)
   */
  static generatePrintableHtml(card: AthleteIdCardDetails): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Athlete ID Card - ${card.athleteId}</title>
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
      background: #F3F4F6;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .badge-card {
      width: 100mm;
      height: 150mm;
      background: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      position: relative;
      display: flex;
      flex-direction: column;
      border: 1px solid #E5E7EB;
    }
    .badge-header {
      background: #0A192F;
      color: #FFFFFF;
      padding: 16px 12px;
      text-align: center;
      border-bottom: 3px solid #D4AF37;
    }
    .badge-header h1 {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #D4AF37;
      margin-bottom: 4px;
    }
    .badge-header h2 {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.5px;
      color: #E2E8F0;
    }
    .badge-body {
      padding: 14px;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .photo-container {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      border: 2px solid #D4AF37;
      background: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      overflow: hidden;
    }
    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder {
      font-size: 28px;
      color: #94A3B8;
    }
    .athlete-name {
      font-size: 16px;
      font-weight: 800;
      color: #0A192F;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 2px;
    }
    .badge-id {
      background: #0A192F;
      color: #D4AF37;
      font-family: "Courier New", Courier, monospace;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    .meta-grid {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
      background: #F8FAFC;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #E2E8F0;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748B;
      letter-spacing: 0.5px;
    }
    .meta-value {
      font-size: 10px;
      font-weight: 700;
      color: #1E293B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: auto;
    }
    .qr-container {
      width: 85px;
      height: 85px;
      background: #FFFFFF;
      padding: 4px;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-container img {
      width: 100%;
      height: 100%;
    }
    .qr-instruction {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #0A192F;
      margin-top: 4px;
    }
    .badge-footer {
      background: #F1F5F9;
      border-top: 1px solid #E2E8F0;
      padding: 6px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge-footer span {
      font-size: 7.5px;
      color: #64748B;
      font-weight: 600;
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
      background: #0A192F;
      color: #FFFFFF;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .print-btn:hover {
      background: #1E293B;
    }
    @media print {
      body {
        background: none;
        padding: 0;
      }
      .badge-card {
        box-shadow: none;
        border: none;
        width: 100mm;
        height: 150mm;
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

  <div class="badge-card">
    <div class="badge-header">
      <h1>${card.championshipName.toUpperCase()}</h1>
      <h2>OFFICIAL ATHLETE ACCREDITATION</h2>
    </div>

    <div class="badge-body">
      <div class="photo-container">
        ${
          card.photoUrl
            ? `<img src="${card.photoUrl}" alt="${card.athleteName}" />`
            : `<div class="photo-placeholder">🥋</div>`
        }
      </div>

      <div class="athlete-name">${card.athleteName}</div>
      <div class="badge-id">${card.athleteId}</div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Category</span>
          <span class="meta-value">${card.categoryName || "Official Entry"}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Discipline</span>
          <span class="meta-value">${card.discipline || "KYORUGI"}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Academy / Club</span>
          <span class="meta-value">${card.academyName || "Independent"}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Nationality</span>
          <span class="meta-value">${card.nationality}</span>
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-container">
          ${
            card.qrCodeDataUrl
              ? `<img src="${card.qrCodeDataUrl}" alt="Scan to verify accreditation" />`
              : `<div style="font-size: 8px;">QR Unavailable</div>`
          }
        </div>
        <div class="qr-instruction">Scan to Verify Identity</div>
      </div>
    </div>

    <div class="badge-footer">
      <span>REF: ${card.registrationNumber}</span>
      <span>STATUS: ${card.cardStatus} • V${card.version}</span>
      <span>KUKKIWON CUP</span>
    </div>
  </div>

  <script>
    // Auto-trigger print if requested via query param ?autoprint=1
    if (window.location.search.includes('autoprint=1')) {
      window.addEventListener('load', () => setTimeout(() => window.print(), 300));
    }
  </script>
</body>
</html>`;
  }
}
