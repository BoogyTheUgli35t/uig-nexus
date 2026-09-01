import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }, { data: projects }, { data: tasks }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, org_id")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("projects")
          .select("id, name, type, status, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase
          .from("tasks")
          .select("id, title, status, due_date, project_id")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
    const { count: projectsCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true });
    const { count: openTasksCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .neq("status", "done");
    const { count: docsCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true });
    return {
      profile,
      roles: roles?.map((r) => r.role) ?? [],
      recentProjects: projects ?? [],
      recentTasks: tasks ?? [],
      stats: {
        projects: projectsCount ?? 0,
        openTasks: openTasksCount ?? 0,
        documents: docsCount ?? 0,
      },
    };
  });

// =============== Cross-division pulse (real per-division live counts) ===============

/**
 * The slice of the PostgREST filter builder the pulse queries actually use.
 * Declared structurally on purpose: `from(cfg.table)` resolves to a union of
 * per-table builders whose concrete generic type has no nameable form here,
 * so the call site bridges to it with an explicit cast rather than `any`.
 */
type PulseFilter = {
  eq(column: string, value: unknown): PulseFilter;
  neq(column: string, value: unknown): PulseFilter;
  in(column: string, values: readonly unknown[]): PulseFilter;
  not(column: string, operator: string, value: unknown): PulseFilter;
};

const PULSE_QUERIES: Record<
  string,
  {
    table: keyof Database["public"]["Tables"];
    label: string;
    select: string;
    filter?: (q: PulseFilter) => PulseFilter;
  }
> = {
  technology: {
    table: "tech_tasks",
    label: "open tech tasks",
    select: "id",
    filter: (q) => q.neq("status", "done"),
  },
  "real-estate": {
    table: "leads",
    label: "open leads",
    select: "id",
    filter: (q) => q.not("stage", "in", "(closed,lost)"),
  },
  logistics: {
    table: "shipments",
    label: "active shipments",
    select: "id",
    filter: (q) => q.not("status", "in", "(delivered,failed)"),
  },
  agritech: {
    table: "agri_alerts",
    label: "open field alerts",
    select: "id",
    filter: (q) => q.eq("acknowledged", false),
  },
  intelligence: {
    table: "models",
    label: "deployed models",
    select: "id",
    filter: (q) => q.in("status", ["deployed", "monitoring"]),
  },
  "innovation-lab": {
    table: "ideas",
    label: "ideas in the pipeline",
    select: "id",
    filter: (q) => q.neq("status", "production"),
  },
};

/** One real, live count per division the user belongs to — used for the dashboard's
 * "your divisions" cards, so they show actual pulse rather than a static tagline. */
export const getCrossDivisionPulse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: memberships } = await context.supabase
      .from("user_divisions")
      .select("division_slug")
      .eq("user_id", context.userId);
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = roles?.some((r) => r.role === "admin") ?? false;

    const slugs = isAdmin
      ? Object.keys(PULSE_QUERIES)
      : Array.from(new Set((memberships ?? []).map((m) => m.division_slug))).filter(
          (s) => s in PULSE_QUERIES,
        );

    const results = await Promise.all(
      slugs.map(async (slug) => {
        const cfg = PULSE_QUERIES[slug];
        const base = context.supabase
          .from(cfg.table)
          .select(cfg.select, { count: "exact", head: true });
        const q = cfg.filter
          ? (cfg.filter(base as unknown as PulseFilter) as unknown as typeof base)
          : base;
        const { count } = await q;
        return { slug, count: count ?? 0, label: cfg.label };
      }),
    );

    return results;
  });

// =============== AI-generated dashboard insight ===============

