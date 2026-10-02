// ==============================================================================
// KUKKIWON CUP CHAMPIONSHIP - FEE CALCULATION SERVICE
// Authoritative Server-Side Fee Engine with Integer Minor Units (Paise)
// ==============================================================================

import prisma from "@/lib/db";
import { FeeCalculationResult, FeeItem, FeeSnapshot } from "@/types/payment";
import { ParticipantType } from "@/types/registration";

// Default championship fee parameters (in paise: 1 INR = 100 paise)
export const DEFAULT_FEE_CONFIG = {
  ATHLETE_BASE_FEE_PAISE: 150000, // ₹1,500
  COACH_BASE_FEE_PAISE: 100000,   // ₹1,000
  ACADEMY_TEAM_BASE_FEE_PAISE: 250000, // ₹2,500
  LATE_FEE_SURCHARGE_PAISE: 50000, // ₹500
  TAX_RATE_PERCENT: 0,            // 0% default (configurable tax)
  DEFAULT_CURRENCY: "INR",
};

/**
 * Format integer paise into a clean institutional Indian Rupee string (e.g. ₹1,500)
 */
export function formatPaiseToInr(paise: number, currency = "INR"): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

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

export interface FeeCalculationParams {
  registrationId: string;
  championshipId?: string;
  categoryId?: string | null;
  participantType?: ParticipantType;
  calculationDate?: Date;
}

