import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const IDEA_STATUSES = ["concept", "prototype", "pilot", "production"] as const;
export const PROTOTYPE_STATUSES = ["concept", "design", "build", "pilot", "ready"] as const;

/** Overview: ideas, prototypes, partners + KPIs for the UIG Innovation Lab. */
export const getInnovationWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: ideas }, { data: prototypes }, { data: partners }] = await Promise.all([
      supabase.from("ideas").select("*").order("created_at", { ascending: false }),
      supabase.from("prototypes").select("*").order("created_at", { ascending: false }),
      supabase.from("partners").select("*").order("created_at", { ascending: false }),
    ]);

    const ideaRows = ideas ?? [];
    const prototypeRows = prototypes ?? [];
    const partnerRows = partners ?? [];

    return {
      ideas: ideaRows,
      prototypes: prototypeRows,
      partners: partnerRows,
      stats: {
        totalIdeas: ideaRows.length,
        activePrototypes: prototypeRows.filter((p) => p.status !== "ready").length,
        totalPartners: partnerRows.length,
        conceptIdeas: ideaRows.filter((i) => i.status === "concept").length,
      },
    };
  });

const SubmitIdeaSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  status: z.enum(IDEA_STATUSES).default("concept"),
});

export const submitIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SubmitIdeaSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("ideas").insert({
      title: data.title,
      description: data.description || null,
      tags: data.tags,
      status: data.status,
      submitted_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const CreatePrototypeSchema = z.object({
  idea_id: z.string().uuid(),
  repo_link: z.string().trim().url().optional().or(z.literal("")),
  demo_link: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(PROTOTYPE_STATUSES).default("concept"),
  screenshots: z.array(z.string()).default([]),
});

export const createPrototype = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreatePrototypeSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("prototypes").insert({
      idea_id: data.idea_id,
      repo_link: data.repo_link || null,
      demo_link: data.demo_link || null,
      status: data.status,
      screenshots: data.screenshots,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdatePrototypeStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(PROTOTYPE_STATUSES),
});

export const updatePrototypeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdatePrototypeStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("prototypes")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateIdeaStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(IDEA_STATUSES),
});

export const updateIdeaStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateIdeaStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("ideas")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AddPartnerSchema = z.object({
  name: z.string().trim().min(1).max(150),
  type: z.string().trim().max(100).optional().or(z.literal("")),
  contact: z.string().trim().max(200).optional().or(z.literal("")),
});

export const addPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddPartnerSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("partners").insert({
      name: data.name,
      type: data.type || null,
      contact: data.contact || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Prototype screenshot gallery ===============

const AddScreenshotSchema = z.object({
  prototype_id: z.string().uuid(),
  storage_path: z.string().trim().min(1).max(500),
});

export const addPrototypeScreenshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddScreenshotSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: proto, error: readErr } = await context.supabase
      .from("prototypes")
      .select("screenshots")
      .eq("id", data.prototype_id)
      .single();
    if (readErr) throw new Error(readErr.message);
    const existing = Array.isArray(proto.screenshots) ? (proto.screenshots as string[]) : [];
    const { error } = await context.supabase
      .from("prototypes")
      .update({ screenshots: [...existing, data.storage_path] })
      .eq("id", data.prototype_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removePrototypeScreenshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddScreenshotSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: proto, error: readErr } = await context.supabase
      .from("prototypes")
      .select("screenshots")
      .eq("id", data.prototype_id)
      .single();
    if (readErr) throw new Error(readErr.message);
    const existing = Array.isArray(proto.screenshots) ? (proto.screenshots as string[]) : [];
    const { error } = await context.supabase
      .from("prototypes")
      .update({ screenshots: existing.filter((p) => p !== data.storage_path) })
      .eq("id", data.prototype_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== MVP checklist generator (real AI, persisted, checkable) ===============

async function callLovableAI(messages: { role: string; content: string }[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
  });
  if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in your workspace to continue.");
  if (!res.ok) throw new Error(`AI request failed (${res.status}).`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

export const listChecklist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ idea_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: items, error } = await context.supabase
      .from("mvp_checklist_items")
      .select("id, task, done, created_at")
      .eq("idea_id", data.idea_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return items ?? [];
  });

/** Generates a real, AI-written MVP task checklist for an idea and persists it —
 * each call appends a fresh batch rather than overwriting, so a team can regenerate
 * for a new phase without losing progress on existing items. */
export const generateMvpChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ idea_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: idea, error: ideaErr } = await context.supabase
      .from("ideas")
      .select("title, description")
      .eq("id", data.idea_id)
      .single();
    if (ideaErr) throw new Error(ideaErr.message);

    const raw = await callLovableAI([
      {
        role: "system",
        content:
          "You generate MVP build checklists for a Nigerian innovation lab (UIG Innovation Lab). " +
          "Given an idea title and description, output ONLY a numbered list of 6-10 short, concrete MVP build tasks (one per line, no extra commentary, no markdown headers).",
      },
      {
        role: "user",
        content: `Idea: ${idea.title}\nDescription: ${idea.description ?? "(none provided)"}`,
      },
    ]);

    const tasks = raw
      .split("\n")
      .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 10);

    if (tasks.length > 0) {
      const { error } = await context.supabase
        .from("mvp_checklist_items")
        .insert(tasks.map((task) => ({ idea_id: data.idea_id, task })));
      if (error) throw new Error(error.message);
    }
    return { ok: true, count: tasks.length };
  });

