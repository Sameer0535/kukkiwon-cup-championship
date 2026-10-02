// ==============================================================================
// CONTENT & TERMS SERVICE (Requirements 17 & 18)
// Site settings and auditable terms versioning
// ==============================================================================

import prisma from "@/lib/db";

export class ContentService {
  /**
   * Retrieves active site settings for the championship portal
   */
  static async getSiteSettings(championshipId?: string) {
    if (championshipId) {
      const settings = await prisma.siteSetting.findUnique({
        where: { championship_id: championshipId },
      });
      if (settings) return settings;
    }

    // Default global settings
    return prisma.siteSetting.findFirst({
      where: { is_published: true },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Retrieves active terms version for tournament agreement
   */
  static async getActiveTermsVersion(championshipId?: string) {
    return prisma.termsVersion.findFirst({
      where: {
        championship_id: championshipId ?? undefined,
        is_active: true,
      },
      orderBy: { published_at: "desc" },
    });
  }

  /**
   * Publishes a new terms version
   */
  static async publishTermsVersion(data: {
    championshipId?: string | null;
    version: string;
    title: string;
    content: string;
  }) {
    return prisma.termsVersion.create({
      data: {
        championship_id: data.championshipId,
        version: data.version,
        title: data.title,
        content: data.content,
        is_active: true,
      },
    });
  }
}
