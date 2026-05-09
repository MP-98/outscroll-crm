/**
 * Bootstraps the first admin user for Outscroll CRM.
 *
 * Usage: pnpm tsx scripts/seed-admin.ts
 *
 * Reads credentials from .env.local. Idempotent — safe to re-run.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      let value = m[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] == null) process.env[key] = value;
    }
  } catch {
    // No .env.local — rely on process env.
  }
}

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "abhay@theproductfolks.com";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Abhay";

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Seeding admin: ${ADMIN_EMAIL}`);

  // 1. Find existing user, or invite.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;

  let user = list.users.find((u) => u.email === ADMIN_EMAIL);
  if (!user) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(ADMIN_EMAIL, {
      data: { full_name: ADMIN_NAME },
    });
    if (error) throw error;
    user = data.user;
    console.log(`  → Invitation email sent to ${ADMIN_EMAIL}`);
  } else {
    console.log(`  → User already exists (${user.id})`);
  }

  if (!user) throw new Error("Failed to create or find user");

  // 2. Upsert profile with admin role.
  const { error: upsertErr } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        role: "admin",
      },
      { onConflict: "id" },
    );
  if (upsertErr) throw upsertErr;
  console.log(`  → Profile upserted with role=admin`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
