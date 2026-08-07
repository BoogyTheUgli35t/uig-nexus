import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Throws unless the caller has the admin role. */
async function assertAdmin(
  supabase: { from: (t: string) => any },
  userId: string,
): Promise<void> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r: { role: string }) => r.role === "admin")) {
    throw new Error("Admins only");
  }
}

// =============== Filtered audit log ===============

const AuditFilterSchema = z.object({
  email: z.string().trim().max(200).optional().or(z.literal("")),
  user_id: z.string().uuid().optional().or(z.literal("")),
  event_type: z.string().trim().max(64).optional().or(z.literal("")),
  division_slug: z.string().trim().max(64).optional().or(z.literal("")),
  from: z.string().optional().or(z.literal("")),
  to: z.string().optional().or(z.literal("")),
  limit: z.number().int().min(1).max(1000).default(200),
});

export type AuditFilter = z.infer<typeof AuditFilterSchema>;

/**
 * Admin-only, server-side filtered audit log. Supports filtering by email
 * (ilike), user_id, event_type, division_slug (matched against
 * metadata->>division_slug), and an ISO time range. Bounded to 1000 rows.
 */
export const queryAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => AuditFilterSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    let q = supabaseAdmin
      .from("portal_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.email) q = q.ilike("email", `%${data.email}%`);
    if (data.user_id) q = q.eq("user_id", data.user_id);
    if (data.event_type) q = q.eq("event_type", data.event_type);
    if (data.division_slug) {
      // metadata is jsonb — filter on the division_slug field when present.
      q = q.eq("metadata->>division_slug", data.division_slug);
    }
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// =============== System-wide stats (per-division) ===============

const DIVISION_TABLES: Record<string, string[]> = {
  technology: ["tech_projects", "tech_tasks", "deployments"],
  agritech: ["farmers", "fields", "sensor_data"],
  "real-estate": ["properties", "tenants", "leads"],
  logistics: ["shipments", "drivers", "vehicles"],
  intelligence: ["datasets", "models", "predictions"],
  "innovation-lab": ["ideas", "prototypes", "experiments"],
};

async function tableCount(name: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabaseAdmin.from as any)(name).select("id", {
    count: "exact",
    head: true,
  });
  return (count as number) ?? 0;
}

export const getSystemHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    // Auth users + role/division distribution
    const [{ data: authUsers, error: uErr }, { data: allDivs }, { data: allRoles }] =
      await Promise.all([
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        supabaseAdmin.from("user_divisions").select("division_slug"),
        supabaseAdmin.from("user_roles").select("role"),
      ]);
    if (uErr) throw new Error(uErr.message);

    const usersByDivision: Record<string, number> = {};
    (allDivs ?? []).forEach((d) => {
      usersByDivision[d.division_slug] = (usersByDivision[d.division_slug] ?? 0) + 1;
    });
    const usersByRole: Record<string, number> = {};
    (allRoles ?? []).forEach((r) => {
      usersByRole[r.role] = (usersByRole[r.role] ?? 0) + 1;
    });

    // Per-division table counts
    const divisionStats: Record<string, { tables: Record<string, number>; total: number }> = {};
    for (const [slug, tables] of Object.entries(DIVISION_TABLES)) {
      const counts: Record<string, number> = {};
      let total = 0;
      for (const t of tables) {
        try {
          const c = await tableCount(t);
          counts[t] = c;
          total += c;
        } catch {
          counts[t] = 0;
        }
      }
      divisionStats[slug] = { tables: counts, total };
    }

    // Signups over the last 30 days (auth users)
    const now = Date.now();
    const last30 = authUsers.users.filter(
      (u) => u.created_at && now - new Date(u.created_at).getTime() < 30 * 86400_000,
    ).length;
    const last7 = authUsers.users.filter(
      (u) => u.created_at && now - new Date(u.created_at).getTime() < 7 * 86400_000,
    ).length;

    return {
      totalUsers: authUsers.users.length,
      signupsLast7: last7,
      signupsLast30: last30,
      usersByDivision,
      usersByRole,
      divisionStats,
    };
  });

// =============== Broadcast notifications ===============

const BroadcastSchema = z.object({
  audience: z.enum(["all", "division", "role"]),
  division_slug: z.string().trim().max(64).optional().or(z.literal("")),
  role: z.enum(["admin", "staff", "client", "investor", "farmer", "driver"]).optional(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const sendBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => BroadcastSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    let targetUserIds: string[] = [];

    if (data.audience === "all") {
      const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (error) throw new Error(error.message);
      targetUserIds = authUsers.users.map((u) => u.id);
    } else if (data.audience === "division") {
      if (!data.division_slug) throw new Error("division_slug required");
      const { data: rows, error } = await supabaseAdmin
        .from("user_divisions")
        .select("user_id")
        .eq("division_slug", data.division_slug);
      if (error) throw new Error(error.message);
      targetUserIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    } else if (data.audience === "role") {
      if (!data.role) throw new Error("role required");
      const { data: rows, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", data.role);
      if (error) throw new Error(error.message);
      targetUserIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    }

    if (targetUserIds.length === 0) return { ok: true, delivered: 0 };

    const inserts = targetUserIds.map((user_id) => ({
      user_id,
      title: data.title,
      body: data.body || null,
      division: data.audience === "division" ? data.division_slug || null : null,
    }));

    // Chunk to avoid oversized payloads.
    let delivered = 0;
    for (let i = 0; i < inserts.length; i += 500) {
      const chunk = inserts.slice(i, i + 500);
      const { error } = await supabaseAdmin.from("notifications").insert(chunk);
      if (error) throw new Error(error.message);
      delivered += chunk.length;
    }

    await supabaseAdmin.from("portal_audit_log").insert({
      user_id: context.userId,
      email: null,
      event_type: "role_change", // reuse allowed enum; capture details in metadata
      metadata: {
        broadcast: true,
        audience: data.audience,
        division_slug: data.division_slug || null,
        role: data.role || null,
        title: data.title,
        delivered,
      },
    });

    return { ok: true, delivered };
  });

// =============== Bulk division access management ===============

const DivisionGrantSchema = z.object({
  user_id: z.string().uuid(),
  division_slug: z.string().trim().min(1).max(64),
});

export const grantDivisionAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => DivisionGrantSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("user_divisions")
      .upsert(
        { user_id: data.user_id, division_slug: data.division_slug },
        { onConflict: "user_id,division_slug" },
      );
    if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message);
    return { ok: true };
  });

export const revokeDivisionAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => DivisionGrantSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("user_divisions")
      .delete()
      .eq("user_id", data.user_id)
      .eq("division_slug", data.division_slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
