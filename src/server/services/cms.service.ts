// ==============================================================================
// MASTER CHAMPIONSHIP CMS & LIVE PUBLISHING SERVICE (Phase 9)
// Authoritative Service for Public Championship Information, Categories,
// Registration Fees, Announcements, Public Documents, and Live Publishing
// ==============================================================================

import prisma from "@/lib/db";
import { formatPaiseToInr } from "@/server/services/fee.service";
import { AuditService } from "@/server/services/audit.service";
import { AuthError } from "@/lib/server-auth";
import { AdminSession } from "@/types/admin";
import {
  PublicChampionship,
  PublicCategory,
  PublicFee,
  PublicAnnouncement,
  PublicDocument,
  PublicChampionshipPackage,
  PublicationStatus,
  RegistrationAvailability,
  UpdateChampionshipCmsInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateFeeInput,
  UpdateFeeInput,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  CreatePublicDocumentInput,
  UpdatePublicDocumentInput,
} from "@/types/cms";

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

// ------------------------------------------------------------------------------
// Fallback Authoritative Stores for CMS Persistence
// ------------------------------------------------------------------------------

interface FallbackChampionshipData {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  edition: string;
  subtitle: string;
  description: string;
  status: PublicationStatus;
  start_date: string;
  end_date: string;
  registration_open: string;
  registration_close: string;
  late_registration_deadline: string | null;
  venue: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  entry_fee_athlete: number;
  entry_fee_coach: number;
  entry_fee_official: number;
  banner_url: string | null;
  poster_url: string | null;
  rules_document_url: string | null;
  hero_headline: string;
  hero_description: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string | null;
  contact_address: string;
  social_links: Record<string, string>;
  is_published: boolean;
  updated_at: string;
}

const FALLBACK_CHAMPIONSHIPS: Map<string, FallbackChampionshipData> = new Map([
  [
    "champ-kukkiwon-2026",
    {
      id: "champ-kukkiwon-2026",
      slug: "kukkiwon-cup-2026",
      name: "Kukkiwon Cup Championship 2026",
      short_name: "Kukkiwon Cup 2026",
      edition: "2026",
      subtitle: "Sanctioned by World Taekwondo Headquarters Kukkiwon India North Branch",
      description:
        "The official premier Taekwondo championship organized under the sanction of Kukkiwon India North Branch in collaboration with Kyorix Sports Technology. Bringing together accredited athletes, coaches, and international referees across Northern India and partner nations.",
      status: "PUBLISHED",
      start_date: "2026-11-20T09:00:00Z",
      end_date: "2026-11-23T18:00:00Z",
      registration_open: "2026-09-01T00:00:00Z",
      registration_close: "2026-11-10T23:59:59Z",
      late_registration_deadline: "2026-11-15T23:59:59Z",
      venue: "Indira Gandhi Indoor Stadium Complex",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      currency: "INR",
      entry_fee_athlete: 1500,
      entry_fee_coach: 1000,
      entry_fee_official: 0,
      banner_url: "/branding/hero-banner.jpg",
      poster_url: "/branding/poster.jpg",
      rules_document_url: "/documents/kukkiwon-cup-2026-regulations.pdf",
      hero_headline: "The Pinnacle of Taekwondo Excellence",
      hero_description:
        "Experience world-class competition, official Kukkiwon Dan accreditation, and electronic scoring precision powered by Kyorix Sports Technology.",
      contact_email: "contact@kukkiwoncup.org",
      contact_phone: "+91 98765 43210",
      contact_whatsapp: "+91 98765 43210",
      contact_address: "Kukkiwon India North Secretariat, New Delhi, India",
      social_links: {
        instagram: "https://instagram.com/kukkiwoncup",
        facebook: "https://facebook.com/kukkiwoncup",
        youtube: "https://youtube.com/@kukkiwoncup",
      } as Record<string, string>,
      is_published: true,
      updated_at: new Date().toISOString(),
    },
  ],
  [
    "champ-delhi-open-2026",
    {
      id: "champ-delhi-open-2026",
      slug: "delhi-open-2026",
      name: "Delhi Open Taekwondo Championship 2026",
      short_name: "Delhi Open 2026",
      edition: "2026",
      subtitle: "State-Level Invitational Championship",
      description: "Delhi State Invitational Taekwondo Championship.",
      status: "DRAFT",
      start_date: "2026-12-05T09:00:00Z",
      end_date: "2026-12-07T18:00:00Z",
      registration_open: "2026-11-01T00:00:00Z",
      registration_close: "2026-11-30T23:59:59Z",
      late_registration_deadline: null,
      venue: "Thyagaraj Indoor Stadium",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      currency: "INR",
      entry_fee_athlete: 1200,
      entry_fee_coach: 800,
      entry_fee_official: 0,
      banner_url: null,
      poster_url: null,
      rules_document_url: null,
      hero_headline: "Delhi Open Taekwondo",
      hero_description: "State level invitational.",
      contact_email: "delhi@kukkiwoncup.org",
      contact_phone: "+91 98765 00000",
      contact_whatsapp: null,
      contact_address: "Delhi, India",
      social_links: {} as Record<string, string>,
      is_published: false,
      updated_at: new Date().toISOString(),
    },
  ],
]);

const FALLBACK_CATEGORIES: Map<string, PublicCategory> = new Map([
  [
    "cat-001",
    {
      id: "cat-001",
      championshipId: "champ-kukkiwon-2026",
      code: "KY-SEN-M-U58",
      name: "Senior Male Under 58kg",
      discipline: "KYORUGI",
      division: "SENIOR",
      gender: "MALE",
      minAge: 18,
      maxAge: 35,
      minWeight: null,
      maxWeight: 58,
      beltRequirement: "BLACK_BELT",
      registrationFee: 1500,
      displayOrder: 1,
      isActive: true,
    },
  ],
  [
    "cat-002",
    {
      id: "cat-002",
      championshipId: "champ-kukkiwon-2026",
      code: "KY-SEN-F-U49",
      name: "Senior Female Under 49kg",
      discipline: "KYORUGI",
      division: "SENIOR",
      gender: "FEMALE",
      minAge: 18,
      maxAge: 35,
      minWeight: null,
      maxWeight: 49,
      beltRequirement: "BLACK_BELT",
      registrationFee: 1500,
      displayOrder: 2,
      isActive: true,
    },
  ],
  [
    "cat-003",
    {
      id: "cat-003",
      championshipId: "champ-kukkiwon-2026",
      code: "PM-IND-SEN-M",
      name: "Senior Male Individual Recognized Poomsae",
      discipline: "POOMSAE",
      division: "SENIOR",
      gender: "MALE",
      minAge: 18,
      maxAge: 35,
      minWeight: null,
      maxWeight: null,
      beltRequirement: "BLACK_BELT",
      registrationFee: 1500,
      displayOrder: 3,
      isActive: true,
    },
  ],
  [
    "cat-004",
    {
      id: "cat-004",
      championshipId: "champ-kukkiwon-2026",
      code: "DEMO-EXP-OPEN",
      name: "Special Experimental Breaking",
      discipline: "DEMO",
      division: "OPEN",
      gender: "OTHER",
      minAge: null,
      maxAge: null,
      minWeight: null,
      maxWeight: null,
      beltRequirement: null,
      registrationFee: 2000,
      displayOrder: 4,
      isActive: false, // Inactive by default to test requirement 7
    },
  ],
  [
    "cat-005",
    {
      id: "cat-005",
      championshipId: "champ-delhi-open-2026",
      code: "DELHI-JUN-M-U45",
      name: "Delhi Junior Male Under 45kg",
      discipline: "KYORUGI",
      division: "JUNIOR",
      gender: "MALE",
      minAge: 14,
      maxAge: 17,
      minWeight: null,
      maxWeight: 45,
      beltRequirement: null,
      registrationFee: 1200,
      displayOrder: 1,
      isActive: true,
    },
  ],
]);

