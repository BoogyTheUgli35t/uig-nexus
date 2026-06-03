import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PROJECT_STATUSES = ["discovery", "building", "review", "live", "paused"] as const;
export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

/** Overview: projects, tasks, integrations + KPIs for the UIG Technology workspace. */
export const getTechWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: projects }, { data: tasks }, { data: integrations }] = await Promise.all([
      supabase
        .from("tech_projects")
        .select("id, title, client_name, status, progress, updated_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("tech_tasks")
        .select("id, tech_project_id, title, status, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("integrations")
        .select("id, name, provider, status, last_sync")
        .order("created_at", { ascending: true }),
    ]);
    const projectRows = projects ?? [];
    const taskRows = tasks ?? [];
    const integrationRows = integrations ?? [];
    return {
      projects: projectRows,
      tasks: taskRows,
      integrations: integrationRows,
      stats: {
        activeProjects: projectRows.filter((p) => p.status !== "live" && p.status !== "paused").length,
        liveProjects: projectRows.filter((p) => p.status === "live").length,
        openTasks: taskRows.filter((t) => t.status !== "done").length,
        connectedIntegrations: integrationRows.filter((i) => i.status === "connected").length,
      },
    };
  });

const CreateProjectSchema = z.object({
  title: z.string().trim().min(1).max(150),
  client_name: z.string().trim().max(150).optional().or(z.literal("")),
  status: z.enum(PROJECT_STATUSES).default("discovery"),
});

export const createTechProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateProjectSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("tech_projects").insert({
      title: data.title,
      client_name: data.client_name || null,
      status: data.status,
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
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
      data.status === "live" ? 100 : data.status === "review" ? 80 : data.status === "building" ? 50 : data.status === "paused" ? 40 : 15;
    const { error } = await context.supabase
      .from("tech_projects")
      .update({ status: data.status, progress })
      .eq("id", data.id);
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