export class FeeService {
  /**
   * Authoritative calculation of registration fee breakdown and immutable snapshot
   */
  static async calculateFee(params: FeeCalculationParams): Promise<FeeCalculationResult> {
    const calculationDate = params.calculationDate || new Date();
    const online = await isDbOnline();

    let championshipName = "Kukkiwon Cup Championship 2026";
    let championshipId = params.championshipId || "champ-kukkiwon-2026";
    let registrationNumber = "KKC26-REG-UNKNOWN";
    let participantName = "Participant";
    let participantType: ParticipantType = params.participantType || "ATHLETE";
    let categoryName: string | undefined = undefined;
    let categoryCode: string | undefined = undefined;
    let discipline: string | undefined = undefined;

    let baseFeePaise = DEFAULT_FEE_CONFIG.ATHLETE_BASE_FEE_PAISE;
    let lateFeeSurchargePaise = DEFAULT_FEE_CONFIG.LATE_FEE_SURCHARGE_PAISE;
    let lateFeeFrom: Date | null = null;
    let currency = DEFAULT_FEE_CONFIG.DEFAULT_CURRENCY;

    // 1. Load authoritative records from database if available
    if (online) {
      try {
        const reg = await prisma.registration.findUnique({
          where: { id: params.registrationId },
          include: {
            championship: true,
            participant: true,
            category: true,
          },
        });

        if (reg) {
          registrationNumber = reg.registration_number;
          participantType = reg.participant_type as ParticipantType;
          discipline = reg.discipline || undefined;
          championshipId = reg.championship_id;
          championshipName = reg.championship.name;
          currency = reg.championship.currency || "INR";
          participantName = reg.participant.full_name;

          if (reg.category) {
            categoryName = reg.category.name;
            categoryCode = reg.category.code;
            if (reg.category.registration_fee) {
              baseFeePaise = Math.round(Number(reg.category.registration_fee) * 100);
            }
          } else {
            if (participantType === "COACH") {
              baseFeePaise = Math.round(Number(reg.championship.entry_fee_coach) * 100) || DEFAULT_FEE_CONFIG.COACH_BASE_FEE_PAISE;
            } else {
              baseFeePaise = Math.round(Number(reg.championship.entry_fee_athlete) * 100) || DEFAULT_FEE_CONFIG.ATHLETE_BASE_FEE_PAISE;
            }
          }

          // Check custom RegistrationFee rules if defined
          const feeRule = await prisma.registrationFee.findFirst({
            where: {
              championship_id: championshipId,
              is_active: true,
              OR: [
                { category_id: reg.category_id || undefined },
                { participant_type: participantType, category_id: null },
              ],
            },
            orderBy: { category_id: "desc" }, // Specific category fee takes precedence
          });

          if (feeRule) {
            baseFeePaise = feeRule.amount_paise;
            lateFeeSurchargePaise = feeRule.late_fee_paise;
            lateFeeFrom = feeRule.late_fee_from || null;
          } else {
            // Check championship close date as default late fee trigger
            // (e.g. 7 days before close date)
            const closeDate = new Date(reg.championship.registration_close);
            lateFeeFrom = new Date(closeDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          }
        }
      } catch (err) {
        console.warn("[FeeService] DB lookup error, applying standard configuration:", err);
      }
    } else {
      // Offline fallback defaults
      if (params.participantType === "COACH") {
        baseFeePaise = DEFAULT_FEE_CONFIG.COACH_BASE_FEE_PAISE;
      } else if (params.participantType === "ACADEMY_TEAM") {
        baseFeePaise = DEFAULT_FEE_CONFIG.ACADEMY_TEAM_BASE_FEE_PAISE;
      } else {
        baseFeePaise = DEFAULT_FEE_CONFIG.ATHLETE_BASE_FEE_PAISE;
      }
    }

    // 2. Determine if late fee applies
    // If explicit lateFeeFrom is provided and calculationDate >= lateFeeFrom, apply late fee
    let isLate = false;
    let lateFeePaise = 0;
    if (lateFeeFrom && calculationDate.getTime() >= lateFeeFrom.getTime() && lateFeeSurchargePaise > 0) {
      isLate = true;
      lateFeePaise = lateFeeSurchargePaise;
    }

    // 3. Additional charges (extensible architecture)
    const additionalFeesPaise = 0;

    // 4. Configurable tax calculation (paise precision, 0% default)
    const subtotalPaise = baseFeePaise + lateFeePaise + additionalFeesPaise;
    const taxPaise = Math.round((subtotalPaise * DEFAULT_FEE_CONFIG.TAX_RATE_PERCENT) / 100);
    const totalPaise = subtotalPaise + taxPaise;

    // 5. Build breakdown items list
    const items: FeeItem[] = [
      {
        code: "BASE_FEE",
        label: `${participantType === "COACH" ? "Coach" : "Athlete"} Registration Fee`,
        amountPaise: baseFeePaise,
      },
    ];

    if (lateFeePaise > 0) {
      items.push({
        code: "LATE_FEE",
        label: "Late Registration Surcharge",
        amountPaise: lateFeePaise,
        isLateFee: true,
      });
    }

    if (additionalFeesPaise > 0) {
      items.push({
        code: "ADDITIONAL_FEE",
        label: "Additional Category / Discipline Fee",
        amountPaise: additionalFeesPaise,
      });
    }

    if (taxPaise > 0) {
      items.push({
        code: "TAX",
        label: `Taxes & Levies (${DEFAULT_FEE_CONFIG.TAX_RATE_PERCENT}%)`,
        amountPaise: taxPaise,
        isTax: true,
      });
    }

    // 6. Build immutable snapshot
    const snapshot: FeeSnapshot = {
      championshipId,
      championshipName,
      registrationId: params.registrationId,
      registrationNumber,
      participantType,
      participantName,
      categoryCode,
      categoryName,
      discipline,
      baseFeePaise,
      lateFeePaise,
      additionalFeesPaise,
      taxPaise,
      totalPaise,
      currency,
      isLate,
      items,
      calculatedAt: calculationDate.toISOString(),
    };

    return {
      baseFeePaise,
      lateFeePaise,
      additionalFeesPaise,
      taxPaise,
      totalPaise,
      currency,
      isLate,
      formattedBaseFee: formatPaiseToInr(baseFeePaise, currency),
      formattedLateFee: formatPaiseToInr(lateFeePaise, currency),
      formattedAdditionalFees: formatPaiseToInr(additionalFeesPaise, currency),
      formattedTax: formatPaiseToInr(taxPaise, currency),
      formattedTotal: formatPaiseToInr(totalPaise, currency),
      items,
      snapshot,
    };
  }

  /**
   * Helper to manually compute fee for preview or simulation
   */
  static computeStaticBreakdown(options: {
    participantType?: ParticipantType;
    baseFeePaise?: number;
    isLate?: boolean;
    lateFeePaise?: number;
    currency?: string;
  }): FeeCalculationResult {
    const type = options.participantType || "ATHLETE";
    const baseFeePaise =
      options.baseFeePaise !== undefined
        ? options.baseFeePaise
        : type === "COACH"
        ? DEFAULT_FEE_CONFIG.COACH_BASE_FEE_PAISE
        : DEFAULT_FEE_CONFIG.ATHLETE_BASE_FEE_PAISE;

    const isLate = !!options.isLate;
    const lateFeePaise = isLate
      ? options.lateFeePaise !== undefined
        ? options.lateFeePaise
        : DEFAULT_FEE_CONFIG.LATE_FEE_SURCHARGE_PAISE
      : 0;

    const additionalFeesPaise = 0;
    const taxPaise = 0;
    const totalPaise = baseFeePaise + lateFeePaise + additionalFeesPaise + taxPaise;
    const currency = options.currency || "INR";

    const items: FeeItem[] = [
      {
        code: "BASE_FEE",
        label: `${type === "COACH" ? "Coach" : "Athlete"} Registration Fee`,
        amountPaise: baseFeePaise,
      },
    ];

    if (lateFeePaise > 0) {
      items.push({
        code: "LATE_FEE",
        label: "Late Registration Surcharge",
        amountPaise: lateFeePaise,
        isLateFee: true,
      });
    }

    const snapshot: FeeSnapshot = {
      championshipId: "champ-kukkiwon-2026",
      championshipName: "Kukkiwon Cup Championship 2026",
      registrationId: "preview",
      registrationNumber: "KKC26-PREVIEW",
      participantType: type,
      participantName: "Preview Participant",
      baseFeePaise,
      lateFeePaise,
      additionalFeesPaise,
      taxPaise,
      totalPaise,
      currency,
      isLate,
      items,
      calculatedAt: new Date().toISOString(),
    };

    return {
      baseFeePaise,
      lateFeePaise,
      additionalFeesPaise,
      taxPaise,
      totalPaise,
      currency,
      isLate,
      formattedBaseFee: formatPaiseToInr(baseFeePaise, currency),
      formattedLateFee: formatPaiseToInr(lateFeePaise, currency),
      formattedAdditionalFees: formatPaiseToInr(additionalFeesPaise, currency),
      formattedTax: formatPaiseToInr(taxPaise, currency),
      formattedTotal: formatPaiseToInr(totalPaise, currency),
      items,
      snapshot,
    };
  }
}
