#!/usr/bin/env node
// One-time script to create (or promote) a super admin account.
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/bootstrap-super-admin.mjs
// or, if you already have a local .env with these set:
//   node --env-file=.env scripts/bootstrap-super-admin.mjs
//
// This grants the target account the 'admin' role, which already bypasses
// every division RLS check in this codebase (has_division_access(...) OR
// has_role(admin) OR has_role(staff)) — so an admin sees and manages every
// division regardless of user_divisions rows. We still seed user_divisions
// for all divisions too, for any UI that reads it directly.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TARGET_EMAIL = process.env.SUPER_ADMIN_EMAIL || "boogyharry090@gmail.com";
const TARGET_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "theboogy09";
const TARGET_NAME = process.env.SUPER_ADMIN_NAME || "Boogy Harry";

const ALL_DIVISIONS = [
  "technology",
  "agritech",
  "real-estate",
  "logistics",
  "intelligence",
  "innovation-lab",
];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Set them in your environment (the same values your .env uses to run the app) and re-run.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  console.log(`Looking for an existing account for ${TARGET_EMAIL}...`);
  let user = await findUserByEmail(TARGET_EMAIL);

  if (user) {
    console.log(`Found existing account (${user.id}). Resetting password and confirming email...`);
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: TARGET_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  } else {
    console.log("No existing account found. Creating one...");
    const { data, error } = await supabase.auth.admin.createUser({
      email: TARGET_EMAIL,
      password: TARGET_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: TARGET_NAME },
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created account (${user.id}).`);
  }

  console.log("Upserting profile...");
  await supabase.from("profiles").upsert({ id: user.id, full_name: TARGET_NAME });

  console.log("Granting 'admin' role...");
  const { error: roleErr } = await supabase
    .from("user_roles")
    .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
  if (roleErr) throw roleErr;

  console.log("Seeding access to all divisions...");
  for (const slug of ALL_DIVISIONS) {
    const { error: divErr } = await supabase
      .from("user_divisions")
      .upsert({ user_id: user.id, division_slug: slug }, { onConflict: "user_id,division_slug" });
    if (divErr) throw divErr;
  }

  console.log("\nDone. Super admin is ready:");
  console.log(`  email:    ${TARGET_EMAIL}`);
  console.log(`  password: ${TARGET_PASSWORD}`);
  console.log("  role:     admin (all divisions)");
  console.log("\nSign in at /portal/login. Change the password after first login.");
}

main().catch((err) => {
  console.error("\nBootstrap failed:", err.message || err);
  process.exit(1);
});
