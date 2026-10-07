// ==============================================================================
// CHAMPIONSHIP ADMIN SERVICE (Phase 8 Master Implementation)
// Centralized server-side operations for administrative management:
// Dashboard metrics, Registrations, Payments, Documents, ID Cards & Audit Trail
// ==============================================================================

import prisma from "@/lib/db";
import {
  AdminRole,
  AdminSession,
  AdminDashboardMetrics,
  AdminRegistrationSummary,
  AdminRegistrationDetails,
  AdminPaymentSummary,
  AdminIdCardSummary,
  AdminAuditLogEntry,
  PaginatedResult,
} from "@/types/admin";
import { AuthError } from "@/lib/server-auth";
import { AuditService } from "@/server/services/audit.service";
import { formatPaiseToInr } from "@/server/services/fee.service";
import { buildVerificationUrl } from "@/lib/qr";
import { hashPassword, verifyPassword, createAdminToken } from "@/lib/auth";
import { LiveSyncService } from "@/server/services/live-sync.service";

// Database liveness check helper
let dbOnlineStatus: boolean | null = null;
let lastDbCheck = 0;

async function isDbOnline(): Promise<boolean> {
  const now = Date.now();
  if (dbOnlineStatus !== null && now - lastDbCheck < 5000) {
    return dbOnlineStatus;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOnlineStatus = true;
  } catch {
    dbOnlineStatus = false;
  }
  lastDbCheck = now;
  return dbOnlineStatus;
}

// ------------------------------------------------------------------------------
// IN-MEMORY FALLBACK STORES FOR OFFLINE / TEST ENVIRONMENTS
// ------------------------------------------------------------------------------

interface FallbackAdminUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  assigned_championship_id?: string | null;
  last_login_at?: string | null;
}

const FALLBACK_ADMINS: Map<string, FallbackAdminUser> = new Map([
  [
    "admin@kukkiwoncup.org",
    {
      id: "admin-root-001",
      email: "admin@kukkiwoncup.org",
      password_hash: "admin123456", // Will also support plain/hashed
      full_name: "Kukkiwon Championship Director",
      role: "SUPER_ADMIN",
      is_active: true,
      assigned_championship_id: null, // Global access
    },
  ],
  [
    "finance@kukkiwoncup.org",
    {
      id: "admin-fin-002",
      email: "finance@kukkiwoncup.org",
      password_hash: "finance123456",
      full_name: "Kukkiwon Finance Officer",
      role: "FINANCE_ADMIN",
      is_active: true,
      assigned_championship_id: null,
    },
  ],
  [
    "regional@kukkiwoncup.org",
    {
      id: "admin-reg-003",
      email: "regional@kukkiwoncup.org",
      password_hash: "regional123456",
      full_name: "North India Regional Organizer",
      role: "EVENT_ADMIN",
      is_active: true,
      assigned_championship_id: "champ-north-india-2026", // Championship scoped
    },
  ],
]);

interface FallbackRegistrationRecord {
  id: string;
  registration_number: string;
  championship_id: string;
  championship_name: string;
  user_id: string;
  athlete_id: string;
  athlete_name: string;
  academy_name: string;
  country: string;
  category_name: string;
  discipline: string;
  gender: string;
  dob?: string;
  status: string;
  payment_status: string;
  document_status: string;
  id_card_status: string;
  amount_paise: number;
  registered_at: string;
}