const FALLBACK_FEES: Map<string, PublicFee> = new Map([
  [
    "fee-ath-001",
    {
      id: "fee-ath-001",
      championshipId: "champ-kukkiwon-2026",
      categoryId: null,
      categoryName: null,
      participantType: "ATHLETE",
      name: "Standard Athlete Entry Fee",
      baseFeePaise: 150000,
      baseFeeFormatted: "₹1,500",
      lateFeePaise: 50000,
      lateFeeFormatted: "₹500",
      currency: "INR",
      lateFeeFrom: "2026-11-01T00:00:00Z",
      effectiveFrom: "2026-09-01T00:00:00Z",
      effectiveUntil: "2026-11-15T23:59:59Z",
      isActive: true,
    },
  ],
  [
    "fee-coach-001",
    {
      id: "fee-coach-001",
      championshipId: "champ-kukkiwon-2026",
      categoryId: null,
      categoryName: null,
      participantType: "COACH",
      name: "Official Coach Accreditation Fee",
      baseFeePaise: 100000,
      baseFeeFormatted: "₹1,000",
      lateFeePaise: 0,
      lateFeeFormatted: "₹0",
      currency: "INR",
      lateFeeFrom: null,
      effectiveFrom: "2026-09-01T00:00:00Z",
      effectiveUntil: "2026-11-15T23:59:59Z",
      isActive: true,
    },
  ],
  [
    "fee-delhi-001",
    {
      id: "fee-delhi-001",
      championshipId: "champ-delhi-open-2026",
      categoryId: null,
      categoryName: null,
      participantType: "ATHLETE",
      name: "Delhi Open Athlete Entry Fee",
      baseFeePaise: 120000,
      baseFeeFormatted: "₹1,200",
      lateFeePaise: 30000,
      lateFeeFormatted: "₹300",
      currency: "INR",
      lateFeeFrom: "2026-11-20T00:00:00Z",
      effectiveFrom: "2026-11-01T00:00:00Z",
      effectiveUntil: "2026-11-30T23:59:59Z",
      isActive: true,
    },
  ],
]);

const FALLBACK_ANNOUNCEMENTS: Map<string, PublicAnnouncement> = new Map([
  [
    "ann-001",
    {
      id: "ann-001",
      championshipId: "champ-kukkiwon-2026",
      title: "Official Athlete Registration is Now Open",
      shortDescription: "Online athlete, coach, and academy registration portal has officially opened for the 2026 edition.",
      content:
        "The Executive Organizing Committee of Kukkiwon India North Branch, in partnership with Kyorix Sports Technology, hereby announces the opening of digital registration for the Kukkiwon Cup Championship 2026. All accredited taekwondo academies and independent practitioners are invited to submit their registrations online.",
      publishDate: "2026-09-01T00:00:00Z",
      expiryDate: "2026-11-30T23:59:59Z",
      status: "PUBLISHED",
      displayOrder: 1,
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
    },
  ],
  [
    "ann-002",
    {
      id: "ann-002",
      championshipId: "champ-kukkiwon-2026",
      title: "Electronic Body Protector (PSS) Technical Guidelines",
      shortDescription: "Kyorix Gen-3 wireless scoring system will be deployed across all tournament rings.",
      content:
        "Official notice regarding match equipment: Kyorix electronic chest protectors and electronic headgear will be provided on-site. Athletes are required to bring approved sensor socks and personal groin/forearm/shin protection compliant with World Taekwondo standards.",
      publishDate: "2026-09-15T00:00:00Z",
      expiryDate: null,
      status: "PUBLISHED",
      displayOrder: 2,
      createdAt: "2026-09-15T00:00:00Z",
      updatedAt: "2026-09-15T00:00:00Z",
    },
  ],
  [
    "ann-003",
    {
      id: "ann-003",
      championshipId: "champ-kukkiwon-2026",
      title: "Internal Draft — Referee Clinic Schedule",
      shortDescription: "Draft announcement for technical officials not yet cleared for public release.",
      content: "Confidential draft schedule for international referee refresher course.",
      publishDate: "2026-10-01T00:00:00Z",
      expiryDate: null,
      status: "DRAFT", // Must NOT be visible publicly
      displayOrder: 3,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    },
  ],
  [
    "ann-004",
    {
      id: "ann-004",
      championshipId: "champ-kukkiwon-2026",
      title: "Early Bird Registration Reminder (Expired)",
      shortDescription: "Early bird fee tier concluded on September 15.",
      content: "This announcement has expired and should be omitted from public active list.",
      publishDate: "2026-08-01T00:00:00Z",
      expiryDate: "2026-09-15T23:59:59Z", // Expired in the past relative to October 2026
      status: "PUBLISHED",
      displayOrder: 4,
      createdAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-01T00:00:00Z",
    },
  ],
]);

