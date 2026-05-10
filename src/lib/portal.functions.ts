import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }, { data: projects }, { data: tasks }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url, org_id").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("projects").select("id, name, type, status, updated_at").order("updated_at", { ascending: false }).limit(5),
      supabase.from("tasks").select("id, title, status, due_date, project_id").order("created_at", { ascending: false }).limit(8),
    ]);
    const { count: projectsCount } = await supabase.from("projects").select("*", { count: "exact", head: true });
    const { count: openTasksCount } = await supabase.from("tasks").select("*", { count: "exact", head: true }).neq("status", "done");
    const { count: docsCount } = await supabase.from("documents").select("*", { count: "exact", head: true });
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
      supabase.from("tasks").select("*").eq("project_id", data.id).order("created_at", { ascending: false }),
      supabase.from("documents").select("*").eq("project_id", data.id).order("created_at", { ascending: false }),
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
    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", userId).maybeSingle();
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
  user_id: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const logPortalEvent = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuditEventSchema.parse(i))
  .handler(async ({ data }) => {
    let ip: string | null = null;
    let ua: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
      ua = getRequestHeader("user-agent") ?? null;
    } catch {
      // ignore
    }
    const { error } = await supabaseAdmin.from("portal_audit_log").insert({
      user_id: data.user_id ?? null,
      email: data.email ?? null,
      event_type: data.event_type,
      metadata: data.metadata ?? {},
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
  requested_role: z.enum(["admin", "staff", "client"]).default("client"),
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

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return { roles: (data ?? []).map((r) => r.role as string), userId: context.userId };
  });