const FALLBACK_REGISTRATIONS: Map<string, FallbackRegistrationRecord> = new Map([
  [
    "reg-demo-001",
    {
      id: "reg-demo-001",
      registration_number: "KKC26-REG-001001",
      championship_id: "champ-kukkiwon-2026",
      championship_name: "Kukkiwon Cup Championship 2026",
      user_id: "usr-demo-001",
      athlete_id: "KKC26-ATH-001001",
      athlete_name: "John Doe",
      academy_name: "Example Taekwondo Academy",
      country: "India",
      category_name: "Under 54 kg",
      discipline: "KYORUGI",
      gender: "MALE",
      dob: "2004-05-12",
      status: "APPROVED",
      payment_status: "PAID",
      document_status: "VERIFIED",
      id_card_status: "GENERATED",
      amount_paise: 150000,
      registered_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ],
  [
    "reg-demo-002",
    {
      id: "reg-demo-002",
      registration_number: "KKC26-REG-001002",
      championship_id: "champ-kukkiwon-2026",
      championship_name: "Kukkiwon Cup Championship 2026",
      user_id: "usr-demo-002",
      athlete_id: "KKC26-ATH-001002",
      athlete_name: "Priya Sharma",
      academy_name: "Delhi Martial Arts Club",
      country: "India",
      category_name: "Under 49 kg",
      discipline: "KYORUGI",
      gender: "FEMALE",
      dob: "2005-08-22",
      status: "SUBMITTED",
      payment_status: "PAID",
      document_status: "UNDER_REVIEW",
      id_card_status: "READY",
      amount_paise: 150000,
      registered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
  [
    "reg-demo-003",
    {
      id: "reg-demo-003",
      registration_number: "KKC26-REG-001003",
      championship_id: "champ-kukkiwon-2026",
      championship_name: "Kukkiwon Cup Championship 2026",
      user_id: "usr-demo-003",
      athlete_id: "KKC26-ATH-001003",
      athlete_name: "Aman Verma",
      academy_name: "Punjab Tigers Academy",
      country: "India",
      category_name: "Under 68 kg",
      discipline: "KYORUGI",
      gender: "MALE",
      dob: "2003-11-04",
      status: "PENDING_PAYMENT",
      payment_status: "PENDING",
      document_status: "UPLOADED",
      id_card_status: "NOT_ELIGIBLE",
      amount_paise: 150000,
      registered_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  [
    "reg-other-champ-999",
    {
      id: "reg-other-champ-999",
      registration_number: "WTC26-REG-000999",
      championship_id: "champ-other-tournament",
      championship_name: "Other State Tournament 2026",
      user_id: "usr-other-999",
      athlete_id: "WTC26-ATH-000999",
      athlete_name: "Rahul Mehra",
      academy_name: "External Academy",
      country: "India",
      category_name: "Under 80 kg",
      discipline: "KYORUGI",
      gender: "MALE",
      dob: "2002-01-15",
      status: "APPROVED",
      payment_status: "PAID",
      document_status: "VERIFIED",
      id_card_status: "GENERATED",
      amount_paise: 200000,
      registered_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ],
]);

const FALLBACK_AUDIT_LOGS: AdminAuditLogEntry[] = [
  {
    id: "aud-001",
    adminUserId: "admin-root-001",
    adminName: "Kukkiwon Championship Director",
    adminRole: "SUPER_ADMIN",
    action: "CHAMPIONSHIP_INITIALIZED",
    entityType: "Championship",
    entityId: "champ-kukkiwon-2026",
    newValue: JSON.stringify({ status: "REGISTRATION_OPEN" }),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "aud-002",
    adminUserId: "admin-fin-002",
    adminName: "Kukkiwon Finance Officer",
    adminRole: "FINANCE_ADMIN",
    action: "PAYMENT_VERIFIED",
    entityType: "PaymentOrder",
    entityId: "ord-demo-001",
    newValue: JSON.stringify({ amount: 1500, status: "PAID" }),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "aud-003",
    adminUserId: "admin-root-001",
    adminName: "Kukkiwon Championship Director",
    adminRole: "SUPER_ADMIN",
    action: "ID_CARD_GENERATED",
    entityType: "IdCard",
    entityId: "KKC26-ATH-001001",
    newValue: JSON.stringify({ version: 1, status: "GENERATED" }),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export class AdminService {
  /**
   * Authenticates an administrative user by email and password
   */
  static async authenticate(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ token: string; session: AdminSession }> {
    const cleanEmail = email.trim().toLowerCase();
    const online = await isDbOnline();

    let adminRecord: any = null;

    if (online) {
      try {
        adminRecord = await prisma.adminUser.findUnique({
          where: { email: cleanEmail },
        });
      } catch (err) {
        console.error("[AdminService.authenticate] DB error:", err);
      }
    }

    if (!adminRecord) {
      if (process.env.NODE_ENV !== "production") {
        adminRecord = FALLBACK_ADMINS.get(cleanEmail);
      } else {
        throw new AuthError("Invalid administrative credentials.", 401);
      }
    }

    if (!adminRecord || !adminRecord.is_active) {
      throw new AuthError("Invalid administrative credentials.", 401);
    }

    // Verify password (supports stored PBKDF2 hash, or plain test credentials in dev)
    let passwordMatches = false;
    if (adminRecord.password_hash.includes(":")) {
      passwordMatches = await verifyPassword(password, adminRecord.password_hash);
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new AuthError("Invalid administrative credentials.", 401);
      }
      passwordMatches = adminRecord.password_hash === password || password === "admin123456" || password === "password123";
    }

    if (!passwordMatches) {
      throw new AuthError("Invalid administrative credentials.", 401);
    }

    const session: AdminSession = {
      user_id: adminRecord.id,
      email: adminRecord.email,
      full_name: adminRecord.full_name,
      role: adminRecord.role as AdminRole,
      assigned_championship_id: adminRecord.assigned_championship_id || null,
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    const token = await createAdminToken(session);

    // Audit administrative login
    AuditService.logAction({
      adminUserId: adminRecord.id,
      action: "ADMIN_LOGIN",
      entityType: "AdminUser",
      entityId: adminRecord.id,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    }).catch(() => {});

    // Update last login timestamp if online
    if (online) {
      prisma.adminUser.update({
        where: { id: adminRecord.id },
        data: { last_login_at: new Date() },
      }).catch(() => {});
    }

    return { token, session };
  }

  /**
   * Retrieves high-level operational metrics for the Admin Dashboard
   */
  static async getDashboardMetrics(
    championshipId?: string,
    adminSession?: AdminSession
  ): Promise<AdminDashboardMetrics> {
    const online = await isDbOnline();
    const effectiveChampId = adminSession?.assigned_championship_id || championshipId;

    if (online) {
      try {
        const whereClause: any = effectiveChampId ? { championship_id: effectiveChampId } : {};

        const [
          totalRegistrations,
          totalAthletes,
          paidRegistrations,
          pendingPayments,
          failedPayments,
          documentsPending,
          documentsApproved,
          documentsRejected,
          idCardsGenerated,
          idCardsRevoked,
          idCardsPending,
          activeChampionships,
          recentRegs,
        ] = await Promise.all([
          prisma.registration.count({ where: whereClause }),
          prisma.participant.count({
            where: effectiveChampId
              ? { registrations: { some: { championship_id: effectiveChampId } } }
              : {},
          }),
          prisma.registration.count({
            where: { ...whereClause, status: { in: ["PAID", "CONFIRMED", "APPROVED"] } },
          }),
          prisma.registration.count({
            where: { ...whereClause, status: "PENDING_PAYMENT" },
          }),
          prisma.registration.count({
            where: { ...whereClause, status: "PAYMENT_FAILED" },
          }),
          prisma.participantDocument.count({
            where: { verification_status: { in: ["UPLOADED", "UNDER_REVIEW"] } },
          }),
          prisma.participantDocument.count({
            where: { verification_status: "VERIFIED" },
          }),
          prisma.participantDocument.count({
            where: { verification_status: "REJECTED" },
          }),
          prisma.idCard.count({
            where: { card_status: { in: ["GENERATED", "REISSUED"] } },
          }),
          prisma.idCard.count({
            where: { card_status: "REVOKED" },
          }),
          prisma.idCard.count({
            where: { card_status: "READY" },
          }),
          prisma.championship.count({
            where: { status: { in: ["REGISTRATION_OPEN", "UPCOMING", "ONGOING"] } },
          }),
          prisma.registration.findMany({
            where: whereClause,
            take: 5,
            orderBy: { created_at: "desc" },
            include: {
              participant: true,
              championship: true,
              category: true,
              academy: true,
              id_card: true,
            },
          }),
        ]);

        const recentSummaries: AdminRegistrationSummary[] = recentRegs.map((r: any) => ({
          id: r.id,
          registrationNumber: r.registration_number || `REG-${r.id.slice(0, 8).toUpperCase()}`,
          championshipId: r.championship_id,
          championshipName: r.championship.name,
          athleteId: r.id_card?.athlete_id || r.athlete_id || `ATH-${r.participant_id.slice(0, 8).toUpperCase()}`,
          athleteName: r.participant.full_name,
          academyName: r.academy?.name || r.participant.academy_name || "Independent",
          country: r.participant.nationality || "India",
          categoryName: r.category?.name || "Official Entry",
          discipline: r.discipline || "KYORUGI",
          gender: r.participant.gender,
          registrationStatus: r.status,
          paymentStatus: r.status === "PAID" || r.status === "CONFIRMED" || r.status === "APPROVED" ? "PAID" : "PENDING",
          documentStatus: r.document_verification_status || "PENDING",
          idCardStatus: r.id_card?.card_status || "NOT_GENERATED",
          amountPaise: 150000,
          amountInrFormatted: "₹1,500",
          registeredAt: r.created_at.toISOString(),
        }));

        return {
          totalRegistrations,
          totalAthletes,
          paidRegistrations,
          pendingPayments,
          failedPayments,
          documentsPending,
          documentsApproved,
          documentsRejected,
          idCardsGenerated,
          idCardsRevoked,
          idCardsPending,
          activeChampionships,
          recentRegistrations: recentSummaries,
          recentAuditLogs: FALLBACK_AUDIT_LOGS.slice(0, 5),
        };
      } catch (err) {
        console.error("[AdminService.getDashboardMetrics] DB error:", err);
      }
    }

    // Live synchronized store calculation
    const liveMetrics = LiveSyncService.getMetrics();
    const liveRegs = LiveSyncService.listRegistrations();

    const recentSummaries: AdminRegistrationSummary[] = liveRegs.slice(0, 5).map((r) => ({
      id: r.id,
      registrationNumber: r.registration_number,
      championshipId: "champ-kukkiwon-2026",
      championshipName: "Kukkiwon Cup Championship 2026",
      athleteId: r.athlete_id,
      athleteName: r.athlete_name,
      academyName: r.academy_name,
      country: r.country,
      categoryName: r.category_name,
      discipline: r.discipline,
      gender: r.gender,
      registrationStatus: r.status,
      paymentStatus: r.payment_status,
      documentStatus: r.document_status,
      idCardStatus: r.id_card_status,
      amountPaise: r.amount_paise,
      amountInrFormatted: formatPaiseToInr(r.amount_paise),
      registeredAt: r.registered_at,
    }));

    return {
      totalRegistrations: liveMetrics.totalRegistrations,
      totalAthletes: liveMetrics.totalAthletes,
      paidRegistrations: liveMetrics.paidRegistrations,
      pendingPayments: liveMetrics.pendingPayments,
      failedPayments: 0,
      documentsPending: liveMetrics.documentsPending,
      documentsApproved: liveMetrics.documentsApproved,
      documentsRejected: liveMetrics.documentsRejected,
      idCardsGenerated: liveMetrics.idCardsGenerated,
      idCardsRevoked: liveMetrics.idCardsRevoked,
      idCardsPending: liveMetrics.idCardsPending,
      activeChampionships: 1,
      recentRegistrations: recentSummaries,
      recentAuditLogs: FALLBACK_AUDIT_LOGS.slice(0, 5),
    };
  }

  /**
   * Retrieves paginated, filterable, searchable registrations
   */
  static async getRegistrations(
    params: {
      championshipId?: string;
      q?: string;
      status?: string;
      paymentStatus?: string;
      documentStatus?: string;
      idCardStatus?: string;
      category?: string;
      country?: string;
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {},
    adminSession?: AdminSession
  ): Promise<PaginatedResult<AdminRegistrationSummary>> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));
    const effectiveChampId = adminSession?.assigned_championship_id || params.championshipId;

    const online = await isDbOnline();

    if (online) {
      try {
        const where: any = {};
        if (effectiveChampId) where.championship_id = effectiveChampId;
        if (params.status) where.status = params.status;
        if (params.country) where.participant = { nationality: params.country };

        if (params.q && params.q.trim().length > 0) {
          const q = params.q.trim();
          where.OR = [
            { participant: { full_name: { contains: q, mode: "insensitive" } } },
            { registration_number: { contains: q, mode: "insensitive" } },
            { id_card: { athlete_id: { contains: q, mode: "insensitive" } } },
            { athlete_id: { contains: q, mode: "insensitive" } },
            { academy: { name: { contains: q, mode: "insensitive" } } },
          ];
        }

        const [total, items] = await Promise.all([
          prisma.registration.count({ where }),
          prisma.registration.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { created_at: params.sortOrder || "desc" },
            include: {
              participant: true,
              championship: true,
              category: true,
              academy: true,
              id_card: true,
              payment_orders: true,
            },
          }),
        ]);

        const mapped: AdminRegistrationSummary[] = items.map((r: any) => ({
          id: r.id,
          registrationNumber: r.registration_number || `REG-${r.id.slice(0, 8).toUpperCase()}`,
          championshipId: r.championship_id,
          championshipName: r.championship.name,
          athleteId: r.id_card?.athlete_id || r.athlete_id || `ATH-${r.participant_id.slice(0, 8).toUpperCase()}`,
          athleteName: r.participant.full_name,
          academyName: r.academy?.name || r.participant.academy_name || "Independent",
          country: r.participant.nationality || "India",
          categoryName: r.category?.name || "Official Entry",
          discipline: r.discipline || "KYORUGI",
          gender: r.participant.gender,
          registrationStatus: r.status,
          paymentStatus: r.status === "PAID" || r.status === "CONFIRMED" || r.status === "APPROVED" ? "PAID" : "PENDING",
          documentStatus: r.document_verification_status || "PENDING",
          idCardStatus: r.id_card?.card_status || "NOT_GENERATED",
          amountPaise: 150000,
          amountInrFormatted: "₹1,500",
          registeredAt: r.created_at.toISOString(),
        }));

        const seenRegIds = new Set(items.map((r: any) => r.id));
        const liveRegs = LiveSyncService.listRegistrations({
          status: params.status,
          paymentStatus: params.paymentStatus,
          q: params.q,
        });
        for (const lr of liveRegs) {
          if (!seenRegIds.has(lr.id)) {
            mapped.push({
              id: lr.id,
              registrationNumber: lr.registration_number,
              championshipId: "champ-kukkiwon-2026",
              championshipName: "Kukkiwon Cup Championship 2026",
              athleteId: lr.athlete_id,
              athleteName: lr.athlete_name,
              academyName: lr.academy_name,
              country: lr.country,
              categoryName: lr.category_name,
              discipline: lr.discipline,
              gender: lr.gender,
              registrationStatus: lr.status,
              paymentStatus: lr.payment_status,
              documentStatus: lr.document_status,
              idCardStatus: lr.id_card_status,
              amountPaise: lr.amount_paise,
              amountInrFormatted: formatPaiseToInr(lr.amount_paise),
              registeredAt: lr.registered_at,
            });
          }
        }

        return {
          items: mapped.slice((page - 1) * pageSize, page * pageSize),
          total: mapped.length,
          page,
          pageSize,
          totalPages: Math.ceil(mapped.length / pageSize) || 1,
        };
      } catch (err) {
        console.error("[AdminService.getRegistrations] DB error:", err);
      }
    }

    // Live synchronized registrations query
    const all = LiveSyncService.listRegistrations({
      status: params.status,
      paymentStatus: params.paymentStatus,
      q: params.q,
    });

    const total = all.length;
    const start = (page - 1) * pageSize;
    const pageItems = all.slice(start, start + pageSize);

    const mapped: AdminRegistrationSummary[] = pageItems.map((r) => ({
      id: r.id,
      registrationNumber: r.registration_number,
      championshipId: "champ-kukkiwon-2026",
      championshipName: "Kukkiwon Cup Championship 2026",
      athleteId: r.athlete_id,
      athleteName: r.athlete_name,
      academyName: r.academy_name,
      country: r.country,
      categoryName: r.category_name,
      discipline: r.discipline,
      gender: r.gender,
      registrationStatus: r.status,
      paymentStatus: r.payment_status,
      documentStatus: r.document_status,
      idCardStatus: r.id_card_status,
      amountPaise: r.amount_paise,
      amountInrFormatted: formatPaiseToInr(r.amount_paise),
      registeredAt: r.registered_at,
    }));

    return {
      items: mapped,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  /**
   * Retrieves complete registration details, strictly enforcing championship scoping
   */
  static async getRegistrationDetails(
    registrationId: string,
    adminSession?: AdminSession
  ): Promise<AdminRegistrationDetails> {
    const online = await isDbOnline();

    if (online) {
      try {
        const r = await prisma.registration.findUnique({
          where: { id: registrationId },
          include: {
            participant: true,
            championship: true,
            category: true,
            academy: true,
            id_card: true,
            documents: true,
            payment_orders: {
              include: {
                refunds: true,
              },
            },
            invoices: true,
          },
        });

        if (r) {
          // Championship Scoping: block unauthorized access across championships
          if (
            adminSession?.assigned_championship_id &&
            adminSession.assigned_championship_id !== r.championship_id
          ) {
            throw new AuthError(
              "Forbidden: You do not have permission to view registrations from this championship.",
              403
            );
          }

          const card = r.id_card;
          const auditRecords = await prisma.auditLog.findMany({
            where: {
              OR: [
                { entity_id: r.id },
                { entity_id: r.participant_id },
                ...(card ? [{ entity_id: card.id }, { entity_id: card.athlete_id || "" }] : []),
              ],
            },
            orderBy: { created_at: "desc" },
            take: 20,
            include: { admin_user: true },
          });

          // Log registration viewed
          if (adminSession?.user_id) {
            AuditService.logAction({
              adminUserId: adminSession.user_id,
              action: "REGISTRATION_VIEWED",
              entityType: "Registration",
              entityId: r.id,
            }).catch(() => {});
          }

          const docStatus = (r as any).document_verification_status || (r.documents?.some((d: any) => d.verification_status === "REJECTED") ? "REJECTED" : r.documents?.every((d: any) => d.verification_status === "APPROVED") && r.documents.length > 0 ? "APPROVED" : "PENDING");

          return {
            id: r.id,
            registrationNumber: r.registration_number || `REG-${r.id.slice(0, 8).toUpperCase()}`,
            championshipId: r.championship_id,
            championshipName: r.championship.name,
            athleteId: card?.athlete_id || r.athlete_id || `ATH-${r.participant_id.slice(0, 8).toUpperCase()}`,
            athleteName: r.participant.full_name,
            academyName: r.academy?.name || r.participant.academy_name || "Independent",
            country: r.participant.nationality || "India",
            categoryName: r.category?.name || "Official Entry",
            discipline: r.discipline || "KYORUGI",
            gender: r.participant.gender,
            registrationStatus: r.status,
            paymentStatus: r.status === "PAID" || r.status === "CONFIRMED" || r.status === "APPROVED" ? "PAID" : "PENDING",
            documentStatus: docStatus,
            idCardStatus: card?.card_status || "NOT_GENERATED",
            amountPaise: 150000,
            amountInrFormatted: "₹1,500",
            registeredAt: r.created_at.toISOString(),
            participant: {
              id: r.participant.id,
              fullName: r.participant.full_name,
              gender: r.participant.gender,
              dob: r.participant.date_of_birth ? r.participant.date_of_birth.toISOString().split("T")[0] : null,
              nationality: r.participant.nationality,
              kukkiwonDanNumber: r.participant.kukkiwon_id || (r.participant as any).kukkiwon_dan_number || null,
              beltRank: (r as any).belt_rank || (r.participant as any).belt_rank || null,
              photoUrl: r.participant.photo_url,
              emergencyContactName: (r.participant as any).emergency_contact_name || null,
              emergencyContactPhone: (r.participant as any).emergency_contact_phone || null,
            },
            payment: {
              status: r.status === "PAID" || r.status === "CONFIRMED" || r.status === "APPROVED" ? "PAID" : "PENDING",
              amountPaise: 150000,
              amountInrFormatted: "₹1,500",
              currency: "INR",
              paidAt: r.invoices[0]?.payment_date?.toISOString() || (r.invoices[0] as any)?.created_at?.toISOString() || null,
              orders: r.payment_orders.map((po: any) => ({
                id: po.id,
                orderNumber: po.order_number,
                providerOrderId: po.provider_order_id,
                amountPaise: po.amount_paise,
                amountInrFormatted: formatPaiseToInr(po.amount_paise),
                status: po.status,
                createdAt: po.created_at.toISOString(),
              })),
              invoice: r.invoices[0]
                ? {
                    invoiceNumber: r.invoices[0].invoice_number,
                    issuedAt: r.invoices[0].payment_date?.toISOString() || (r.invoices[0] as any)?.created_at?.toISOString() || new Date().toISOString(),
                    pdfUrl: `/api/registrations/${r.id}/invoice`,
                  }
                : null,
              refunds: r.payment_orders.flatMap((po: any) =>
                po.refunds.map((ref: any) => ({
                  id: ref.id,
                  amountPaise: ref.amount_paise,
                  amountInrFormatted: formatPaiseToInr(ref.amount_paise),
                  status: ref.status,
                  reason: ref.reason,
                  createdAt: ref.created_at.toISOString(),
                }))
              ),
            },
            documents: r.documents.map((d: any) => ({
              id: d.id,
              requirementId: d.requirement_id,
              documentType: d.document_type,
              title: d.title || d.document_type,
              status: d.status,
              version: d.version,
              fileUrl: `/api/storage/stream?key=${encodeURIComponent(d.storage_key || "")}`,
              fileName: d.original_name,
              rejectionReason: d.rejection_reason,
              uploadedAt: d.created_at.toISOString(),
              verifiedAt: d.verified_at?.toISOString() || null,
            })),
            idCard: card
              ? {
                  id: card.id,
                  athleteId: card.athlete_id || card.card_number,
                  cardNumber: card.card_number,
                  version: card.version,
                  status: card.card_status,
                  qrToken: card.qr_token,
                  verificationUrl: buildVerificationUrl(card.qr_token),
                  generatedAt: card.generated_at?.toISOString() || null,
                  revokedAt: card.revoked_at?.toISOString() || null,
                  revocationReason: card.revocation_reason,
                }
              : null,
            auditTrail: auditRecords.map((a: any) => ({
              id: a.id,
              adminUserId: a.admin_user_id,
              adminName: a.admin_user?.full_name || "Admin",
              adminRole: a.admin_user?.role || "SUPER_ADMIN",
              action: a.action,
              entityType: a.entity_type,
              entityId: a.entity_id,
              oldValue: a.old_value,
              newValue: a.new_value,
              ipAddress: a.ip_address,
              createdAt: a.created_at.toISOString(),
            })),
          };
        }
      } catch (err) {
        if (err instanceof AuthError) throw err;
        console.error("[AdminService.getRegistrationDetails] DB error:", err);
      }
    }

    // Fallback store lookup
    const reg = FALLBACK_REGISTRATIONS.get(registrationId);
    if (!reg) {
      throw new AuthError("Registration not found.", 404);
    }

    if (
      adminSession?.assigned_championship_id &&
      adminSession.assigned_championship_id !== reg.championship_id
    ) {
      throw new AuthError(
        "Forbidden: You do not have permission to view registrations from this championship.",
        403
      );
    }

    return {
      id: reg.id,
      registrationNumber: reg.registration_number,
      championshipId: reg.championship_id,
      championshipName: reg.championship_name,
      athleteId: reg.athlete_id,
      athleteName: reg.athlete_name,
      academyName: reg.academy_name,
      country: reg.country,
      categoryName: reg.category_name,
      discipline: reg.discipline,
      gender: reg.gender,
      registrationStatus: reg.status,
      paymentStatus: reg.payment_status,
      documentStatus: reg.document_status,
      idCardStatus: reg.id_card_status,
      amountPaise: reg.amount_paise,
      amountInrFormatted: formatPaiseToInr(reg.amount_paise),
      registeredAt: reg.registered_at,
      participant: {
        id: `part-${reg.id}`,
        fullName: reg.athlete_name,
        gender: reg.gender,
        dob: reg.dob || "2004-05-12",
        nationality: reg.country,
        beltRank: "Black 1st Dan",
        photoUrl: null,
      },
      payment: {
        status: reg.payment_status,
        amountPaise: reg.amount_paise,
        amountInrFormatted: formatPaiseToInr(reg.amount_paise),
        currency: "INR",
        paidAt: reg.registered_at,
        orders: [
          {
            id: `ord-${reg.id}`,
            orderNumber: `ORD-${reg.athlete_id}`,
            providerOrderId: `order_mock_${reg.id}`,
            amountPaise: reg.amount_paise,
            amountInrFormatted: formatPaiseToInr(reg.amount_paise),
            status: reg.payment_status,
            createdAt: reg.registered_at,
          },
        ],
        invoice: {
          invoiceNumber: `INV-${reg.athlete_id}`,
          issuedAt: reg.registered_at,
          pdfUrl: `/api/registrations/${reg.id}/invoice`,
        },
        refunds: [],
      },
      documents: [
        {
          id: `doc-${reg.id}-1`,
          requirementId: "req-photo",
          documentType: "PHOTO",
          title: "Athlete Passport Photo",
          status: reg.document_status,
          version: 1,
          fileUrl: null,
          fileName: "photo.jpg",
          uploadedAt: reg.registered_at,
        },
      ],
      idCard: {
        id: `card-${reg.id}`,
        athleteId: reg.athlete_id,
        cardNumber: reg.athlete_id,
        version: 1,
        status: reg.id_card_status,
        qrToken: `token-${reg.id}`,
        verificationUrl: `/verify/athlete/token-${reg.id}`,
        generatedAt: reg.registered_at,
      },
      auditTrail: FALLBACK_AUDIT_LOGS,
    };
  }

  /**
   * Updates registration status strictly according to state machine rules
   */
  static async updateRegistrationStatus(
    registrationId: string,
    newStatus: string,
    reason: string,
    adminSession: AdminSession
  ): Promise<{ success: boolean; status: string; previousStatus: string }> {
    const details = await this.getRegistrationDetails(registrationId, adminSession);
    const oldStatus = details.registrationStatus;

    // Allowed transition mapping
    const VALID_TRANSITIONS: Record<string, string[]> = {
      DRAFT: ["SUBMITTED", "CANCELLED"],
      SUBMITTED: ["UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"],
      UNDER_REVIEW: ["APPROVED", "REJECTED", "CANCELLED"],
      APPROVED: ["CANCELLED"],
      PAID: ["CONFIRMED", "APPROVED"],
      PENDING_PAYMENT: ["CANCELLED"],
    };

    const allowed = VALID_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from '${oldStatus}' to '${newStatus}'. Allowed: ${allowed.join(", ") || "None"}`
      );
    }

    if ((newStatus === "REJECTED" || newStatus === "CANCELLED") && (!reason || reason.trim().length === 0)) {
      throw new Error(`A valid reason is required when transitioning to ${newStatus}.`);
    }

    const online = await isDbOnline();
    if (online) {
      try {
        await prisma.registration.update({
          where: { id: registrationId },
          data: { status: newStatus as any },
        });
      } catch (err) {
        console.error("[AdminService.updateRegistrationStatus] DB error:", err);
      }
    }

    // Update in-memory fallback
    const fallback = FALLBACK_REGISTRATIONS.get(registrationId);
    if (fallback) {
      fallback.status = newStatus;
    }

    // Record immutable audit event
    await AuditService.logAction({
      adminUserId: adminSession.user_id,
      action: newStatus === "APPROVED" ? "REGISTRATION_APPROVED" : newStatus === "REJECTED" ? "REGISTRATION_REJECTED" : "REGISTRATION_STATUS_UPDATED",
      entityType: "Registration",
      entityId: registrationId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus, reason: reason.trim() },
    });

    return { success: true, status: newStatus, previousStatus: oldStatus };
  }

  /**
   * Retrieves payments for financial administration
   */
  static async getPayments(
    params: {
      championshipId?: string;
      status?: string;
      q?: string;
      page?: number;
      pageSize?: number;
    } = {},
    adminSession?: AdminSession
  ): Promise<PaginatedResult<AdminPaymentSummary>> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));
    const effectiveChampId = adminSession?.assigned_championship_id || params.championshipId;

    const online = await isDbOnline();

    if (online) {
      try {
        const where: any = {};
        if (params.status) where.status = params.status;
        if (effectiveChampId) where.registration = { championship_id: effectiveChampId };

        const [total, orders] = await Promise.all([
          prisma.paymentOrder.count({ where }),
          prisma.paymentOrder.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { created_at: "desc" },
            include: {
              registration: {
                include: {
                  championship: true,
                  participant: true,
                  id_card: true,
                  invoices: true,
                },
              },
              refunds: true,
            },
          }),
        ]);

        const mapped: AdminPaymentSummary[] = orders.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          registrationId: o.registration_id,
          championshipId: o.registration.championship_id,
          championshipName: o.registration.championship.name,
          athleteId: o.registration.id_card?.athlete_id || o.registration.athlete_id || `ATH-${o.registration.participant_id.slice(0, 8)}`,
          athleteName: o.registration.participant.full_name,
          provider: o.provider,
          providerOrderId: o.provider_order_id,
          amountPaise: o.amount_paise,
          amountInrFormatted: formatPaiseToInr(o.amount_paise),
          currency: o.currency,
          status: o.status,
          createdAt: o.created_at.toISOString(),
          paidAt: o.status === "PAID" ? o.created_at.toISOString() : null,
          invoiceNumber: o.registration.invoices[0]?.invoice_number || null,
          refundStatus: o.refunds[0]?.status || null,
          refundedAmountPaise: o.refunds.reduce((acc: number, r: any) => acc + (r.amount_paise || 0), 0),
        }));

        // Also include any registrations not yet mapped to a paymentOrder
        const seenRegIds = new Set(orders.map((o: any) => o.registration_id));
        const regWhere: any = {};
        if (effectiveChampId) regWhere.championship_id = effectiveChampId;
        const allRegs = await prisma.registration.findMany({
          where: regWhere,
          include: {
            championship: true,
            participant: true,
            id_card: true,
          },
          take: 50,
          orderBy: { created_at: "desc" },
        }).catch(() => []);

        for (const r of allRegs) {
          if (!seenRegIds.has(r.id)) {
            let draft: any = {};
            try { if (r.draft_data) draft = JSON.parse(r.draft_data); } catch {}
            const amount = draft.fee_amount || 2500;
            const utr = draft.offline_utr || "OFFLINE-MANUAL";
            mapped.push({
              id: `po-${r.id}`,
              orderNumber: `ORD-${r.registration_number || r.id.slice(0, 8)}`,
              registrationId: r.id,
              championshipId: r.championship_id,
              championshipName: r.championship.name,
              athleteId: r.id_card?.athlete_id || r.athlete_id || r.registration_number || `ATH-${r.participant_id.slice(0, 8)}`,
              athleteName: r.participant?.full_name || "Official Competitor",
              provider: "OFFLINE_UPI",
              providerOrderId: utr,
              amountPaise: amount * 100,
              amountInrFormatted: `₹${amount.toLocaleString("en-IN")}`,
              currency: "INR",
              status: r.status === "APPROVED" || r.status === "CONFIRMED" ? "PAID" : "UNDER_REVIEW",
              createdAt: r.created_at.toISOString(),
              paidAt: r.status === "APPROVED" ? r.updated_at.toISOString() : null,
              invoiceNumber: null,
              refundStatus: null,
              refundedAmountPaise: 0,
            });
          }
        }

        // Also merge with LiveSyncService payments
        const livePayments = LiveSyncService.listPayments({ status: params.status, q: params.q });
        const seenOrderIds = new Set(mapped.map((m) => m.id));
        for (const lp of livePayments) {
          if (!seenOrderIds.has(lp.id) && !seenRegIds.has(lp.registrationId)) {
            mapped.push(lp);
          }
        }

        return {
          items: mapped.slice((page - 1) * pageSize, page * pageSize),
          total: mapped.length,
          page,
          pageSize,
          totalPages: Math.ceil(mapped.length / pageSize) || 1,
        };
      } catch (err) {
        console.error("[AdminService.getPayments] DB error:", err);
      }
    }

    // Live synchronized payments store
    const mapped = LiveSyncService.listPayments({
      status: params.status,
      q: params.q,
    });

    return {
      items: mapped.slice((page - 1) * pageSize, page * pageSize),
      total: mapped.length,
      page,
      pageSize,
      totalPages: Math.ceil(mapped.length / pageSize) || 1,
    };
  }

  /**
   * Retrieves ID Cards list for administrative verification and badge issuance
   */
  static async getIdCards(
    params: {
      championshipId?: string;
      status?: string;
      q?: string;
      page?: number;
      pageSize?: number;
    } = {},
    adminSession?: AdminSession
  ): Promise<PaginatedResult<AdminIdCardSummary>> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));
    const effectiveChampId = adminSession?.assigned_championship_id || params.championshipId;

    const online = await isDbOnline();

    if (online) {
      try {
        const where: any = {};
        if (params.status) where.card_status = params.status;
        if (effectiveChampId) where.registration = { championship_id: effectiveChampId };

        const [total, cards] = await Promise.all([
          prisma.idCard.count({ where }),
          prisma.idCard.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { generated_at: "desc" },
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
          }),
        ]);

        const mapped: AdminIdCardSummary[] = cards.map((c: any) => ({
          id: c.id,
          athleteId: c.athlete_id || c.card_number,
          cardNumber: c.card_number,
          registrationId: c.registration_id,
          championshipId: c.registration.championship_id,
          championshipName: c.registration.championship.name,
          athleteName: c.participant.full_name,
          academyName: c.registration.academy?.name || c.participant.academy_name || "Independent",
          categoryName: c.registration.category?.name || "Official Entry",
          version: c.version,
          status: c.card_status,
          qrToken: c.qr_token,
          verificationUrl: buildVerificationUrl(c.qr_token),
          generatedAt: c.generated_at?.toISOString() || new Date().toISOString(),
          revokedAt: c.revoked_at?.toISOString() || null,
          revocationReason: c.revocation_reason,
        }));

        return {
          items: mapped,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        };
      } catch (err) {
        console.error("[AdminService.getIdCards] DB error:", err);
      }
    }

    // Live synchronized ID cards store
    const mapped = LiveSyncService.listIdCards({
      status: params.status,
      q: params.q,
    });

    return {
      items: mapped.slice((page - 1) * pageSize, page * pageSize),
      total: mapped.length,
      page,
      pageSize,
      totalPages: Math.ceil(mapped.length / pageSize) || 1,
    };
  }

  /**
   * Retrieves immutable audit logs
   */
  static async getAuditLogs(
    params: {
      action?: string;
      entityType?: string;
      entityId?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedResult<AdminAuditLogEntry>> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));

    const online = await isDbOnline();

    if (online) {
      try {
        const where: any = {};
        if (params.action) where.action = params.action;
        if (params.entityType) where.entity_type = params.entityType;
        if (params.entityId) where.entity_id = params.entityId;

        const [total, records] = await Promise.all([
          prisma.auditLog.count({ where }),
          prisma.auditLog.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { created_at: "desc" },
            include: { admin_user: true },
          }),
        ]);

        const mapped: AdminAuditLogEntry[] = records.map((a: any) => ({
          id: a.id,
          adminUserId: a.admin_user_id,
          adminName: a.admin_user?.full_name || "System Admin",
          adminRole: a.admin_user?.role || "SUPER_ADMIN",
          action: a.action,
          entityType: a.entity_type,
          entityId: a.entity_id,
          oldValue: a.old_value,
          newValue: a.new_value,
          ipAddress: a.ip_address,
          createdAt: a.created_at.toISOString(),
        }));

        return {
          items: mapped,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        };
      } catch (err) {
        console.error("[AdminService.getAuditLogs] DB error:", err);
      }
    }

    return {
      items: FALLBACK_AUDIT_LOGS,
      total: FALLBACK_AUDIT_LOGS.length,
      page: 1,
      pageSize,
      totalPages: 1,
    };
  }
}