export const toggleChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), done: z.boolean() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("mvp_checklist_items")
      .update({ done: data.done })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Demo day scheduler ===============

export const listDemoDays = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: days, error }, { data: slots }] = await Promise.all([
      context.supabase
        .from("demo_days")
        .select("id, title, event_date, status")
        .order("event_date", { ascending: true }),
      context.supabase.from("demo_day_slots").select("id, demo_day_id, prototype_id, slot_time"),
    ]);
    if (error) throw new Error(error.message);
    return { days: days ?? [], slots: slots ?? [] };
  });

const CreateDemoDaySchema = z.object({
  title: z.string().trim().min(1).max(180),
  event_date: z.string().trim().min(1),
});

export const createDemoDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateDemoDaySchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("demo_days")
      .insert({ title: data.title, event_date: data.event_date });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ScheduleSlotSchema = z.object({
  demo_day_id: z.string().uuid(),
  prototype_id: z.string().uuid(),
  slot_time: z.string().trim().max(40).optional().or(z.literal("")),
});

export const scheduleSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ScheduleSlotSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("demo_day_slots").insert({
      demo_day_id: data.demo_day_id,
      prototype_id: data.prototype_id,
      slot_time: data.slot_time || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unscheduleSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("demo_day_slots").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Experiment log (optionally tied to a real Intelligence model) ===============

export const listExperiments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("experiments")
      .select("id, idea_id, prototype_id, model_id, hypothesis, result, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Models available to link an experiment to — pulled straight from UIG
 * Intelligence's own `models` table, so this is a real cross-division link. */
export const listLinkableModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("models")
      .select("id, name, target_division")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CreateExperimentSchema = z.object({
  idea_id: z.string().uuid().optional().or(z.literal("")),
  prototype_id: z.string().uuid().optional().or(z.literal("")),
  model_id: z.string().uuid().optional().or(z.literal("")),
  hypothesis: z.string().trim().min(1).max(1000),
});

export const createExperiment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateExperimentSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("experiments").insert({
      idea_id: data.idea_id || null,
      prototype_id: data.prototype_id || null,
      model_id: data.model_id || null,
      title: data.hypothesis.slice(0, 120),
      hypothesis: data.hypothesis,
      status: "planned",
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateExperimentSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["planned", "running", "concluded"]).optional(),
  result: z.string().trim().max(2000).optional(),
});

export const updateExperiment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateExperimentSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("experiments")
      .update({
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.result !== undefined ? { result: data.result } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Public submission review queue ===============
// Reviews the intake from the public "submit an idea" form
// (src/routes/divisions.innovation-lab.submit.tsx, written via the
// unauthenticated submitPublicIdea in public-innovation.functions.ts). Staff
// triage here and manually promote worthwhile ones into `ideas` via
// submitIdea above — deliberately not automatic.

export const SUBMISSION_STATUSES = ["new", "reviewing", "accepted", "declined"] as const;

export const listInnovationSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("innovation_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const ReviewSubmissionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(SUBMISSION_STATUSES),
  reviewer_notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const reviewSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReviewSubmissionSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("innovation_submissions")
      .update({
        status: data.status,
        ...(data.reviewer_notes !== undefined ? { reviewer_notes: data.reviewer_notes || null } : {}),
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Upvote tallies for the idea board: total votes per idea + which ones the caller voted for. */
export const listIdeaVotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("idea_votes").select("idea_id, user_id");
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = {};
    const mine: string[] = [];
    for (const row of data ?? []) {
      counts[row.idea_id] = (counts[row.idea_id] ?? 0) + 1;
      if (row.user_id === context.userId) mine.push(row.idea_id);
    }
    return { counts, mine };
  });

const ToggleIdeaVoteSchema = z.object({ idea_id: z.string().uuid() });

export const toggleIdeaVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ToggleIdeaVoteSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("idea_votes")
      .select("id")
      .eq("idea_id", data.idea_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("idea_votes").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { voted: false };
    }

    const { error } = await supabase.from("idea_votes").insert({ idea_id: data.idea_id, user_id: userId });
    if (error) throw new Error(error.message);
    return { voted: true };
  });
