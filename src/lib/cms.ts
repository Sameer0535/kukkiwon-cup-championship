// ==============================================================================
// PUBLIC CMS & DATABASE CONTENT RESOLVER (Requirements 17 & 18)
// Fetches dynamic championship and site content from database with production fallbacks
// ==============================================================================

import prisma from "@/lib/db";
import { BRANDING } from "@/config/branding";
import { SITE_CONFIG } from "@/config/site";

export interface PublicChampionshipContent {
  slug: string;
  name: string;
  shortName: string;
  subtitle: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationOpen: string;
  registrationClose: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  entryFeeAthlete: number;
  entryFeeCoach: number;
  entryFeeOfficial: number;
  posterUrl: string | null;
  bannerUrl: string | null;
  rulesDocumentUrl: string | null;
  heroHeadline: string;
  heroDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  disciplines: { title: string; category: string; description: string }[];
}

const DEFAULT_CHAMPIONSHIP_DATA: PublicChampionshipContent = {
  slug: "kukkiwon-cup-2026",
  name: "Kukkiwon Cup Championship 2026",
  shortName: "Kukkiwon Cup 2026",
  subtitle: "Sanctioned by World Taekwondo Headquarters Kukkiwon India North Branch",
  description:
    "The official premier Taekwondo championship organized under the sanction of Kukkiwon India North Branch in collaboration with Kyorix Sports Technology. Bringing together accredited athletes, coaches, and international referees across Northern India and partner nations.",
  status: "REGISTRATION_OPEN",
  startDate: "2026-11-20T09:00:00Z",
  endDate: "2026-11-23T18:00:00Z",
  registrationOpen: "2026-09-01T00:00:00Z",
  registrationClose: "2026-11-10T23:59:59Z",
  venue: "Indira Gandhi Indoor Stadium Complex",
  city: "New Delhi",
  state: "Delhi",
  country: "India",
  currency: "INR",
  entryFeeAthlete: 2500,
  entryFeeCoach: 1500,
  entryFeeOfficial: 0,
  posterUrl: null,
  bannerUrl: null,
  rulesDocumentUrl: null,
  heroHeadline: "The Pinnacle of Taekwondo Excellence",
  heroDescription:
    "Experience world-class competition, official Kukkiwon Dan accreditation, and electronic scoring precision powered by Kyorix Sports Technology.",
  contactEmail: SITE_CONFIG.contact.email,
  contactPhone: SITE_CONFIG.contact.phone,
  contactAddress: SITE_CONFIG.contact.address,
  disciplines: [
    {
      title: "Kyorugi (Sparring)",
      category: "Senior, Junior, Cadet & Sub-Junior",
      description: "Official full-contact Olympic-style sparring conducted under World Taekwondo competition rules with Kyorix electronic body protector and headgear scoring.",
    },
    {
      title: "Poomsae (Forms)",
      category: "Individual, Pair & Team Divisions",
      description: "Recognized and Freestyle Poomsae evaluated by certified Kukkiwon North India judges on technical accuracy, power balance, rhythm, and expression.",
    },
    {
      title: "Demonstration & Breaking",
      category: "Kyukpa & Creative Team Demo",
      description: "Technical board breaking, high jump aerial breaking, and synchronized team demonstrations showcasing the athletic essence of traditional and modern Taekwondo.",
    },
  ],
};

import { CmsService } from "@/server/services/cms.service";
import {
  PublicChampionshipPackage,
  PublicAnnouncement,
  PublicDocument,
  PublicCategory,
  PublicFee,
} from "@/types/cms";

/**
 * Fetches dynamic championship content from authoritative CmsService
 */