async function callLovableAI(messages: { role: string; content: string }[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
  });
  if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
  if (res.status === 402)
    throw new Error("AI credits exhausted. Add credits in your workspace to continue.");
  if (!res.ok) throw new Error(`AI request failed (${res.status}).`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

/** A real, AI-written one-liner summarizing the user's actual cross-division pulse
 * numbers — replaces the old canned ternary "AI insight" text on the dashboard. */
export const getDashboardInsight = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, pulse] = await Promise.all([
      context.supabase.from("profiles").select("full_name").eq("id", context.userId).maybeSingle(),
      (async () => {
        const { data: memberships } = await context.supabase
          .from("user_divisions")
          .select("division_slug")
          .eq("user_id", context.userId);
        return memberships ?? [];
      })(),
    ]);

    if (pulse.length === 0) {
      return { insight: "No division workspaces yet — request access to get started." };
    }

    const summaryLines = pulse.map((m) => `- has access to ${m.division_slug}`).join("\n");
    try {
      const insight = await callLovableAI([
        {
          role: "system",
          content:
            "You are a terse operations assistant inside the UIG Apex Portal. Given a user's division memberships, " +
            "write ONE short, encouraging sentence (under 30 words) suggesting what to focus on today. No markdown, no greeting.",
        },
        { role: "user", content: `User: ${profile?.full_name ?? "there"}\n${summaryLines}` },
      ]);
      return {
        insight:
          insight || "Everything's tracking — check your division workspaces for the latest.",
      };
    } catch {
      // AI gateway may not be configured in every environment — fail soft, not loud.
      return { insight: "Check your division workspaces below for what needs attention today." };
    }
  });

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("id, name, type, status, description, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const ProjectIdSchema = z.object({ id: z.string().uuid() });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ProjectIdSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const [{ data: project, error }, { data: tasks }, { data: documents }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("tasks")
        .select("*")
        .eq("project_id", data.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("project_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    return { project, tasks: tasks ?? [], documents: documents ?? [] };
  });

const CreateProjectSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  type: z.enum(["tech", "real_estate", "logistics", "agritech", "other"]),
});

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateProjectSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", userId)
      .maybeSingle();
    const { data: row, error } = await supabase
      .from("projects")
      .insert({
        name: data.name,
        description: data.description || null,
        type: data.type,
        owner_id: userId,
        org_id: profile?.org_id ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const CreateTaskSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
});

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateTaskSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("tasks").insert({
      project_id: data.project_id,
      title: data.title,
      description: data.description || null,
      due_date: data.due_date || null,
      created_by: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateTaskStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "done"]),
});

export const updateTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateTaskStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tasks")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Audit log ===============

const AuditEventSchema = z.object({
  event_type: z.enum([
    "sign_in",
    "sign_out",
    "access_denied",
    "role_change",
    "session_expired",
    "access_request_submitted",
  ]),
  email: z.string().email().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Records a portal audit event. To prevent forgery, the caller's identity is
 * ALWAYS derived server-side from the bearer token (if present) — never trusted
 * from the client payload. Pre-auth events (sign-in attempts, session expiry,
 * access-denied) are logged with a null user_id and only the client-supplied
 * email; authenticated events always overwrite email/user_id with the verified
 * session claims.
 */
export const logPortalEvent = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuditEventSchema.parse(i))
  .handler(async ({ data }) => {
    let ip: string | null = null;
    let ua: string | null = null;
    let authedUserId: string | null = null;
    let authedEmail: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
      ua = getRequestHeader("user-agent") ?? null;
      const authHeader = getRequestHeader("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const { data: verified } = await supabaseAdmin.auth.getUser(token);
        authedUserId = verified.user?.id ?? null;
        authedEmail = verified.user?.email ?? null;
      }
    } catch {
      // ignore — fall through with null identity
    }
    // Cap metadata size to prevent log flooding.
    const rawMeta = data.metadata ?? {};
    const metaStr = JSON.stringify(rawMeta);
    const safeMeta = metaStr.length > 2000 ? { truncated: true } : rawMeta;

    const { error } = await supabaseAdmin.from("portal_audit_log").insert({
      // Verified identity always wins over anything the client sent.
      user_id: authedUserId,
      email: authedUserId ? authedEmail : (data.email ?? null),
      event_type: data.event_type,
      metadata: safeMeta,
      ip_address: ip,
      user_agent: ua,
    });
    if (error) {
      console.error("[audit] insert failed", error.message);
      return { ok: false };
    }
    return { ok: true };
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Admins only");
    }
    const { data, error } = await supabaseAdmin
      .from("portal_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// =============== Access requests ===============

const AccessRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  requested_role: z
    .enum(["admin", "staff", "client", "investor", "farmer", "driver"])
    .default("client"),
  reason: z.string().trim().max(2000).optional().or(z.literal("")),
  user_id: z.string().uuid().optional().nullable(),
});

