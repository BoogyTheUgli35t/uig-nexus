import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PROJECT_STATUSES = ["discovery", "building", "review", "live", "paused"] as const;
export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export const DEPLOY_ENVIRONMENTS = ["staging", "production"] as const;
export const DEPLOY_STATUSES = ["pending", "success", "failed"] as const;
export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue"] as const;
export const TRIGGER_TYPES = ["manual", "on_task_done", "on_status_change", "schedule"] as const;
export const ACTION_TYPES = ["notify", "create_task", "send_webhook", "update_status"] as const;

/** Overview: projects, tasks, integrations + KPIs for the UIG Technology workspace. */
export const getTechWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: projects }, { data: tasks }, { data: integrations }, { data: invoices }] =
      await Promise.all([
        supabase
          .from("tech_projects")
          .select(
            "id, title, client_name, client_email, status, progress, budget, sla_hours, due_date, updated_at",
          )
          .order("updated_at", { ascending: false }),
        supabase
          .from("tech_tasks")
          .select("id, tech_project_id, title, status, due_date, created_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("integrations")
          .select("id, name, provider, status, last_sync")
          .order("created_at", { ascending: true }),
        supabase.from("project_invoices").select("id, tech_project_id, amount, status, due_date"),
      ]);
    const projectRows = projects ?? [];
    const taskRows = tasks ?? [];
    const integrationRows = integrations ?? [];
    const invoiceRows = invoices ?? [];

    const overdueTasks = taskRows.filter(
      (t) => t.due_date && new Date(t.due_date).getTime() < Date.now() && t.status !== "done",
    ).length;
    const outstandingRevenue = invoiceRows
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((s, i) => s + Number(i.amount ?? 0), 0);
    const slaAtRisk = projectRows.filter((p) => {
      if (!p.sla_hours || !p.due_date) return false;
      const hoursLeft = (new Date(p.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
      return hoursLeft < p.sla_hours && p.status !== "live" && p.status !== "paused";
    }).length;

    return {
      projects: projectRows,
      tasks: taskRows,
      integrations: integrationRows,
      stats: {
        activeProjects: projectRows.filter((p) => p.status !== "live" && p.status !== "paused")
          .length,
        liveProjects: projectRows.filter((p) => p.status === "live").length,
        openTasks: taskRows.filter((t) => t.status !== "done").length,
        overdueTasks,
        connectedIntegrations: integrationRows.filter((i) => i.status === "connected").length,
        outstandingRevenue,
        slaAtRisk,
      },
    };
  });

// =============== Filtered project list ===============

const ListProjectsSchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  search: z.string().trim().max(150).optional().or(z.literal("")),
});