const FALLBACK_PUBLIC_DOCUMENTS: Map<string, PublicDocument> = new Map([
  [
    "pdoc-001",
    {
      id: "pdoc-001",
      championshipId: "champ-kukkiwon-2026",
      title: "Official Tournament Information Prospectus",
      documentType: "PROSPECTUS",
      description: "Comprehensive guide including championship outline, categories, timetable, and rules.",
      fileUrl: "/documents/kukkiwon-cup-2026-prospectus.pdf",
      fileName: "kukkiwon-cup-2026-prospectus.pdf",
      fileSizeFormatted: "2.4 MB",
      publishDate: "2026-09-01T00:00:00Z",
      status: "PUBLISHED",
      displayOrder: 1,
    },
  ],
  [
    "pdoc-002",
    {
      id: "pdoc-002",
      championshipId: "champ-kukkiwon-2026",
      title: "Athlete Document & Identity Requirements",
      documentType: "REQUIREMENTS",
      description: "Mandatory photo, Aadhaar/Passport, and Kukkiwon Dan certificate submission criteria.",
      fileUrl: "/documents/athlete-document-guidelines.pdf",
      fileName: "athlete-document-guidelines.pdf",
      fileSizeFormatted: "850 KB",
      publishDate: "2026-09-01T00:00:00Z",
      status: "PUBLISHED",
      displayOrder: 2,
    },
  ],
  [
    "pdoc-003",
    {
      id: "pdoc-003",
      championshipId: "champ-kukkiwon-2026",
      title: "Confidential Draft Medical Evacuation Protocol",
      documentType: "INTERNAL_PROTOCOL",
      description: "Internal safety draft not intended for public distribution.",
      fileUrl: "/documents/internal-med-plan.pdf",
      fileName: "internal-med-plan.pdf",
      fileSizeFormatted: "1.1 MB",
      publishDate: "2026-10-01T00:00:00Z",
      status: "DRAFT", // Must NOT be visible publicly
      displayOrder: 3,
    },
  ],
]);

export class CmsService {
  private static checkContentPermission(adminSession?: AdminSession) {
    if (!adminSession) return;
    if (
      adminSession.role === "VIEWER" ||
      (adminSession.role as any) === "REGISTRANT" ||
      adminSession.role === "FINANCE_ADMIN"
    ) {
      throw new AuthError("Forbidden: Insufficient privileges for championship content.", 403);
    }
  }

  private static checkFeePermission(adminSession?: AdminSession) {
    if (!adminSession) return;
    if (adminSession.role !== "SUPER_ADMIN" && adminSession.role !== "FINANCE_ADMIN") {
      throw new AuthError("Forbidden: Only Finance Administrators or Super Admins can manage registration fees.", 403);
    }
  }

  // ============================================================================
  // 1. CHAMPIONSHIP MANAGEMENT & PUBLICATION (Requirements 2, 3, 4, 17)
  // ============================================================================

  /**
   * Retrieves championship by ID or URL slug with optional draft inclusion
   */
  static async getChampionship(
    idOrSlug = "champ-kukkiwon-2026",
    includeDrafts = false
  ): Promise<PublicChampionship | null> {
    const online = await isDbOnline();

    if (online) {
      try {
        const champ = await prisma.championship.findFirst({
          where: {
            OR: [{ id: idOrSlug }, { slug: idOrSlug }],
          },
          include: { site_settings: true },
        });

        if (champ) {
          const isPublished =
            champ.status !== "DRAFT" && champ.site_settings?.is_published !== false;
          if (!includeDrafts && !isPublished) {
            return null;
          }

          const availability = this.calculateRegistrationAvailability(
            champ.registration_open,
            champ.registration_close,
            champ.status
          );

          return {
            id: champ.id,
            slug: champ.slug,
            name: champ.name,
            shortName: champ.short_name || champ.name,
            edition: (champ as any).edition || "2026",
            subtitle: champ.subtitle || champ.site_settings?.subtitle || "",
            description: champ.description || champ.site_settings?.about_content || "",
            status: champ.status === "DRAFT" ? "DRAFT" : champ.status === "ARCHIVED" ? "ARCHIVED" : "PUBLISHED",
            registrationAvailability: availability,
            venue: champ.venue,
            city: champ.city,
            state: champ.state,
            country: champ.country,
            startDate: champ.start_date.toISOString(),
            endDate: champ.end_date.toISOString(),
            registrationOpen: champ.registration_open.toISOString(),
            registrationClose: champ.registration_close.toISOString(),
            lateRegistrationDeadline: null,
            currency: champ.currency,
            entryFeeAthlete: Number(champ.entry_fee_athlete),
            entryFeeCoach: Number(champ.entry_fee_coach),
            entryFeeOfficial: Number(champ.entry_fee_official),
            bannerUrl: champ.banner_url || null,
            posterUrl: champ.poster_url || champ.site_settings?.poster_url || null,
            rulesDocumentUrl: champ.rules_document_url || null,
            heroHeadline: champ.site_settings?.hero_headline || "The Pinnacle of Taekwondo Excellence",
            heroDescription: champ.site_settings?.hero_description || "",
            contactEmail: champ.site_settings?.contact_email || "contact@kukkiwoncup.org",
            contactPhone: champ.site_settings?.contact_phone || "+91 98765 43210",
            contactWhatsapp: null,
            contactAddress: champ.site_settings?.contact_address || `${champ.city}, ${champ.state}`,
            socialLinks: champ.site_settings?.social_links ? JSON.parse(champ.site_settings.social_links) : {},
            isPublished,
            updatedAt: champ.updated_at.toISOString(),
          };
        }
      } catch (err) {
        console.warn("[CmsService.getChampionship] DB fallback invoked:", err);
      }
    }

    // Fallback store lookup
    let champ = FALLBACK_CHAMPIONSHIPS.get(idOrSlug);
    if (!champ) {
      for (const item of FALLBACK_CHAMPIONSHIPS.values()) {
        if (item.slug === idOrSlug) {
          champ = item;
          break;
        }
      }
    }

    if (!champ) return null;
    if (!includeDrafts && champ.status === "DRAFT") return null;

    const availability = this.calculateRegistrationAvailability(
      new Date(champ.registration_open),
      new Date(champ.registration_close),
      champ.status
    );

    return {
      id: champ.id,
      slug: champ.slug,
      name: champ.name,
      shortName: champ.short_name,
      edition: champ.edition,
      subtitle: champ.subtitle,
      description: champ.description,
      status: champ.status,
      registrationAvailability: availability,
      venue: champ.venue,
      city: champ.city,
      state: champ.state,
      country: champ.country,
      startDate: champ.start_date,
      endDate: champ.end_date,
      registrationOpen: champ.registration_open,
      registrationClose: champ.registration_close,
      lateRegistrationDeadline: champ.late_registration_deadline,
      currency: champ.currency,
      entryFeeAthlete: champ.entry_fee_athlete,
      entryFeeCoach: champ.entry_fee_coach,
      entryFeeOfficial: champ.entry_fee_official,
      bannerUrl: champ.banner_url,
      posterUrl: champ.poster_url,
      rulesDocumentUrl: champ.rules_document_url,
      heroHeadline: champ.hero_headline,
      heroDescription: champ.hero_description,
      contactEmail: champ.contact_email,
      contactPhone: champ.contact_phone,
      contactWhatsapp: champ.contact_whatsapp,
      contactAddress: champ.contact_address,
      socialLinks: champ.social_links,
      isPublished: champ.is_published,
      updatedAt: champ.updated_at,
    };
  }