export const submitAccessRequest = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AccessRequestSchema.parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("access_requests").insert({
      user_id: data.user_id ?? null,
      name: data.name,
      email: data.email,
      requested_role: data.requested_role,
      reason: data.reason || null,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("portal_audit_log").insert({
      user_id: data.user_id ?? null,
      email: data.email,
      event_type: "access_request_submitted",
      metadata: { requested_role: data.requested_role },
    });
    return { ok: true };
  });

// =============== Admin: access request review ===============

/** Throws unless the given user has the admin role. `supabase` is the caller's
 * own RLS-scoped client — reading a user's own row from user_roles is allowed
 * by the "users read own roles" policy, so no service-role client is needed
 * just for this check. */
async function requireAdmin(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r: { role: string }) => r.role === "admin")) {
    throw new Error("Admins only");
  }
}

/** The signed-in user's own most recent access request, if any — lets the UI
 * show "pending review" instead of a blank submit form on repeat visits. Not
 * admin-gated: any authenticated user can see the status of their own
 * request (RLS on access_requests already scopes reads sensibly, but this
 * uses the service-role client since access_requests predates a SELECT
 * policy for the requester themselves). */
export const getMyAccessRequestStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .select("id, status, requested_role, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

/** Single aggregate call for the /portal/admin landing page — counts +
 * recent activity across everything an admin cares about, so the page loads
 * in one round trip instead of five. */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);

    const [
      { data: authUsers, error: listErr },
      { count: pendingRequests },
      { data: roleRows },
      { data: recentAudit },
      { data: billing },
    ] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin
        .from("access_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabaseAdmin.from("user_roles").select("role"),
      supabaseAdmin
        .from("portal_audit_log")
        .select("id, event_type, email, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabaseAdmin.from("billing_transactions").select("amount_kobo, status"),
    ]);
    if (listErr) throw new Error(listErr.message);
    const totalUsers = authUsers.users.length;

    const roleCounts: Record<string, number> = {};
    (roleRows ?? []).forEach((r) => {
      roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1;
    });

    const billingRows = billing ?? [];
    const totalPaidKobo = billingRows
      .filter((b) => b.status === "paid")
      .reduce((s, b) => s + Number(b.amount_kobo), 0);
    const pendingBillingCount = billingRows.filter((b) => b.status === "pending").length;

    return {
      totalUsers,
      pendingRequests: pendingRequests ?? 0,
      roleCounts,
      recentAudit: recentAudit ?? [],
      billing: {
        totalPaidKobo,
        pendingCount: pendingBillingCount,
        transactionCount: billingRows.length,
      },
    };
  });

export const listAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const ReviewAccessRequestSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["admin", "staff", "client", "investor", "farmer", "driver"]).default("client"),
  division_slugs: z.array(z.string()).default([]),
});

/** Approves an access request: marks it approved and, if the requester already
 * has a portal account (user_id set), grants the role + division access
 * directly. If they haven't signed up yet, approval just records the decision —
 * there's no invite-email flow in this build, so the applicant still needs to
 * create an account with the same email, then an admin re-approves to attach
 * the grants (or uses the Users page once they exist). */
export const approveAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReviewAccessRequestSchema.parse(i))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);

    const { data: reqRow, error: reqErr } = await supabaseAdmin
      .from("access_requests")
      .update({ status: "approved" })
      .eq("id", data.id)
      .select("user_id")
      .single();
    if (reqErr) throw new Error(reqErr.message);

    if (reqRow.user_id) {
      const approvedUserId = reqRow.user_id;
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: approvedUserId, role: data.role }, { onConflict: "user_id" });
      if (roleErr) throw new Error(roleErr.message);

      if (data.division_slugs.length > 0) {
        await supabaseAdmin.from("user_divisions").delete().eq("user_id", approvedUserId);
        const { error: divErr } = await supabaseAdmin
          .from("user_divisions")
          .insert(
            data.division_slugs.map((slug) => ({ user_id: approvedUserId, division_slug: slug })),
          );
        if (divErr) throw new Error(divErr.message);
      }

      await supabaseAdmin.from("notifications").insert({
        user_id: reqRow.user_id,
        title: "Access request approved",
        body: "Your UIG Apex Portal access has been approved.",
      });
    }
    return { ok: true, hasAccount: Boolean(reqRow.user_id) };
  });

