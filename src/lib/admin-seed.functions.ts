import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

/** Throws unless the caller has the admin role. */
async function assertAdmin(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
): Promise<void> {
  if (!userId) throw new Error("Admins only");
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r) => r.role === "admin")) {
    throw new Error("Admins only");
  }
}

type TableName = keyof Database["public"]["Tables"];

/** The record tables that make each division workspace feel "populated". Kept in
 * one place so the admin data console and the seeders agree on what counts. */
export const DIVISION_DATA_TABLES: Record<string, TableName[]> = {
  technology: ["tech_projects", "tech_tasks", "integrations", "deployments", "automation_rules"],
  "real-estate": [
    "properties",
    "property_units",
    "property_images",
    "tenants",
    "investors",
    "leads",
  ],
  agritech: ["farmers", "fields", "sensor_data", "yield_predictions", "agri_alerts"],
  logistics: ["shipments", "drivers", "vehicles", "routes", "shipment_events"],
  intelligence: ["datasets", "models", "predictions"],
  "innovation-lab": ["ideas", "prototypes", "partners", "experiments", "demo_days"],
};

export const SEEDABLE_DIVISIONS = Object.keys(DIVISION_DATA_TABLES);

/** Per-division record counts across every data table, for the admin data console.
 * Uses the service-role client so counts reflect the whole platform, not just
 * what the calling admin's RLS scope can see. */
export const getDivisionDataCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const result: Record<string, { tables: Record<string, number>; total: number }> = {};
    for (const [slug, tables] of Object.entries(DIVISION_DATA_TABLES)) {
      const counts: Record<string, number> = {};
      let total = 0;
      for (const table of tables) {
        try {
          // `table` is a union of ~30 table names; passing it straight to
          // .from() makes TypeScript instantiate the full row type for every
          // member and blow its depth limit (TS2589). We only need the count,
          // never the rows, so widen deliberately here.
          const { count } = await (supabaseAdmin as SupabaseClient)
            .from(table)
            .select("*", { count: "exact", head: true });
          counts[table] = count ?? 0;
          total += count ?? 0;
        } catch {
          // A table may not exist yet if its migration hasn't been applied —
          // report zero rather than failing the whole console.
          counts[table] = 0;
        }
      }
      result[slug] = { tables: counts, total };
    }
    return result;
  });

const GrantSelfSchema = z.object({
  division_slug: z.string().trim().min(1).max(64),
});

/**
 * Seeding runs as the calling admin (the seeders stamp owner_id/created_by with
 * the caller), and every division seeder is guarded so it only inserts when the
 * division is empty. This grants the admin division access first if they lack
 * it, so seeded records land in a workspace they can actually open.
 */
export const ensureDivisionAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GrantSelfSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data: existing } = await supabaseAdmin
      .from("user_divisions")
      .select("id")
      .eq("user_id", context.userId)
      .eq("division_slug", data.division_slug)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabaseAdmin
        .from("user_divisions")
        .insert({ user_id: context.userId, division_slug: data.division_slug });
      if (error) throw new Error(error.message);
      return { granted: true };
    }
    return { granted: false };
  });
