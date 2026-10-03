#!/usr/bin/env node
// ==============================================================================
// KUKKIWON CUP CHAMPIONSHIP - PRODUCTION ADMIN BOOTSTRAP SCRIPT
// Secure, controlled creation of initial SUPER_ADMIN without hardcoded credentials.
// ==============================================================================

import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].substring(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
      options[key] = val;
    }
  }
  return options;
}

async function main() {
  console.log("🥋 [Kukkiwon Cup] Production Super Admin Bootstrap Utility");
  console.log("------------------------------------------------------------");

  const args = parseArgs();
  const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || args.email || "").trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || args.password || "";
  const fullName = (process.env.ADMIN_BOOTSTRAP_NAME || args.name || "Kukkiwon Cup Super Administrator").trim();

  if (!email || !email.includes("@")) {
    console.error("❌ Error: Valid admin email must be provided via ADMIN_BOOTSTRAP_EMAIL or --email");
    process.exit(1);
  }

  if (!password || password.length < 10) {
    console.error("❌ Error: Strong password (>= 10 chars) must be provided via ADMIN_BOOTSTRAP_PASSWORD or --password");
    process.exit(1);
  }

  // Verify DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error("❌ Database connection failed. Ensure DATABASE_URL is configured and reachable.");
    console.error(`Details: ${err.message || err}`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      password_hash: passwordHash,
      full_name: fullName,
      role: "SUPER_ADMIN",
      is_active: true,
      updated_at: new Date(),
    },
    create: {
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role: "SUPER_ADMIN",
      is_active: true,
    },
  });

  // Log to Audit Log
  try {
    await prisma.auditLog.create({
      data: {
        admin_user_id: admin.id,
        action: "BOOTSTRAP_SUPER_ADMIN_CREATED",
        entity_type: "AdminUser",
        entity_id: admin.id,
        new_value: JSON.stringify({ email, role: "SUPER_ADMIN", fullName }),
      },
    });
  } catch (auditErr) {
    console.warn("⚠️ Warning: Could not record audit log entry:", auditErr.message);
  }

  console.log(`✅ SUPER_ADMIN successfully configured!`);
  console.log(`   User ID:   ${admin.id}`);
  console.log(`   Email:     ${admin.email}`);
  console.log(`   Role:      ${admin.role}`);
  console.log(`   Status:    ACTIVE`);
  console.log("------------------------------------------------------------");
  console.log("🔒 Credentials hashed with PBKDF2-SHA512. Never share or commit credentials.");
}

main()
  .catch((e) => {
    console.error("❌ Fatal bootstrap error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
