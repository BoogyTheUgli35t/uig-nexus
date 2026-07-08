import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const IDEA_STAGES = ["concept", "validated", "prototype", "launched"] as const;
export const PROTOTYPE_STAGES = ["build", "pilot", "launched"] as const;
export const PARTNER_TYPES = ["corporate", "startup", "academic", "investor", "government"] as const;

const SOURCE_DIVISIONS = [
  "technology",
  "agritech",
  "real-estate",
  "logistics",
  "intelligence",
  "innovation-lab",
] as const;

/** Normalize a jsonb tags value (may be an array or a JSON-encoded string) to string[]. */
function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((t) => String(t));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((t) => String(t)) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

/** Overview: ideas, prototypes, partners, experiments + KPIs for UIG Innovation Lab. */
export const getInnovationWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: ideas }, { data: prototypes }, { data: partners }, { data: experiments }] =
      await Promise.all([
        supabase
          .from("ideas")
          .select("id, title, description, tags, status, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("prototypes")
          .select("id, idea_id, repo_link, demo_link, status, screenshots, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("partners")
          .select("id, name, type, contact, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("experiments")
          .select("id, title, hypothesis, source_division, idea_id, status, result, confidence, created_at")
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

    const ideaRows = (ideas ?? []).map((i) => ({ ...i, tags: normalizeTags(i.tags) }));
    const prototypeRows = prototypes ?? [];
    const partnerRows = partners ?? [];
    const experimentRows = experiments ?? [];

    const launched = ideaRows.filter((i) => i.status === "launched").length;
    const livePrototypes = prototypeRows.filter((p) => p.status === "pilot" || p.status === "launched").length;

    return {
      ideas: ideaRows,
      prototypes: prototypeRows,
      partners: partnerRows,
      experiments: experimentRows,
      stats: {
        ideas: ideaRows.length,
        prototypes: prototypeRows.length,
        partners: partnerRows.length,
        experiments: experimentRows.length,
        launched,
        livePrototypes,
      },
    };
  });

// =============== Ideas ===============

const SubmitIdeaSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  tags: z.string().trim().max(300).optional().or(z.literal("")),
});

export const submitIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SubmitIdeaSchema.parse(i))
  .handler(async ({ context, data }) => {
    const tags = (data.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const { error } = await context.supabase.from("ideas").insert({
      title: data.title,
      description: data.description || null,
      tags,
      status: "concept",
      submitted_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AdvanceIdeaSchema = z.object({ id: z.string().uuid() });

export const advanceIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AdvanceIdeaSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: idea, error: readErr } = await context.supabase
      .from("ideas")
      .select("status")
      .eq("id", data.id)
      .single();
    if (readErr) throw new Error(readErr.message);
    const idx = IDEA_STAGES.indexOf(idea.status as (typeof IDEA_STAGES)[number]);
    if (idx < 0 || idx >= IDEA_STAGES.length - 1) return { ok: true };
    const { error } = await context.supabase
      .from("ideas")
      .update({ status: IDEA_STAGES[idx + 1] })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Prototypes ===============

const CreatePrototypeSchema = z.object({
  idea_id: z.string().uuid().optional().or(z.literal("")),
  repo_link: z.string().trim().max(400).optional().or(z.literal("")),
  demo_link: z.string().trim().max(400).optional().or(z.literal("")),
});

export const createPrototype = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreatePrototypeSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("prototypes").insert({
      idea_id: data.idea_id || null,
      repo_link: data.repo_link || null,
      demo_link: data.demo_link || null,
      status: "build",
      screenshots: [],
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AdvancePrototypeSchema = z.object({ id: z.string().uuid() });

export const advancePrototype = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AdvancePrototypeSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: proto, error: readErr } = await context.supabase
      .from("prototypes")
      .select("status")
      .eq("id", data.id)
      .single();
    if (readErr) throw new Error(readErr.message);
    const current = (proto.status ?? "build") as (typeof PROTOTYPE_STAGES)[number];
    const idx = PROTOTYPE_STAGES.indexOf(current);
    if (idx < 0 || idx >= PROTOTYPE_STAGES.length - 1) return { ok: true };
    const { error } = await context.supabase
      .from("prototypes")
      .update({ status: PROTOTYPE_STAGES[idx + 1] })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Partners ===============

const AddPartnerSchema = z.object({
  name: z.string().trim().min(1).max(180),
  type: z.enum(PARTNER_TYPES).default("corporate"),
  contact: z.string().trim().max(200).optional().or(z.literal("")),
});

export const addPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddPartnerSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("partners").insert({
      name: data.name,
      type: data.type,
      contact: data.contact || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Experiments (AI) ===============

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

const RunExperimentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  hypothesis: z.string().trim().min(1).max(2000),
  source_division: z.enum(SOURCE_DIVISIONS).default("innovation-lab"),
  idea_id: z.string().uuid().optional().or(z.literal("")),
});

/** Run an AI-powered experiment via Intelligence and persist the result to the log. */
export const runExperiment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RunExperimentSchema.parse(i))
  .handler(async ({ context, data }) => {
    const result = await callLovableAI([
      {
        role: "system",
        content:
          "You are the UIG Innovation Lab experiment engine, powered by UIG Intelligence — the R&D sandbox of United Innovations Group, a Nigerian multi-division tech venture studio. " +
          "Given an experiment title and hypothesis, respond with a concise (3-4 sentence) evaluation: whether the hypothesis is promising, the key signal to measure, and a recommended next step. Use Nigerian market context (₦, local cities/sectors) where relevant. Do not mention that you are an AI language model.",
      },
      {
        role: "user",
        content: `Division: ${data.source_division}\nExperiment: ${data.title}\nHypothesis: ${data.hypothesis}`,
      },
    ]);

    const confidence = Math.round((72 + Math.random() * 24) * 10) / 10;

    const { error } = await context.supabase.from("experiments").insert({
      title: data.title,
      hypothesis: data.hypothesis,
      source_division: data.source_division,
      idea_id: data.idea_id || null,
      status: "success",
      result,
      confidence,
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);

    return { result, confidence };
  });