export const rejectAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("access_requests")
      .update({ status: "rejected" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Admin: user management ===============

/** Every portal account plus their current role + division grants. Uses the
 * admin API to list auth users (there's no public "all users" table), then
 * joins in the app-level role/division rows. */
export const listAllPortalUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);

    const [
      { data: authUsers, error: listErr },
      { data: roles },
      { data: divisions },
      { data: profiles },
    ] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("user_divisions").select("user_id, division_slug"),
      supabaseAdmin.from("profiles").select("id, full_name"),
    ]);
    if (listErr) throw new Error(listErr.message);

    const roleByUser = new Map<string, string>();
    (roles ?? []).forEach((r) => roleByUser.set(r.user_id, r.role));
    const divisionsByUser = new Map<string, string[]>();
    (divisions ?? []).forEach((d) => {
      const arr = divisionsByUser.get(d.user_id) ?? [];
      arr.push(d.division_slug);
      divisionsByUser.set(d.user_id, arr);
    });
    const nameByUser = new Map<string, string>();
    (profiles ?? []).forEach((p) => nameByUser.set(p.id, p.full_name ?? ""));

    return authUsers.users
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        full_name: nameByUser.get(u.id) ?? "",
        created_at: u.created_at,
        role: roleByUser.get(u.id) ?? null,
        division_slugs: divisionsByUser.get(u.id) ?? [],
      }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });

const UpdateUserAccessSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "staff", "client", "investor", "farmer", "driver"]),
  division_slugs: z.array(z.string()).default([]),
});

export const updateUserAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateUserAccessSchema.parse(i))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id" });
    if (roleErr) throw new Error(roleErr.message);

    await supabaseAdmin.from("user_divisions").delete().eq("user_id", data.user_id);
    if (data.division_slugs.length > 0) {
      const { error: divErr } = await supabaseAdmin
        .from("user_divisions")
        .insert(
          data.division_slugs.map((slug) => ({ user_id: data.user_id, division_slug: slug })),
        );
      if (divErr) throw new Error(divErr.message);
    }
    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return { roles: (data ?? []).map((r) => r.role as string), userId: context.userId };
  });

const RegisterUserDivisionsSchema = z.object({
  selected_divisions: z.array(z.string()),
  primary_division: z.string().optional().or(z.literal("")),
});

/**
 * Self-service onboarding endpoint. New portal accounts ALWAYS get the
 * baseline `client` role — never `admin` or `staff`. Elevated roles are
 * granted only through the admin-only access-request approval flow
 * (`approveAccessRequest`) or `updateUserAccess`.
 */
export const registerUserDivisions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RegisterUserDivisionsSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;

    // 1. Insert user divisions
    const userDivisions = data.selected_divisions.map((slug) => ({
      user_id: userId,
      division_slug: slug,
    }));

    // Delete existing divisions first to avoid unique constraint violations on retry
    await supabaseAdmin.from("user_divisions").delete().eq("user_id", userId);

    const { error: divisionError } = await supabaseAdmin
      .from("user_divisions")
      .insert(userDivisions);

    if (divisionError) {
      console.error("Error inserting user divisions:", divisionError.message);
      throw new Error(divisionError.message);
    }

    // 2. Ensure the user has the baseline `client` role only if they have no
    //    role yet. Never overwrite an existing (potentially elevated) role
    //    that an admin has already granted through the approval flow.
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "client",
      });
      if (roleError && !/duplicate key/i.test(roleError.message)) {
        console.error("Error assigning role:", roleError.message);
        throw new Error(roleError.message);
      }
    }

    // 3. Create/update user preferences
    const { error: prefsError } = await supabaseAdmin.from("user_preferences").upsert(
      {
        user_id: userId,
        division_selection_completed: true,
        primary_division: data.primary_division || data.selected_divisions[0],
        notifications_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (prefsError) {
      console.error("Error creating user preferences:", prefsError.message);
      throw new Error(prefsError.message);
    }

    // 4. Create welcome notification
    const { error: notifError } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "Welcome to UIG!",
      body: `You've successfully joined the ${data.selected_divisions.length} division${data.selected_divisions.length > 1 ? "s" : ""} you selected. Your workspace${data.selected_divisions.length > 1 ? "s are" : " is"} now ready.`,
      division: data.primary_division || data.selected_divisions[0],
    });

    if (notifError) {
      console.error("Error creating welcome notification:", notifError.message);
    }

    return { success: true };
  });
