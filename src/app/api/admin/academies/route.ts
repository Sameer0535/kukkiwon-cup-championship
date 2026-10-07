// ==============================================================================
// ADMIN ACADEMIES DIRECTORY API (GET /api/admin/academies)
// Real-time metrics and directory of all registered academies and dojangs
// Queries Prisma database, LiveSyncService, and fallback stores
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { LiveSyncService, AcademyRecord } from "@/server/services/live-sync.service";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "DOCUMENT_ADMIN",
      "FINANCE_ADMIN",
      "VIEWER",
    ]);

    const url = new URL(request.url);
    const q = url.searchParams.get("q") || undefined;

    const mappedAcademies: AcademyRecord[] = [];
    const seenNames = new Set<string>();

    // 1. Query Prisma Academies with aggregate participant counts
    try {
      const dbAcademies = await prisma.academy.findMany({
        orderBy: { created_at: "desc" },
        include: {
          participants: {
            select: { designation: true },
          },
          _count: {
            select: { registrations: true },
          },
        },
      });

      for (const a of dbAcademies) {
        const normName = a.name.toLowerCase().trim();
        seenNames.add(normName);

        const athletesCount = a.participants.filter((p) => p.designation === "ATHLETE").length;
        const coachesCount = a.participants.filter((p) => p.designation === "COACH").length;

        mappedAcademies.push({
          id: a.id,
          code: a.code || `KKC-ACAD-${a.id.slice(0, 4)}`,
          name: a.name,
          city: a.city || "New Delhi",
          state: a.state || "Delhi",
          country: a.country || "India",
          head_coach_name: a.head_coach_name || "Head Coach",
          email: a.email || undefined,
          phone: a.phone || undefined,
          athletes_count: athletesCount || (a._count.registrations > 0 ? a._count.registrations : 1),
          coaches_count: coachesCount,
          status: a.status === "APPROVED" ? "RECOGNIZED" : "REGISTERED",
          created_at: a.created_at.toISOString(),
        });
      }

      // Also scan participants with custom academy names not yet mapped
      const customParticipants = await prisma.participant.findMany({
        where: {
          academy_name: { not: null },
        },
        select: {
          academy_name: true,
          designation: true,
        },
      });

      for (const cp of customParticipants) {
        if (!cp.academy_name) continue;
        const norm = cp.academy_name.toLowerCase().trim();
        if (!seenNames.has(norm)) {
          seenNames.add(norm);
          mappedAcademies.push({
            id: `acad-part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            code: `KKC-ACAD-${String(mappedAcademies.length + 1).padStart(3, "0")}`,
            name: cp.academy_name.trim(),
            city: "New Delhi",
            state: "Delhi",
            country: "India",
            head_coach_name: "Head Coach",
            athletes_count: cp.designation === "COACH" ? 0 : 1,
            coaches_count: cp.designation === "COACH" ? 1 : 0,
            status: "REGISTERED",
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn("[/api/admin/academies] Prisma query notice:", err);
    }

    // 2. Merge with LiveSyncService academies
    try {
      const liveData = LiveSyncService.listAcademies({ q });
      for (const la of liveData.academies) {
        const norm = la.name.toLowerCase().trim();
        if (!seenNames.has(norm)) {
          seenNames.add(norm);
          mappedAcademies.push(la);
        }
      }
    } catch {}

    // 3. Apply optional search filter
    let filtered = mappedAcademies;
    if (q && q.trim().length > 0) {
      const cleanQ = q.trim().toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(cleanQ) ||
          a.code.toLowerCase().includes(cleanQ) ||
          a.city.toLowerCase().includes(cleanQ) ||
          a.state.toLowerCase().includes(cleanQ)
      );
    }

    const totalAthletes = filtered.reduce((acc, a) => acc + (a.athletes_count || 0), 0);
    const totalCoaches = filtered.reduce((acc, a) => acc + (a.coaches_count || 0), 0);
    const recognizedCount = filtered.filter((a) => a.status === "RECOGNIZED").length;

    return NextResponse.json({
      success: true,
      academies: filtered,
      metrics: {
        totalAcademies: filtered.length,
        recognizedAcademies: recognizedCount,
        totalAthletes,
        totalCoaches,
      },
      total: filtered.length,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to load academies directory." },
      { status: 500 }
    );
  }
}