export async function getPublicChampionshipData(
  slug = "kukkiwon-cup-2026"
): Promise<PublicChampionshipContent> {
  try {
    const cmsChamp = await CmsService.getChampionship(slug, false);

    if (cmsChamp) {
      return {
        slug: cmsChamp.slug,
        name: cmsChamp.name,
        shortName: cmsChamp.shortName,
        subtitle: cmsChamp.subtitle,
        description: cmsChamp.description,
        status: cmsChamp.registrationAvailability === "OPEN" ? "REGISTRATION_OPEN" : cmsChamp.status,
        startDate: cmsChamp.startDate,
        endDate: cmsChamp.endDate,
        registrationOpen: cmsChamp.registrationOpen,
        registrationClose: cmsChamp.registrationClose,
        venue: cmsChamp.venue,
        city: cmsChamp.city,
        state: cmsChamp.state,
        country: cmsChamp.country,
        currency: cmsChamp.currency,
        entryFeeAthlete: cmsChamp.entryFeeAthlete,
        entryFeeCoach: cmsChamp.entryFeeCoach,
        entryFeeOfficial: cmsChamp.entryFeeOfficial,
        posterUrl: cmsChamp.posterUrl,
        bannerUrl: cmsChamp.bannerUrl,
        rulesDocumentUrl: cmsChamp.rulesDocumentUrl,
        heroHeadline: cmsChamp.heroHeadline,
        heroDescription: cmsChamp.heroDescription,
        contactEmail: cmsChamp.contactEmail,
        contactPhone: cmsChamp.contactPhone,
        contactAddress: cmsChamp.contactAddress,
        disciplines: DEFAULT_CHAMPIONSHIP_DATA.disciplines,
      };
    }

    const dbRecord = await prisma.championship.findUnique({
      where: { slug },
      include: {
        site_settings: true,
      },
    });

    if (!dbRecord) {
      return DEFAULT_CHAMPIONSHIP_DATA;
    }

    return {
      slug: dbRecord.slug,
      name: dbRecord.name,
      shortName: dbRecord.short_name || dbRecord.name,
      subtitle: dbRecord.subtitle || DEFAULT_CHAMPIONSHIP_DATA.subtitle,
      description: dbRecord.description || DEFAULT_CHAMPIONSHIP_DATA.description,
      status: dbRecord.status,
      startDate: dbRecord.start_date.toISOString(),
      endDate: dbRecord.end_date.toISOString(),
      registrationOpen: dbRecord.registration_open.toISOString(),
      registrationClose: dbRecord.registration_close.toISOString(),
      venue: dbRecord.venue,
      city: dbRecord.city,
      state: dbRecord.state,
      country: dbRecord.country,
      currency: dbRecord.currency,
      entryFeeAthlete: Number(dbRecord.entry_fee_athlete),
      entryFeeCoach: Number(dbRecord.entry_fee_coach),
      entryFeeOfficial: Number(dbRecord.entry_fee_official),
      posterUrl: dbRecord.poster_url || dbRecord.site_settings?.poster_url || null,
      bannerUrl: dbRecord.banner_url || null,
      rulesDocumentUrl: dbRecord.rules_document_url || null,
      heroHeadline: dbRecord.site_settings?.hero_headline || DEFAULT_CHAMPIONSHIP_DATA.heroHeadline,
      heroDescription: dbRecord.site_settings?.hero_description || DEFAULT_CHAMPIONSHIP_DATA.heroDescription,
      contactEmail: dbRecord.site_settings?.contact_email || DEFAULT_CHAMPIONSHIP_DATA.contactEmail,
      contactPhone: dbRecord.site_settings?.contact_phone || DEFAULT_CHAMPIONSHIP_DATA.contactPhone,
      contactAddress: dbRecord.site_settings?.contact_address || DEFAULT_CHAMPIONSHIP_DATA.contactAddress,
      disciplines: DEFAULT_CHAMPIONSHIP_DATA.disciplines,
    };
  } catch (error) {
    return DEFAULT_CHAMPIONSHIP_DATA;
  }
}

/**
 * Retrieves full public CMS package for a championship
 */
export async function getPublicChampionshipPackage(
  slugOrId = "champ-kukkiwon-2026"
): Promise<PublicChampionshipPackage | null> {
  try {
    return await CmsService.getPublicChampionshipPackage(slugOrId);
  } catch {
    return null;
  }
}

/**
 * Retrieves published announcements for public display
 */
export async function getPublicAnnouncements(
  championshipId = "champ-kukkiwon-2026"
): Promise<PublicAnnouncement[]> {
  try {
    return await CmsService.listAnnouncements(championshipId, false);
  } catch {
    return [];
  }
}

/**
 * Retrieves published documents for public display
 */
export async function getPublicDocuments(
  championshipId = "champ-kukkiwon-2026"
): Promise<PublicDocument[]> {
  try {
    return await CmsService.listPublicDocuments(championshipId, false);
  } catch {
    return [];
  }
}

/**
 * Retrieves active public categories
 */
export async function getPublicCategories(
  championshipId = "champ-kukkiwon-2026"
): Promise<PublicCategory[]> {
  try {
    return await CmsService.listCategories(championshipId, false);
  } catch {
    return [];
  }
}

/**
 * Retrieves active public fees
 */
export async function getPublicFees(
  championshipId = "champ-kukkiwon-2026"
): Promise<PublicFee[]> {
  try {
    return await CmsService.listFees(championshipId, false);
  } catch {
    return [];
  }
}

