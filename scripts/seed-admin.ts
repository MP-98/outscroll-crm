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
  const path = resolve(process.cwd(), ".env.local");
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    console.warn(`[seed-admin] ${path} not found — relying on process env.`);
    return;
  }
  // Strip BOM if present (Windows editors love adding it).
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  let count = 0;
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) {
      process.env[key] = value;
      count += 1;
    }
  }
  console.log(`[seed-admin] Loaded ${count} env vars from .env.local`);
}

async function main() {
  loadEnv();

  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "abhay@theproductfolks.com";
  const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Abhay";
  const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    console.error(
      "[seed-admin] SEED_ADMIN_PASSWORD missing or shorter than 8 chars in .env.local",
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log(`[seed-admin] URL: ${url}`);
  console.log(
    `[seed-admin] service_role: length=${key.length}, ${key.slice(0, 14)}…${key.slice(-6)}`,
  );
  if (anon) {
    console.log(
      `[seed-admin] anon:         length=${anon.length}, ${anon.slice(0, 14)}…${anon.slice(-6)}`,
    );
  }

  async function probe(label: string, k: string) {
    const r = await fetch(`${url!.replace(/\/+$/, "")}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: k, Authorization: `Bearer ${k}` },
    });
    let body = "";
    if (!r.ok) body = " — " + (await r.text()).slice(0, 160);
    console.log(`[seed-admin] probe(${label}) → HTTP ${r.status}${body}`);
    return r.status;
  }

  const svcStatus = await probe("service_role", key);
  if (anon) await probe("anon", anon);

  if (svcStatus === 401) {
    console.error(
      "\n[seed-admin] service_role key rejected. Likely fixes:" +
        "\n  1. Open Supabase dashboard → Settings → API. Copy the *secret* (service_role) key fresh and replace it in .env.local." +
        "\n  2. If your project shows only sb_publishable / sb_secret keys (new format), use sb_secret_… here." +
        "\n  3. If both anon and service_role show 401, the project may be paused — wake it from the dashboard top banner.",
    );
    process.exit(1);
  }
  if (svcStatus === 404) {
    console.error("[seed-admin] profiles table not found. Run db/schema.sql in this project first.");
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
    const { data, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    });
    if (error) throw error;
    user = data.user;
    console.log(`  → Created user ${ADMIN_EMAIL} with confirmed email`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    });
    if (error) throw error;
    console.log(`  → User exists (${user.id}); password reset to SEED_ADMIN_PASSWORD`);
  }

  if (!user) throw new Error("Failed to create or find user");

  // 2. Upsert profile with admin role and seed-admin flag.
  const { error: upsertErr } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        role: "admin",
        is_seed_admin: true,
        can_configure_team: true,
      },
      { onConflict: "id" },
    );
  if (upsertErr) throw upsertErr;
  console.log(`  → Profile upserted with role=admin, is_seed_admin=true`);
  console.log("\nDone. Sign in at /login with:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