  /**
   * Updates championship information with strict RBAC, championship scoping, and audit logging
   */
  static async updateChampionship(
    championshipId: string,
    input: UpdateChampionshipCmsInput,
    adminSession?: AdminSession
  ): Promise<PublicChampionship> {
    // 1. Role validation
    this.checkContentPermission(adminSession);

    // 2. Championship scoping (IDOR protection)
    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== championshipId
    ) {
      throw new AuthError("Forbidden: You do not have permission to manage this championship.", 403);
    }

    const current = await this.getChampionship(championshipId, true);
    if (!current) {
      throw new Error(`Championship '${championshipId}' not found.`);
    }

    const online = await isDbOnline();
    if (online) {
      try {
        const updated = await prisma.championship.update({
          where: { id: championshipId },
          data: {
            name: input.name || undefined,
            short_name: input.shortName || undefined,
            subtitle: input.subtitle || undefined,
            description: input.description || undefined,
            status: input.status === "DRAFT" ? "DRAFT" : input.status === "ARCHIVED" ? "ARCHIVED" : "REGISTRATION_OPEN",
            venue: input.venue || undefined,
            city: input.city || undefined,
            state: input.state || undefined,
            country: input.country || undefined,
            start_date: input.startDate ? new Date(input.startDate) : undefined,
            end_date: input.endDate ? new Date(input.endDate) : undefined,
            registration_open: input.registrationOpen ? new Date(input.registrationOpen) : undefined,
            registration_close: input.registrationClose ? new Date(input.registrationClose) : undefined,
            banner_url: input.bannerUrl !== undefined ? input.bannerUrl : undefined,
            poster_url: input.posterUrl !== undefined ? input.posterUrl : undefined,
            rules_document_url: input.rulesDocumentUrl !== undefined ? input.rulesDocumentUrl : undefined,
          },
        });

        // Update site settings
        await prisma.siteSetting.upsert({
          where: { championship_id: championshipId },
          create: {
            championship_id: championshipId,
            hero_headline: input.heroHeadline || "The Pinnacle of Taekwondo Excellence",
            hero_description: input.heroDescription || "",
            contact_email: input.contactEmail || "contact@kukkiwoncup.org",
            contact_phone: input.contactPhone || "+91 98765 43210",
            contact_address: input.contactAddress || `${updated.city}, ${updated.state}`,
            is_published: input.status ? input.status === "PUBLISHED" : true,
          },
          update: {
            hero_headline: input.heroHeadline || undefined,
            hero_description: input.heroDescription || undefined,
            contact_email: input.contactEmail || undefined,
            contact_phone: input.contactPhone || undefined,
            contact_address: input.contactAddress || undefined,
            is_published: input.status ? input.status === "PUBLISHED" : undefined,
          },
        });
      } catch (err) {
        console.warn("[CmsService.updateChampionship] DB update fallback:", err);
      }
    }

    // Update fallback memory store
    const existingFallback = FALLBACK_CHAMPIONSHIPS.get(championshipId) || {
      id: championshipId,
      slug: current.slug,
      name: current.name,
      short_name: current.shortName,
      edition: current.edition,
      subtitle: current.subtitle,
      description: current.description,
      status: current.status,
      start_date: current.startDate,
      end_date: current.endDate,
      registration_open: current.registrationOpen,
      registration_close: current.registrationClose,
      late_registration_deadline: current.lateRegistrationDeadline,
      venue: current.venue,
      city: current.city,
      state: current.state,
      country: current.country,
      currency: current.currency,
      entry_fee_athlete: current.entryFeeAthlete,
      entry_fee_coach: current.entryFeeCoach,
      entry_fee_official: current.entryFeeOfficial,
      banner_url: current.bannerUrl,
      poster_url: current.posterUrl,
      rules_document_url: current.rulesDocumentUrl,
      hero_headline: current.heroHeadline,
      hero_description: current.heroDescription,
      contact_email: current.contactEmail,
      contact_phone: current.contactPhone,
      contact_whatsapp: current.contactWhatsapp,
      contact_address: current.contactAddress,
      social_links: current.socialLinks,
      is_published: current.isPublished,
      updated_at: new Date().toISOString(),
    };

    if (input.name) existingFallback.name = input.name;
    if (input.shortName) existingFallback.short_name = input.shortName;
    if (input.edition) existingFallback.edition = input.edition;
    if (input.subtitle) existingFallback.subtitle = input.subtitle;
    if (input.description) existingFallback.description = input.description;
    if (input.status) {
      existingFallback.status = input.status;
      existingFallback.is_published = input.status === "PUBLISHED";
    }
    if (input.venue) existingFallback.venue = input.venue;
    if (input.city) existingFallback.city = input.city;
    if (input.state) existingFallback.state = input.state;
    if (input.country) existingFallback.country = input.country;
    if (input.startDate) existingFallback.start_date = input.startDate;
    if (input.endDate) existingFallback.end_date = input.endDate;
    if (input.registrationOpen) existingFallback.registration_open = input.registrationOpen;
    if (input.registrationClose) existingFallback.registration_close = input.registrationClose;
    if (input.lateRegistrationDeadline !== undefined) existingFallback.late_registration_deadline = input.lateRegistrationDeadline;
    if (input.bannerUrl !== undefined) existingFallback.banner_url = input.bannerUrl;
    if (input.posterUrl !== undefined) existingFallback.poster_url = input.posterUrl;
    if (input.rulesDocumentUrl !== undefined) existingFallback.rules_document_url = input.rulesDocumentUrl;
    if (input.heroHeadline) existingFallback.hero_headline = input.heroHeadline;
    if (input.heroDescription) existingFallback.hero_description = input.heroDescription;
    if (input.contactEmail) existingFallback.contact_email = input.contactEmail;
    if (input.contactPhone) existingFallback.contact_phone = input.contactPhone;
    if (input.contactWhatsapp !== undefined) existingFallback.contact_whatsapp = input.contactWhatsapp;
    if (input.contactAddress) existingFallback.contact_address = input.contactAddress;
    existingFallback.updated_at = new Date().toISOString();

    FALLBACK_CHAMPIONSHIPS.set(championshipId, existingFallback);

