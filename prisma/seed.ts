// ==============================================================================
// PRISMA SEED SCRIPT
// Initializes foundational tournament, designations, nationalities, and CMS settings
// ==============================================================================

import { PrismaClient } from "@prisma/client";
import { INITIAL_DESIGNATIONS } from "../src/config/designations";
import { INITIAL_NATIONALITIES } from "../src/config/nationalities";

const prisma = new PrismaClient();

async function main() {
  console.log("🥋 [Kukkiwon Cup] Starting database seeding...");

  // 1. Seed Designations (Requirement 9)
  console.log("➡️ Seeding official designations...");
  for (const des of INITIAL_DESIGNATIONS) {
    await prisma.designation.upsert({
      where: { code: des.code },
      update: {
        label: des.label,
        description: des.description,
        requires_kukkiwon_id: des.requiresKukkiwonId,
        requires_documents: des.requiresDocuments,
        display_order: des.displayOrder,
      },
      create: {
        code: des.code,
        label: des.label,
        description: des.description,
        requires_kukkiwon_id: des.requiresKukkiwonId,
        requires_documents: des.requiresDocuments,
        display_order: des.displayOrder,
      },
    });
  }

  // 2. Seed Nationalities & Flags (Requirement 10)
  console.log("➡️ Seeding nationalities & country codes...");
  for (let i = 0; i < INITIAL_NATIONALITIES.length; i++) {
    const nat = INITIAL_NATIONALITIES[i];
    await prisma.nationality.upsert({
      where: { iso_code: nat.isoCode },
      update: {
        name: nat.name,
        iso_alpha2: nat.isoAlpha2,
        flag_identifier: nat.flag,
        display_order: i + 1,
      },
      create: {
        name: nat.name,
        iso_code: nat.isoCode,
        iso_alpha2: nat.isoAlpha2,
        flag_identifier: nat.flag,
        display_order: i + 1,
      },
    });
  }

  // 3. Seed Primary Championship: Kukkiwon Cup 2026 (Requirements 6 & 22)
  console.log("➡️ Seeding initial championship: kukkiwon-cup-2026...");
  const championship = await prisma.championship.upsert({
    where: { slug: "kukkiwon-cup-2026" },
    update: {
      name: "Kukkiwon Cup Championship 2026",
      short_name: "Kukkiwon Cup 2026",
      subtitle: "Presented by Kukkiwon North India & Kyorix Sports Technology",
      description:
        "The premier national Taekwondo championship organized under the sanction of World Taekwondo Headquarters Kukkiwon India North Branch, powered by Kyorix Sports Technology scoring and accreditation systems.",
      status: "REGISTRATION_OPEN",
      start_date: new Date("2026-11-20T09:00:00Z"),
      end_date: new Date("2026-11-23T18:00:00Z"),
      venue: "Indira Gandhi Indoor Stadium Complex",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      registration_open: new Date("2026-09-01T00:00:00Z"),
      registration_close: new Date("2026-11-10T23:59:59Z"),
      currency: "INR",
      entry_fee_athlete: 2500.0,
      entry_fee_coach: 1500.0,
      entry_fee_official: 0.0,
    },
    create: {
      slug: "kukkiwon-cup-2026",
      name: "Kukkiwon Cup Championship 2026",
      short_name: "Kukkiwon Cup 2026",
      subtitle: "Presented by Kukkiwon North India & Kyorix Sports Technology",
      description:
        "The premier national Taekwondo championship organized under the sanction of World Taekwondo Headquarters Kukkiwon India North Branch, powered by Kyorix Sports Technology scoring and accreditation systems.",
      status: "REGISTRATION_OPEN",
      start_date: new Date("2026-11-20T09:00:00Z"),
      end_date: new Date("2026-11-23T18:00:00Z"),
      venue: "Indira Gandhi Indoor Stadium Complex",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      registration_open: new Date("2026-09-01T00:00:00Z"),
      registration_close: new Date("2026-11-10T23:59:59Z"),
      currency: "INR",
      entry_fee_athlete: 2500.0,
      entry_fee_coach: 1500.0,
      entry_fee_official: 0.0,
    },
  });

  // 4. Seed Terms and Conditions v1.0 (Requirement 18)
  console.log("➡️ Seeding terms & conditions v1.0...");
  await prisma.termsVersion.upsert({
    where: {
      championship_id_version: {
        championship_id: championship.id,
        version: "v1.0",
      },
    },
    update: {
      title: "Official Kukkiwon Cup 2026 Participation & Accreditation Agreement",
      content:
        "All registered participants agree to uphold the tenets of Taekwondo (Courtesy, Integrity, Perseverance, Self-Control, Indomitable Spirit). All athletes must present valid government photo identification and verified Kukkiwon Dan/Poom certificate where mandated. Official digital accreditation ID badges with QR verification must be worn at all times within tournament rings.",
      is_active: true,
    },
    create: {
      championship_id: championship.id,
      version: "v1.0",
      title: "Official Kukkiwon Cup 2026 Participation & Accreditation Agreement",
      content:
        "All registered participants agree to uphold the tenets of Taekwondo (Courtesy, Integrity, Perseverance, Self-Control, Indomitable Spirit). All athletes must present valid government photo identification and verified Kukkiwon Dan/Poom certificate where mandated. Official digital accreditation ID badges with QR verification must be worn at all times within tournament rings.",
      is_active: true,
    },
  });

  // 5. Seed Site Settings (Requirement 17)
  console.log("➡️ Seeding site CMS settings...");
  await prisma.siteSetting.upsert({
    where: { championship_id: championship.id },
    update: {
      title: "Kukkiwon Cup Championship 2026",
      subtitle: "Presented by Kukkiwon North India & Kyorix Sports Technology",
      hero_headline: "The Pinnacle of Taekwondo Excellence",
      hero_description:
        "Experience world-class competition, verified Kukkiwon credentials, and cutting-edge electronic scoring powered by Kyorix.",
      contact_email: "support@kukkiwoncup.org",
      contact_phone: "+91 98765 43210",
      contact_address: "Indira Gandhi Stadium Complex, New Delhi",
      is_published: true,
    },
    create: {
      championship_id: championship.id,
      title: "Kukkiwon Cup Championship 2026",
      subtitle: "Presented by Kukkiwon North India & Kyorix Sports Technology",
      hero_headline: "The Pinnacle of Taekwondo Excellence",
      hero_description:
        "Experience world-class competition, verified Kukkiwon credentials, and cutting-edge electronic scoring powered by Kyorix.",
      contact_email: "support@kukkiwoncup.org",
      contact_phone: "+91 98765 43210",
      contact_address: "Indira Gandhi Stadium Complex, New Delhi",
      is_published: true,
    },
  });

  // 6. Seed Initial Recognized Academies (Requirement 8 & 9)
  console.log("➡️ Seeding initial recognized academies...");
  const { INITIAL_ACADEMIES } = await import("../src/config/academies");
  for (const aca of INITIAL_ACADEMIES) {
    await prisma.academy.upsert({
      where: { code: aca.code },
      update: {
        name: aca.name,
        short_name: aca.short_name,
        country: aca.country,
        state: aca.state,
        city: aca.city,
        address: aca.address,
        email: aca.email,
        phone: aca.phone,
        website: aca.website,
        head_coach_name: aca.head_coach_name,
        status: aca.status,
      },
      create: {
        code: aca.code,
        name: aca.name,
        short_name: aca.short_name,
        country: aca.country,
        state: aca.state,
        city: aca.city,
        address: aca.address,
        email: aca.email,
        phone: aca.phone,
        website: aca.website,
        head_coach_name: aca.head_coach_name,
        status: aca.status,
      },
    });
  }

  // 7. Seed Initial Championship Categories (Requirement 4 & 5)
  console.log("➡️ Seeding championship competition categories...");
  const { INITIAL_CATEGORIES } = await import("../src/config/categories");
  for (const cat of INITIAL_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        championship_id_code: {
          championship_id: championship.id,
          code: cat.code,
        },
      },
      update: {
        name: cat.name,
        discipline: cat.discipline,
        division: cat.division,
        gender: cat.gender as any,
        min_age: cat.min_age,
        max_age: cat.max_age,
        min_weight: cat.min_weight,
        max_weight: cat.max_weight,
        belt_requirement: cat.belt_requirement,
        registration_fee: cat.registration_fee,
        max_participants: cat.max_participants,
        display_order: cat.display_order,
        is_active: cat.is_active,
      },
      create: {
        championship_id: championship.id,
        code: cat.code,
        name: cat.name,
        discipline: cat.discipline,
        division: cat.division,
        gender: cat.gender as any,
        min_age: cat.min_age,
        max_age: cat.max_age,
        min_weight: cat.min_weight,
        max_weight: cat.max_weight,
        belt_requirement: cat.belt_requirement,
        registration_fee: cat.registration_fee,
        max_participants: cat.max_participants,
        display_order: cat.display_order,
        is_active: cat.is_active,
      },
    });
  }

  // 8. Seed Document Requirements (Phase 4 Requirement 18)
  console.log("➡️ Seeding championship document requirements...");
  const { DEFAULT_DOCUMENT_REQUIREMENTS } = await import("../src/config/document-requirements");
  for (const docReq of DEFAULT_DOCUMENT_REQUIREMENTS) {
    await prisma.documentRequirement.upsert({
      where: { id: docReq.id },
      update: {
        championship_id: championship.id,
        participant_type: docReq.participant_type as any,
        discipline: docReq.discipline,
        document_type: docReq.document_type,
        title: docReq.title,
        description: docReq.description,
        is_required: docReq.is_required,
        requires_dan: docReq.requires_dan,
        min_age: docReq.min_age,
        max_age: docReq.max_age,
        allowed_file_types: docReq.allowed_file_types,
        max_file_size: docReq.max_file_size,
        display_order: docReq.display_order,
        is_active: docReq.is_active,
      },
      create: {
        id: docReq.id,
        championship_id: championship.id,
        participant_type: docReq.participant_type as any,
        discipline: docReq.discipline,
        document_type: docReq.document_type,
        title: docReq.title,
        description: docReq.description,
        is_required: docReq.is_required,
        requires_dan: docReq.requires_dan,
        min_age: docReq.min_age,
        max_age: docReq.max_age,
        allowed_file_types: docReq.allowed_file_types,
        max_file_size: docReq.max_file_size,
        display_order: docReq.display_order,
        is_active: docReq.is_active,
      },
    });
  }

  console.log("✅ [Kukkiwon Cup] Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
