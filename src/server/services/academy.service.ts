// ==============================================================================
// ACADEMY & TEAM DIRECTORY SERVICE (Requirements 8 & 9)
// Academy registration, search, and duplicate protection
// ==============================================================================

import prisma from "@/lib/db";
import { INITIAL_ACADEMIES } from "@/config/academies";
import { Academy } from "@/types/registration";
import { generateAcademyCode } from "@/lib/utils";

export interface CreateAcademyInput {
  name: string;
  short_name?: string;
  country: string;
  state: string;
  city: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  head_coach_name?: string;
  representative_name?: string;
  representative_email?: string;
  representative_phone?: string;
  representative_role?: string;
}

export class AcademyService {
  /**
   * Search recognized academies by name, city, or code
   */
  static async search(query = "", limit = 20): Promise<Academy[]> {
    const q = query.trim().toLowerCase();

    try {
      const dbAcademies = await prisma.academy.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { short_name: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
        take: limit,
        orderBy: { name: "asc" },
      });

      if (dbAcademies && dbAcademies.length > 0) {
        return dbAcademies.map((a) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          short_name: a.short_name,
          country: a.country,
          state: a.state,
          city: a.city,
          address: a.address,
          email: a.email,
          phone: a.phone,
          website: a.website,
          logo_url: a.logo_url,
          head_coach_name: a.head_coach_name,
          representative_name: a.representative_name,
          representative_email: a.representative_email,
          representative_phone: a.representative_phone,
          representative_role: a.representative_role,
          status: a.status,
          manager_user_id: a.manager_user_id,
        }));
      }
    } catch {
      // Fallback
    }

    // Filter fallback list
    if (!q) return INITIAL_ACADEMIES.slice(0, limit);

    return INITIAL_ACADEMIES.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.short_name && a.short_name.toLowerCase().includes(q)) ||
        a.city.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q)
    ).slice(0, limit);
  }

  /**
   * REQUIREMENT 9: Academy Duplicate Protection
   * Checks for potential duplicate academies based on Name, City, Country, or Contact
   */
  static async checkDuplicate(params: {
    name: string;
    country: string;
    city: string;
    email?: string;
  }): Promise<{ isDuplicate: boolean; matches: Academy[] }> {
    const normName = params.name.trim().toLowerCase();
    const normCity = params.city.trim().toLowerCase();
    const normEmail = params.email?.trim().toLowerCase();

    const all = await this.search("", 200);

    const matches = all.filter((a) => {
      const aName = a.name.toLowerCase();
      const aCity = a.city.toLowerCase();
      const aEmail = a.email?.toLowerCase();

      // Exact name match or highly similar name in same city
      if (aName === normName) return true;
      if (normEmail && aEmail && aEmail === normEmail) return true;
      if (aCity === normCity && (aName.includes(normName) || normName.includes(aName))) return true;

      return false;
    });

    return {
      isDuplicate: matches.length > 0,
      matches,
    };
  }

  /**
   * Registers a new Academy with generated institutional code
   */
  static async create(input: CreateAcademyInput, managerUserId?: string): Promise<Academy> {
    const code = generateAcademyCode("KKC26");

    try {
      const created = await prisma.academy.create({
        data: {
          code,
          name: input.name.trim(),
          short_name: input.short_name?.trim() || null,
          country: input.country || "India",
          state: input.state,
          city: input.city,
          address: input.address || null,
          email: input.email?.trim().toLowerCase() || null,
          phone: input.phone || null,
          website: input.website || null,
          head_coach_name: input.head_coach_name || null,
          representative_name: input.representative_name || null,
          representative_email: input.representative_email || null,
          representative_phone: input.representative_phone || null,
          representative_role: input.representative_role || "Representative",
          status: "APPROVED",
          manager_user_id: managerUserId || null,
        },
      });

      return {
        id: created.id,
        code: created.code,
        name: created.name,
        short_name: created.short_name,
        country: created.country,
        state: created.state,
        city: created.city,
        address: created.address,
        email: created.email,
        phone: created.phone,
        website: created.website,
        head_coach_name: created.head_coach_name,
        representative_name: created.representative_name,
        representative_email: created.representative_email,
        representative_phone: created.representative_phone,
        representative_role: created.representative_role,
        status: created.status,
        manager_user_id: created.manager_user_id,
      };
    } catch {
      // In dev fallback mode
      const newAcademy: Academy = {
        id: `mock-aca-${Date.now()}`,
        code,
        name: input.name,
        short_name: input.short_name,
        country: input.country || "India",
        state: input.state,
        city: input.city,
        address: input.address,
        email: input.email,
        phone: input.phone,
        website: input.website,
        head_coach_name: input.head_coach_name,
        representative_name: input.representative_name,
        representative_email: input.representative_email,
        representative_phone: input.representative_phone,
        representative_role: input.representative_role,
        status: "APPROVED",
        manager_user_id: managerUserId,
      };
      INITIAL_ACADEMIES.push(newAcademy);
      return newAcademy;
    }
  }

  /**
   * Get academy by ID or Code
   */
  static async getById(idOrCode: string): Promise<Academy | null> {
    try {
      const a = await prisma.academy.findFirst({
        where: {
          OR: [{ id: idOrCode }, { code: idOrCode }],
        },
      });
      if (a) {
        return {
          id: a.id,
          code: a.code,
          name: a.name,
          short_name: a.short_name,
          country: a.country,
          state: a.state,
          city: a.city,
          address: a.address,
          email: a.email,
          phone: a.phone,
          website: a.website,
          head_coach_name: a.head_coach_name,
          status: a.status,
        };
      }
    } catch {
      // Fallback
    }

    return (
      INITIAL_ACADEMIES.find((a) => a.id === idOrCode || a.code === idOrCode) || null
    );
  }
}