    // Audit logging
    let auditAction = "CHAMPIONSHIP_UPDATED";
    if (input.status === "PUBLISHED" && current.status !== "PUBLISHED") {
      auditAction = "CHAMPIONSHIP_PUBLISHED";
    } else if (input.status === "DRAFT" && current.status === "PUBLISHED") {
      auditAction = "CHAMPIONSHIP_UNPUBLISHED";
    }

    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: auditAction,
        entityType: "Championship",
        entityId: championshipId,
        oldValue: { name: current.name, status: current.status },
        newValue: { name: existingFallback.name, status: existingFallback.status },
      }).catch(() => {});
    }

    return (await this.getChampionship(championshipId, true))!;
  }

  // ============================================================================
  // 2. REGISTRATION AVAILABILITY & DATES (Requirements 5, 6, 23)
  // ============================================================================

  /**
   * Evaluates the effective registration state based on dates and status
   */
  static calculateRegistrationAvailability(
    regOpen: Date | string,
    regClose: Date | string,
    status: string,
    now: Date = new Date()
  ): RegistrationAvailability {
    if (status === "DRAFT" || status === "ARCHIVED" || status === "COMPLETED") {
      return "CLOSED";
    }

    const openTime = new Date(regOpen).getTime();
    const closeTime = new Date(regClose).getTime();
    const currentTime = now.getTime();

    if (currentTime < openTime) {
      return "COMING_SOON";
    }
    if (currentTime > closeTime) {
      return "CLOSED";
    }
    return "OPEN";
  }

  /**
   * Retrieves live registration availability status for a championship
   */
  static async getRegistrationAvailability(
    championshipId = "champ-kukkiwon-2026",
    checkDate: Date = new Date()
  ): Promise<{
    status: RegistrationAvailability;
    isOpen: boolean;
    isLate: boolean;
    opensAt: string;
    closesAt: string;
    lateDeadline: string | null;
    message: string;
  }> {
    const champ = await this.getChampionship(championshipId, true);
    if (!champ) {
      return {
        status: "CLOSED",
        isOpen: false,
        isLate: false,
        opensAt: new Date().toISOString(),
        closesAt: new Date().toISOString(),
        lateDeadline: null,
        message: "Championship not found.",
      };
    }

    const status = this.calculateRegistrationAvailability(
      champ.registrationOpen,
      champ.registrationClose,
      champ.status,
      checkDate
    );

    const currentTime = checkDate.getTime();
    const lateDeadlineTime = champ.lateRegistrationDeadline
      ? new Date(champ.lateRegistrationDeadline).getTime()
      : null;
    const isLate = lateDeadlineTime ? currentTime > new Date(champ.registrationClose).getTime() && currentTime <= lateDeadlineTime : false;

    let message = "Registration is currently active.";
    if (status === "COMING_SOON") {
      message = `Registration will open on ${new Date(champ.registrationOpen).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`;
    } else if (status === "CLOSED") {
      message = "Official registration for this championship is now closed.";
    } else if (isLate) {
      message = "Late registration is currently active. Late surcharges apply.";
    }

    return {
      status,
      isOpen: status === "OPEN",
      isLate,
      opensAt: champ.registrationOpen,
      closesAt: champ.registrationClose,
      lateDeadline: champ.lateRegistrationDeadline,
      message,
    };
  }

  // ============================================================================
  // 3. CATEGORY MANAGEMENT (Requirements 7, 18)
  // ============================================================================

  static async listCategories(
    championshipId = "champ-kukkiwon-2026",
    includeInactive = false
  ): Promise<PublicCategory[]> {
    const online = await isDbOnline();
    if (online) {
      try {
        const where: any = { championship_id: championshipId };
        if (!includeInactive) where.is_active = true;

        const dbCats = await prisma.category.findMany({
          where,
          orderBy: { display_order: "asc" },
        });

        if (dbCats && dbCats.length > 0) {
          return dbCats.map((c) => ({
            id: c.id,
            championshipId: c.championship_id,
            code: c.code,
            name: c.name,
            discipline: c.discipline,
            division: c.division,
            gender: c.gender as any,
            minAge: c.min_age,
            maxAge: c.max_age,
            minWeight: c.min_weight ? Number(c.min_weight) : null,
            maxWeight: c.max_weight ? Number(c.max_weight) : null,
            beltRequirement: c.belt_requirement,
            registrationFee: c.registration_fee ? Number(c.registration_fee) : null,
            displayOrder: c.display_order,
            isActive: c.is_active,
          }));
        }
      } catch (err) {
        console.warn("[CmsService.listCategories] DB fallback invoked:", err);
      }
    }

    // Fallback store
    const list: PublicCategory[] = [];
    FALLBACK_CATEGORIES.forEach((cat) => {
      if (cat.championshipId === championshipId) {
        if (includeInactive || cat.isActive) {
          list.push(cat);
        }
      }
    });

    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async createCategory(
    input: CreateCategoryInput,
    adminSession?: AdminSession
  ): Promise<PublicCategory> {
    this.checkContentPermission(adminSession);
    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== input.championshipId
    ) {
      throw new AuthError("Forbidden: You do not have permission to manage categories for this championship.", 403);
    }

    const newId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cat: PublicCategory = {
      id: newId,
      championshipId: input.championshipId,
      code: input.code.toUpperCase().trim(),
      name: input.name.trim(),
      discipline: input.discipline.toUpperCase().trim(),
      division: input.division.toUpperCase().trim(),
      gender: input.gender,
      minAge: input.minAge ?? null,
      maxAge: input.maxAge ?? null,
      minWeight: input.minWeight ?? null,
      maxWeight: input.maxWeight ?? null,
      beltRequirement: input.beltRequirement || null,
      registrationFee: input.registrationFee ?? null,
      displayOrder: input.displayOrder ?? FALLBACK_CATEGORIES.size + 1,
      isActive: input.isActive ?? true,
    };

    FALLBACK_CATEGORIES.set(newId, cat);

    const online = await isDbOnline();
    if (online) {
      try {
        const created = await prisma.category.create({
          data: {
            id: newId,
            championship_id: cat.championshipId,
            code: cat.code,
            name: cat.name,
            discipline: cat.discipline,
            division: cat.division,
            gender: cat.gender as any,
            min_age: cat.minAge,
            max_age: cat.maxAge,
            min_weight: cat.minWeight,
            max_weight: cat.maxWeight,
            belt_requirement: cat.beltRequirement,
            registration_fee: cat.registrationFee,
            display_order: cat.displayOrder,
            is_active: cat.isActive,
          },
        });
        cat.id = created.id;
      } catch (err) {
        console.warn("[CmsService.createCategory] DB creation fallback:", err);
      }
    }

    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: "CATEGORY_CREATED",
        entityType: "Category",
        entityId: cat.id,
        newValue: { code: cat.code, name: cat.name, discipline: cat.discipline },
      }).catch(() => {});
    }

    return cat;
  }

  static async updateCategory(
    categoryId: string,
    input: UpdateCategoryInput,
    adminSession?: AdminSession
  ): Promise<PublicCategory> {
    this.checkContentPermission(adminSession);

    const current = FALLBACK_CATEGORIES.get(categoryId);
    if (!current) {
      throw new Error(`Category '${categoryId}' not found.`);
    }

    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== current.championshipId
    ) {
      throw new AuthError("Forbidden: You do not have permission to edit this category.", 403);
    }

    const updated: PublicCategory = {
      ...current,
      code: input.code ? input.code.toUpperCase().trim() : current.code,
      name: input.name ? input.name.trim() : current.name,
      discipline: input.discipline ? input.discipline.toUpperCase().trim() : current.discipline,
      division: input.division ? input.division.toUpperCase().trim() : current.division,
      gender: input.gender || current.gender,
      minAge: input.minAge !== undefined ? input.minAge : current.minAge,
      maxAge: input.maxAge !== undefined ? input.maxAge : current.maxAge,
      minWeight: input.minWeight !== undefined ? input.minWeight : current.minWeight,
      maxWeight: input.maxWeight !== undefined ? input.maxWeight : current.maxWeight,
      beltRequirement: input.beltRequirement !== undefined ? input.beltRequirement : current.beltRequirement,
      registrationFee: input.registrationFee !== undefined ? input.registrationFee : current.registrationFee,
      displayOrder: input.displayOrder !== undefined ? input.displayOrder : current.displayOrder,
      isActive: input.isActive !== undefined ? input.isActive : current.isActive,
    };

    FALLBACK_CATEGORIES.set(categoryId, updated);

    const online = await isDbOnline();
    if (online) {
      try {
        await prisma.category.update({
          where: { id: categoryId },
          data: {
            code: updated.code,
            name: updated.name,
            discipline: updated.discipline,
            division: updated.division,
            gender: updated.gender as any,
            min_age: updated.minAge,
            max_age: updated.maxAge,
            min_weight: updated.minWeight,
            max_weight: updated.maxWeight,
            belt_requirement: updated.beltRequirement,
            registration_fee: updated.registrationFee,
            display_order: updated.displayOrder,
            is_active: updated.isActive,
          },
        });
      } catch (err) {
        console.warn("[CmsService.updateCategory] DB update fallback:", err);
      }
    }

    let auditAction = "CATEGORY_UPDATED";
    if (input.isActive === true && current.isActive === false) {
      auditAction = "CATEGORY_ACTIVATED";
    } else if (input.isActive === false && current.isActive === true) {
      auditAction = "CATEGORY_DEACTIVATED";
    }

    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: auditAction,
        entityType: "Category",
        entityId: categoryId,
        oldValue: { code: current.code, isActive: current.isActive },
        newValue: { code: updated.code, isActive: updated.isActive },
      }).catch(() => {});
    }

    return updated;
  }

  static async toggleCategoryStatus(
    categoryId: string,
    isActive: boolean,
    adminSession?: AdminSession
  ): Promise<PublicCategory> {
    return this.updateCategory(categoryId, { isActive }, adminSession);
  }

  // ============================================================================
  // 4. FEE MANAGEMENT (Requirements 8, 9, 19, 24)
  // ============================================================================

  static async listFees(
    championshipId = "champ-kukkiwon-2026",
    includeInactive = false
  ): Promise<PublicFee[]> {
    const online = await isDbOnline();
    if (online) {
      try {
        const where: any = { championship_id: championshipId };
        if (!includeInactive) where.is_active = true;

        const dbFees = await prisma.registrationFee.findMany({
          where,
          include: { category: true },
          orderBy: { created_at: "asc" },
        });

        if (dbFees && dbFees.length > 0) {
          return dbFees.map((f) => ({
            id: f.id,
            championshipId: f.championship_id,
            categoryId: f.category_id,
            categoryName: f.category?.name || null,
            participantType: f.participant_type as any,
            name: f.name,
            baseFeePaise: f.amount_paise,
            baseFeeFormatted: formatPaiseToInr(f.amount_paise, f.currency),
            lateFeePaise: f.late_fee_paise,
            lateFeeFormatted: formatPaiseToInr(f.late_fee_paise, f.currency),
            currency: f.currency,
            lateFeeFrom: f.late_fee_from ? f.late_fee_from.toISOString() : null,
            effectiveFrom: f.effective_from ? f.effective_from.toISOString() : null,
            effectiveUntil: f.effective_until ? f.effective_until.toISOString() : null,
            isActive: f.is_active,
          }));
        }
      } catch (err) {
        console.warn("[CmsService.listFees] DB fallback invoked:", err);
      }
    }

    const list: PublicFee[] = [];
    FALLBACK_FEES.forEach((fee) => {
      if (fee.championshipId === championshipId) {
        if (includeInactive || fee.isActive) {
          list.push(fee);
        }
      }
    });

    return list;
  }

  static async createFee(
    input: CreateFeeInput,
    adminSession?: AdminSession
  ): Promise<PublicFee> {
    this.checkFeePermission(adminSession);
    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== input.championshipId
    ) {
      throw new AuthError("Forbidden: You do not have permission to manage fees for this championship.", 403);
    }

    const newId = `fee-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const baseFeePaise = input.baseFeePaise !== undefined ? input.baseFeePaise : (input.amountPaise || 0);
    const fee: PublicFee = {
      id: newId,
      championshipId: input.championshipId,
      categoryId: input.categoryId || null,
      categoryName: null,
      participantType: input.participantType,
      name: input.name.trim(),
      baseFeePaise,
      baseFeeFormatted: formatPaiseToInr(baseFeePaise, input.currency || "INR"),
      lateFeePaise: input.lateFeePaise || 0,
      lateFeeFormatted: formatPaiseToInr(input.lateFeePaise || 0, input.currency || "INR"),
      currency: input.currency || "INR",
      lateFeeFrom: input.lateFeeFrom || null,
      effectiveFrom: input.effectiveFrom || null,
      effectiveUntil: input.effectiveUntil || null,
      isActive: input.isActive ?? true,
    };

    FALLBACK_FEES.set(newId, fee);

    const online = await isDbOnline();
    if (online) {
      try {
        const created = await prisma.registrationFee.create({
          data: {
            id: newId,
            championship_id: fee.championshipId,
            category_id: fee.categoryId,
            participant_type: fee.participantType as any,
            name: fee.name,
            amount_paise: fee.baseFeePaise,
            late_fee_paise: fee.lateFeePaise,
            currency: fee.currency,
            late_fee_from: fee.lateFeeFrom ? new Date(fee.lateFeeFrom) : null,
            effective_from: fee.effectiveFrom ? new Date(fee.effectiveFrom) : null,
            effective_until: fee.effectiveUntil ? new Date(fee.effectiveUntil) : null,
            is_active: fee.isActive,
          },
        });
        fee.id = created.id;
      } catch (err) {
        console.warn("[CmsService.createFee] DB creation fallback:", err);
      }
    }

    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: "FEE_CREATED",
        entityType: "RegistrationFee",
        entityId: fee.id,
        newValue: { name: fee.name, amountPaise: fee.baseFeePaise, participantType: fee.participantType },
      }).catch(() => {});
    }

    return fee;
  }

  static async updateFee(
    feeId: string,
    input: UpdateFeeInput,
    adminSession?: AdminSession
  ): Promise<PublicFee> {
    this.checkFeePermission(adminSession);

    const current = FALLBACK_FEES.get(feeId);
    if (!current) {
      throw new Error(`Fee record '${feeId}' not found.`);
    }

    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== current.championshipId
    ) {
      throw new AuthError("Forbidden: You do not have permission to edit fees for this championship.", 403);
    }

    const baseFeePaise =
      input.baseFeePaise !== undefined
        ? input.baseFeePaise
        : input.amountPaise !== undefined
        ? input.amountPaise
        : current.baseFeePaise;

    const updated: PublicFee = {
      ...current,
      name: input.name ? input.name.trim() : current.name,
      baseFeePaise,
      baseFeeFormatted: formatPaiseToInr(
        baseFeePaise,
        input.currency || current.currency
      ),
      lateFeePaise: input.lateFeePaise !== undefined ? input.lateFeePaise : current.lateFeePaise,
      lateFeeFormatted: formatPaiseToInr(
        input.lateFeePaise !== undefined ? input.lateFeePaise : current.lateFeePaise,
        input.currency || current.currency
      ),
      currency: input.currency || current.currency,
      lateFeeFrom: input.lateFeeFrom !== undefined ? input.lateFeeFrom : current.lateFeeFrom,
      effectiveFrom: input.effectiveFrom !== undefined ? input.effectiveFrom : current.effectiveFrom,
      effectiveUntil: input.effectiveUntil !== undefined ? input.effectiveUntil : current.effectiveUntil,
      isActive: input.isActive !== undefined ? input.isActive : current.isActive,
    };

    FALLBACK_FEES.set(feeId, updated);

    const online = await isDbOnline();
    if (online) {
      try {
        await prisma.registrationFee.update({
          where: { id: feeId },
          data: {
            name: updated.name,
            amount_paise: updated.baseFeePaise,
            late_fee_paise: updated.lateFeePaise,
            currency: updated.currency,
            late_fee_from: updated.lateFeeFrom ? new Date(updated.lateFeeFrom) : null,
            effective_from: updated.effectiveFrom ? new Date(updated.effectiveFrom) : null,
            effective_until: updated.effectiveUntil ? new Date(updated.effectiveUntil) : null,
            is_active: updated.isActive,
          },
        });
      } catch (err) {
        console.warn("[CmsService.updateFee] DB update fallback:", err);
      }
    }

    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: "FEE_UPDATED",
        entityType: "RegistrationFee",
        entityId: feeId,
        oldValue: { amountPaise: current.baseFeePaise, name: current.name },
        newValue: { amountPaise: updated.baseFeePaise, name: updated.name },
      }).catch(() => {});
    }

    return updated;
  }

  // ============================================================================
  // 5. ANNOUNCEMENTS MANAGEMENT (Requirements 11, 20)
  // ============================================================================

  static async listAnnouncements(
    championshipId = "champ-kukkiwon-2026",
    includeDrafts = false,
    now: Date = new Date()
  ): Promise<PublicAnnouncement[]> {
    const list: PublicAnnouncement[] = [];

    FALLBACK_ANNOUNCEMENTS.forEach((ann) => {
      if (ann.championshipId === championshipId) {
        if (includeDrafts) {
          list.push(ann);
        } else {
          // Public check: Only PUBLISHED and not expired
          if (ann.status === "PUBLISHED") {
            if (!ann.expiryDate || new Date(ann.expiryDate).getTime() >= now.getTime()) {
              list.push(ann);
            }
          }
        }
      }
    });

    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async createAnnouncement(
    input: CreateAnnouncementInput,
    adminSession?: AdminSession
  ): Promise<PublicAnnouncement> {
    this.checkContentPermission(adminSession);
    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== input.championshipId
    ) {
      throw new AuthError("Forbidden: You do not have permission to publish announcements for this championship.", 403);
    }

    const newId = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const ann: PublicAnnouncement = {
      id: newId,
      championshipId: input.championshipId,
      title: input.title.trim(),
      shortDescription: input.shortDescription.trim(),
      content: input.content.trim(),
      publishDate: input.publishDate || nowIso,
      expiryDate: input.expiryDate || null,
      status: input.status,
      displayOrder: input.displayOrder ?? FALLBACK_ANNOUNCEMENTS.size + 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    FALLBACK_ANNOUNCEMENTS.set(newId, ann);

    const auditAction = ann.status === "PUBLISHED" ? "ANNOUNCEMENT_PUBLISHED" : "ANNOUNCEMENT_CREATED";
    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: auditAction,
        entityType: "Announcement",
        entityId: ann.id,
        newValue: { title: ann.title, status: ann.status },
      }).catch(() => {});
    }

    return ann;
  }

  static async updateAnnouncement(
    id: string,
    input: UpdateAnnouncementInput,
    adminSession?: AdminSession
  ): Promise<PublicAnnouncement> {
    this.checkContentPermission(adminSession);

    const current = FALLBACK_ANNOUNCEMENTS.get(id);
    if (!current) {
      throw new Error(`Announcement '${id}' not found.`);
    }

    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== current.championshipId
    ) {
      throw new AuthError("Forbidden: You do not have access to this announcement.", 403);
    }

    const updated: PublicAnnouncement = {
      ...current,
      title: input.title ? input.title.trim() : current.title,
      shortDescription: input.shortDescription ? input.shortDescription.trim() : current.shortDescription,
      content: input.content ? input.content.trim() : current.content,
      publishDate: input.publishDate || current.publishDate,
      expiryDate: input.expiryDate !== undefined ? input.expiryDate : current.expiryDate,
      status: input.status || current.status,
      displayOrder: input.displayOrder !== undefined ? input.displayOrder : current.displayOrder,
      updatedAt: new Date().toISOString(),
    };

    FALLBACK_ANNOUNCEMENTS.set(id, updated);

    let auditAction = "ANNOUNCEMENT_UPDATED";
    if (updated.status === "PUBLISHED" && current.status !== "PUBLISHED") {
      auditAction = "ANNOUNCEMENT_PUBLISHED";
    }

    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: auditAction,
        entityType: "Announcement",
        entityId: id,
        oldValue: { title: current.title, status: current.status },
        newValue: { title: updated.title, status: updated.status },
      }).catch(() => {});
    }

    return updated;
  }

  static async deleteAnnouncement(
    id: string,
    adminSession?: AdminSession
  ): Promise<{ success: boolean; id: string }> {
    this.checkContentPermission(adminSession);

    const current = FALLBACK_ANNOUNCEMENTS.get(id);
    if (!current) {
      throw new Error(`Announcement '${id}' not found.`);
    }

    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== current.championshipId
    ) {
      throw new AuthError("Forbidden: You do not have permission to delete this announcement.", 403);
    }

    FALLBACK_ANNOUNCEMENTS.delete(id);

    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: "ANNOUNCEMENT_DELETED",
        entityType: "Announcement",
        entityId: id,
        oldValue: { title: current.title },
      }).catch(() => {});
    }

    return { success: true, id };
  }

  // ============================================================================
  // 6. PUBLIC DOCUMENTS MANAGEMENT (Requirements 12)
  // ============================================================================

  static async listPublicDocuments(
    championshipId = "champ-kukkiwon-2026",
    includeDrafts = false
  ): Promise<PublicDocument[]> {
    const list: PublicDocument[] = [];
    FALLBACK_PUBLIC_DOCUMENTS.forEach((doc) => {
      if (doc.championshipId === championshipId) {
        if (includeDrafts || doc.status === "PUBLISHED") {
          list.push(doc);
        }
      }
    });

    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async createPublicDocument(
    input: CreatePublicDocumentInput,
    adminSession?: AdminSession
  ): Promise<PublicDocument> {
    this.checkContentPermission(adminSession);
    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== input.championshipId
    ) {
      throw new AuthError("Forbidden: You do not have permission to publish documents for this championship.", 403);
    }

    const newId = `pdoc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const doc: PublicDocument = {
      id: newId,
      championshipId: input.championshipId,
      title: input.title.trim(),
      documentType: input.documentType.toUpperCase().trim(),
      description: input.description.trim(),
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileSizeFormatted: input.fileSizeFormatted || "1.0 MB",
      publishDate: input.publishDate || new Date().toISOString(),
      status: input.status,
      displayOrder: input.displayOrder ?? FALLBACK_PUBLIC_DOCUMENTS.size + 1,
    };

    FALLBACK_PUBLIC_DOCUMENTS.set(newId, doc);

    const auditAction = doc.status === "PUBLISHED" ? "DOCUMENT_PUBLISHED" : "DOCUMENT_CREATED";
    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: auditAction,
        entityType: "PublicDocument",
        entityId: doc.id,
        newValue: { title: doc.title, documentType: doc.documentType },
      }).catch(() => {});
    }

    return doc;
  }

  static async updatePublicDocument(
    id: string,
    input: UpdatePublicDocumentInput,
    adminSession?: AdminSession
  ): Promise<PublicDocument> {
    this.checkContentPermission(adminSession);

    const current = FALLBACK_PUBLIC_DOCUMENTS.get(id);
    if (!current) {
      throw new Error(`Public document '${id}' not found.`);
    }

    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== current.championshipId
    ) {
      throw new AuthError("Forbidden: You do not have permission to manage this document.", 403);
    }

    const updated: PublicDocument = {
      ...current,
      title: input.title ? input.title.trim() : current.title,
      documentType: input.documentType ? input.documentType.toUpperCase().trim() : current.documentType,
      description: input.description ? input.description.trim() : current.description,
      fileUrl: input.fileUrl || current.fileUrl,
      fileName: input.fileName || current.fileName,
      fileSizeFormatted: input.fileSizeFormatted || current.fileSizeFormatted,
      publishDate: input.publishDate || current.publishDate,
      status: input.status || current.status,
      displayOrder: input.displayOrder !== undefined ? input.displayOrder : current.displayOrder,
    };

    FALLBACK_PUBLIC_DOCUMENTS.set(id, updated);

    let auditAction = "DOCUMENT_UPDATED";
    if (updated.status === "PUBLISHED" && current.status !== "PUBLISHED") {
      auditAction = "DOCUMENT_PUBLISHED";
    } else if (updated.status === "DRAFT" && current.status === "PUBLISHED") {
      auditAction = "DOCUMENT_UNPUBLISHED";
    }

    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: auditAction,
        entityType: "PublicDocument",
        entityId: id,
        oldValue: { title: current.title, status: current.status },
        newValue: { title: updated.title, status: updated.status },
      }).catch(() => {});
    }

    return updated;
  }

  static async deletePublicDocument(
    id: string,
    adminSession?: AdminSession
  ): Promise<{ success: boolean; id: string }> {
    this.checkContentPermission(adminSession);

    const current = FALLBACK_PUBLIC_DOCUMENTS.get(id);
    if (!current) {
      throw new Error(`Public document '${id}' not found.`);
    }

    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== current.championshipId
    ) {
      throw new AuthError("Forbidden: You do not have permission to delete this document.", 403);
    }

    FALLBACK_PUBLIC_DOCUMENTS.delete(id);

    if (adminSession?.user_id) {
      AuditService.logAction({
        adminUserId: adminSession.user_id,
        action: "DOCUMENT_UNPUBLISHED",
        entityType: "PublicDocument",
        entityId: id,
        oldValue: { title: current.title },
      }).catch(() => {});
    }

    return { success: true, id };
  }

  // ============================================================================
  // 7. COMPREHENSIVE PUBLIC PACKAGE AGGREGATOR (Requirement 21, 30)
  // ============================================================================

  /**
   * Retrieves complete, sanitized public package for public pages
   */
  static async getPublicChampionshipPackage(
    slugOrId = "champ-kukkiwon-2026"
  ): Promise<PublicChampionshipPackage | null> {
    const championship = await this.getChampionship(slugOrId, false);
    if (!championship) return null;

    const [categories, fees, announcements, documents] = await Promise.all([
      this.listCategories(championship.id, false),
      this.listFees(championship.id, false),
      this.listAnnouncements(championship.id, false),
      this.listPublicDocuments(championship.id, false),
    ]);

    return {
      championship,
      categories,
      fees,
      announcements,
      documents,
    };
  }
}
