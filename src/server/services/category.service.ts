// ==============================================================================
// CATEGORY SERVICE (Requirements 4 & 5)
// Championship discipline & weight category rules with strict backend validation
// ==============================================================================

import prisma from "@/lib/db";
import { INITIAL_CATEGORIES } from "@/config/categories";
import { Category } from "@/types/registration";
import { calculateAge } from "@/lib/utils";

export interface EligibilityParams {
  dob?: string | Date;
  gender?: string;
  discipline?: string;
  belt?: string;
  weight?: number;
}

export class CategoryService {
  /**
   * Lists categories for a championship with optional discipline filter
   */
  static async listCategories(championshipId?: string, discipline?: string): Promise<Category[]> {
    try {
      const where: Record<string, unknown> = { is_active: true };
      if (championshipId) where.championship_id = championshipId;
      if (discipline) where.discipline = discipline.toUpperCase();

      const dbCategories = await prisma.category.findMany({
        where,
        orderBy: { display_order: "asc" },
      });

      if (dbCategories && dbCategories.length > 0) {
        return dbCategories.map((c) => ({
          id: c.id,
          championship_id: c.championship_id,
          code: c.code,
          name: c.name,
          discipline: c.discipline,
          division: c.division,
          gender: c.gender as "MALE" | "FEMALE" | "OTHER",
          min_age: c.min_age,
          max_age: c.max_age,
          min_weight: c.min_weight ? Number(c.min_weight) : null,
          max_weight: c.max_weight ? Number(c.max_weight) : null,
          belt_requirement: c.belt_requirement,
          registration_fee: c.registration_fee ? Number(c.registration_fee) : null,
          max_participants: c.max_participants,
          display_order: c.display_order,
          is_active: c.is_active,
        }));
      }
    } catch {
      // Fallback in dev mode when DB table not yet populated
    }

    // Filter from default config
    let categories: Category[] = INITIAL_CATEGORIES.map((c, i) => ({
      ...c,
      id: `cat-${c.code.toLowerCase()}-${i}`,
      championship_id: championshipId || "default-championship-id",
    }));

    if (discipline) {
      categories = categories.filter(
        (c) => c.discipline.toUpperCase() === discipline.toUpperCase()
      );
    }

    return categories;
  }

  /**
   * Computes eligible categories based on participant DOB, gender, discipline, belt, and weight
   */
  static async getEligibleCategories(params: EligibilityParams): Promise<Category[]> {
    const all = await this.listCategories(undefined, params.discipline);

    const age = params.dob ? calculateAge(params.dob) : null;
    const gender = params.gender?.toUpperCase();
    const weight = params.weight !== undefined && params.weight !== null ? Number(params.weight) : null;
    const belt = params.belt?.toUpperCase();

    return all.filter((cat) => {
      // 1. Discipline check
      if (params.discipline && cat.discipline.toUpperCase() !== params.discipline.toUpperCase()) {
        return false;
      }

      // 2. Gender check (unless Open / Other)
      if (gender && cat.gender !== "OTHER" && cat.division !== "OPEN") {
        if (cat.gender.toUpperCase() !== gender) {
          return false;
        }
      }

      // 3. Age boundaries
      if (age !== null) {
        if (cat.min_age !== null && cat.min_age !== undefined && age < cat.min_age) {
          return false;
        }
        if (cat.max_age !== null && cat.max_age !== undefined && age > cat.max_age) {
          return false;
        }
      }

      // 4. Weight boundaries (for Kyorugi)
      if (cat.discipline === "KYORUGI" && weight !== null && !isNaN(weight)) {
        if (cat.min_weight !== null && cat.min_weight !== undefined && weight < cat.min_weight) {
          return false;
        }
        if (cat.max_weight !== null && cat.max_weight !== undefined && weight > cat.max_weight) {
          return false;
        }
      }

      // 5. Belt requirements
      if (belt && cat.belt_requirement) {
        if (cat.belt_requirement === "1ST_DAN_ABOVE") {
          const isDan = belt.includes("DAN") || belt.includes("BLACK");
          if (!isDan) return false;
        } else if (cat.belt_requirement === "1ST_POOM_ABOVE") {
          const isPoomOrDan = belt.includes("POOM") || belt.includes("DAN") || belt.includes("BLACK");
          if (!isPoomOrDan) return false;
        }
      }

      return true;
    });
  }

  /**
   * CRITICAL SECURITY REQUIREMENT 4:
   * Backend MUST strictly validate category eligibility before saving/submitting
   */
  static async validateCategoryEligibility(
    categoryId: string,
    params: {
      dob: string | Date;
      gender: string;
      belt?: string;
      weight?: number;
    }
  ): Promise<{ valid: boolean; reason?: string; category?: Category }> {
    const all = await this.listCategories();
    let category = all.find(
      (c) =>
        c.id === categoryId ||
        c.code.toUpperCase() === categoryId.toUpperCase()
    );

    if (!category) {
      const fromConfig = INITIAL_CATEGORIES.find(
        (c) => c.code.toUpperCase() === categoryId.toUpperCase()
      );
      if (fromConfig) {
        category = {
          ...fromConfig,
          id: `cat-${fromConfig.code.toLowerCase()}`,
          championship_id: "default-championship-id",
        };
      }
    }

    if (!category) {
      return { valid: false, reason: "Specified category does not exist in the championship configuration." };
    }

    if (!category.is_active) {
      return { valid: false, reason: "The selected category is not currently active for registration." };
    }

    const age = calculateAge(params.dob);

    // Age validation
    if (category.min_age !== null && category.min_age !== undefined && age < category.min_age) {
      return {
        valid: false,
        reason: `Participant age (${age} yrs) does not meet the minimum age (${category.min_age} yrs) for ${category.name}.`,
      };
    }

    if (category.max_age !== null && category.max_age !== undefined && age > category.max_age) {
      return {
        valid: false,
        reason: `Participant age (${age} yrs) exceeds the maximum age (${category.max_age} yrs) for ${category.name}.`,
      };
    }

    // Gender validation
    if (category.gender !== "OTHER" && category.division !== "OPEN") {
      if (category.gender.toUpperCase() !== params.gender.toUpperCase()) {
        return {
          valid: false,
          reason: `Gender mismatch: Participant is registered as ${params.gender}, but this category is restricted to ${category.gender}.`,
        };
      }
    }

    // Weight validation (for Kyorugi)
    if (category.discipline === "KYORUGI" && params.weight !== undefined && params.weight !== null) {
      const w = Number(params.weight);
      if (category.min_weight !== null && category.min_weight !== undefined && w < category.min_weight) {
        return {
          valid: false,
          reason: `Participant weight (${w}kg) is below minimum (${category.min_weight}kg) for ${category.name}.`,
        };
      }
      if (category.max_weight !== null && category.max_weight !== undefined && w > category.max_weight) {
        return {
          valid: false,
          reason: `Participant weight (${w}kg) exceeds maximum (${category.max_weight}kg) for ${category.name}.`,
        };
      }
    }

    return { valid: true, category };
  }
}
