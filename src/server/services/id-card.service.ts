// ==============================================================================
// ID CARD & QR VERIFICATION SERVICE (Requirements 13 & 14)
// High-entropy credential generation, revocation, and secure QR lookup
// ==============================================================================

import prisma from "@/lib/db";
import { generateSecureQrToken, formatPublicVerificationPayload } from "@/lib/qr";
import { IdCardStatus } from "@prisma/client";

export class IdCardService {
  /**
   * Generates a digital ID credential for a confirmed registration
   */
  static async generateCard(registrationId: string) {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { participant: true, championship: true },
    });

    if (!registration) {
      throw new Error("Registration not found");
    }

    if (registration.status !== "CONFIRMED" && registration.status !== "PAID") {
      throw new Error("Cannot generate ID card for unconfirmed/unpaid registration");
    }

    const qrToken = generateSecureQrToken();
    const cardNumber = `CARD-KC26-${Math.floor(10000 + Math.random() * 90000)}`;

    return prisma.idCard.upsert({
      where: { registration_id: registrationId },
      create: {
        participant_id: registration.participant_id,
        registration_id: registrationId,
        card_number: cardNumber,
        qr_token: qrToken,
        card_status: "GENERATED",
        generated_at: new Date(),
      },
      update: {
        card_status: "REISSUED",
        qr_token: qrToken, // Rotate token on reissue for security
        generated_at: new Date(),
      },
    });
  }

  /**
   * Verifies accreditation via secure QR token without exposing internal IDs or PII
   */
  static async verifyByQrToken(qrToken: string) {
    const idCard = await prisma.idCard.findUnique({
      where: { qr_token: qrToken },
      include: {
        participant: true,
        registration: {
          include: { championship: true },
        },
      },
    });

    if (!idCard) {
      return {
        is_valid: false,
        card_status: "NOT_GENERATED" as const,
        verified_at: new Date().toISOString(),
        message: "Invalid or unrecognized accreditation QR token.",
      };
    }

    return formatPublicVerificationPayload({
      cardStatus: idCard.card_status,
      cardNumber: idCard.card_number,
      fullName: idCard.participant.full_name,
      designation: idCard.participant.designation,
      nationality: idCard.participant.nationality,
      championshipName: idCard.registration.championship.name,
      registrationNumber: idCard.registration.registration_number,
      photoUrl: idCard.participant.photo_url || undefined,
    });
  }

  /**
   * Revokes an ID Card credential
   */
  static async revokeCard(idCardId: string, reason: string) {
    return prisma.idCard.update({
      where: { id: idCardId },
      data: {
        card_status: "REVOKED",
        revoked_at: new Date(),
        revocation_reason: reason,
      },
    });
  }
}