export const listTechProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListProjectsSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("tech_projects")
      .select(
        "id, title, client_name, client_email, status, progress, budget, sla_hours, start_date, due_date, created_at, updated_at",
      )
      .order("updated_at", { ascending: false });
    if (data.status) query = query.eq("status", data.status);
    if (data.search) query = query.ilike("title", `%${data.search}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// =============== Project detail ===============

const ProjectIdSchema = z.object({ id: z.string().uuid() });

export const getTechProjectDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ProjectIdSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const [
      { data: project, error },
      { data: tasks },
      { data: deployments },
      { data: invoices },
      { data: documents },
    ] = await Promise.all([
      supabase.from("tech_projects").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("tech_tasks")
        .select("*")
        .eq("tech_project_id", data.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("deployments")
        .select("*")
        .eq("tech_project_id", data.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_invoices")
        .select("*")
        .eq("tech_project_id", data.id)
        .order("issued_at", { ascending: false }),
      supabase
        .from("tech_project_documents")
        .select("*")
        .eq("tech_project_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");

    return {
      project,
      tasks: tasks ?? [],
      deployments: deployments ?? [],
      invoices: invoices ?? [],
      documents: documents ?? [],
    };
  });

// =============== Create / update project ===============

const CreateProjectSchema = z.object({
  title: z.string().trim().min(1).max(150),
  client_name: z.string().trim().max(150).optional().or(z.literal("")),
  client_email: z.string().trim().email().max(180).optional().or(z.literal("")),
  status: z.enum(PROJECT_STATUSES).default("discovery"),
  budget: z.coerce.number().min(0).optional(),
  sla_hours: z.coerce.number().int().min(1).optional(),
  start_date: z.string().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
});

export const createTechProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateProjectSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("tech_projects")
      .insert({
        title: data.title,
        client_name: data.client_name || null,
        client_email: data.client_email || null,
        status: data.status,
        budget: data.budget ?? null,
        sla_hours: data.sla_hours ?? null,
        start_date: data.start_date || null,
        due_date: data.due_date || null,
        owner_id: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const UpdateProjectStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(PROJECT_STATUSES),
});

export const updateTechProjectStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateProjectStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const progress =
      data.status === "live"
        ? 100
        : data.status === "review"
          ? 80
          : data.status === "building"
            ? 50
            : data.status === "paused"
              ? 40
              : 15;
    const { error } = await context.supabase
      .from("tech_projects")
      .update({ status: data.status, progress })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Tasks ===============

const AddTaskSchema = z.object({
  tech_project_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  assignee_email: z.string().trim().email().max(180).optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
});

export const addTechTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddTaskSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("tech_tasks").insert({
      tech_project_id: data.tech_project_id,
      title: data.title,
      description: data.description || null,
      assignee_email: data.assignee_email || null,
      due_date: data.due_date || null,
      status: "todo",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ToggleTaskSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(TASK_STATUSES),
});

export const updateTechTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ToggleTaskSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tech_tasks")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Deployments / release history ===============

const AddDeploymentSchema = z.object({
  tech_project_id: z.string().uuid(),
  version: z.string().trim().min(1).max(60),
  environment: z.enum(DEPLOY_ENVIRONMENTS).default("staging"),
  status: z.enum(DEPLOY_STATUSES).default("success"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const addDeployment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddDeploymentSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("deployments").insert({
      tech_project_id: data.tech_project_id,
      version: data.version,
      environment: data.environment,
      status: data.status,
      notes: data.notes || null,
      deployed_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Milestone invoices ===============

const AddInvoiceSchema = z.object({
  tech_project_id: z.string().uuid(),
  milestone: z.string().trim().min(1).max(150),
  amount: z.coerce.number().min(0).default(0),
  due_date: z.string().optional().or(z.literal("")),
});

export const addInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddInvoiceSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("project_invoices").insert({
      tech_project_id: data.tech_project_id,
      milestone: data.milestone,
      amount: data.amount,
      due_date: data.due_date || null,
      status: "draft",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateInvoiceStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(INVOICE_STATUSES),
});

export const updateInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateInvoiceStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("project_invoices")
      .update({
        status: data.status,
        paid_at: data.status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Automation rules (execution is simulated) ===============

export const listAutomationRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("automation_rules")
      .select("*, tech_projects(title)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CreateRuleSchema = z.object({
  name: z.string().trim().min(1).max(150),
  tech_project_id: z.string().uuid().optional(),
  trigger_type: z.enum(TRIGGER_TYPES).default("manual"),
  action_type: z.enum(ACTION_TYPES).default("notify"),
});

export const createAutomationRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateRuleSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("automation_rules").insert({
      name: data.name,
      tech_project_id: data.tech_project_id ?? null,
      trigger_type: data.trigger_type,
      action_type: data.action_type,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ToggleRuleSchema = z.object({ id: z.string().uuid(), enabled: z.boolean() });

export const toggleAutomationRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ToggleRuleSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("automation_rules")
      .update({ enabled: data.enabled })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * "Run now" — there is no real trigger engine wired up (no webhook dispatcher, no cron).
 * This simulates a single execution: bumps run_count/last_run_at, and for the "notify"
 * action type it does perform one real, useful side effect (inserting a notification for
 * the caller) so the button isn't purely cosmetic. Other action types are logged only.
 */
const RunRuleSchema = z.object({ id: z.string().uuid() });

export const runAutomationRuleNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RunRuleSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: rule, error: fetchErr } = await context.supabase
      .from("automation_rules")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!rule) throw new Error("Rule not found");

    const { error } = await context.supabase
      .from("automation_rules")
      .update({ run_count: (rule.run_count ?? 0) + 1, last_run_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (rule.action_type === "notify") {
      await context.supabase.from("notifications").insert({
        user_id: context.userId,
        division: "technology",
        title: `Automation: ${rule.name}`,
        body: "This rule ran (simulated) and triggered a notification action.",
      });
    }
    return { ok: true, simulated: true };
  });

// =============== Client aggregated view (read-only) ===============

export const getClientProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ client_name: z.string().trim().min(1) }).parse(i))
  .handler(async ({ context, data }) => {
    const [{ data: projects }] = await Promise.all([
      context.supabase
        .from("tech_projects")
        .select("id, title, status, progress, due_date, updated_at")
        .eq("client_name", data.client_name)
        .order("updated_at", { ascending: false }),
    ]);
    const projectIds = (projects ?? []).map((p) => p.id);
    const { data: deployments } = projectIds.length
      ? await context.supabase
          .from("deployments")
          .select("id, tech_project_id, version, environment, status, created_at")
          .in("tech_project_id", projectIds)
          .eq("environment", "production")
          .order("created_at", { ascending: false })
      : { data: [] };
    return { projects: projects ?? [], deployments: deployments ?? [] };
  });
