import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const MODEL_LIFECYCLE = ["draft", "training", "trained", "deployed", "monitoring"] as const;

export const MODEL_TYPES = [
  "regression",
  "classification",
  "forecast",
  "nlp",
  "vision",
  "recommendation",
] as const;

export const DATASET_STATUSES = ["uploaded", "processing", "ready", "error"] as const;

const SOURCE_DIVISIONS = [
  "technology",
  "agritech",
  "real-estate",
  "logistics",
  "intelligence",
  "innovation-lab",
] as const;

/** Overview: datasets, models, predictions + KPIs for UIG Intelligence. */
export const getIntelligenceWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: datasets }, { data: models }, { data: predictions }] = await Promise.all([
      supabase
        .from("datasets")
        .select("id, name, source_division, description, rows_count, size_mb, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("models")
        .select(
          "id, name, dataset_id, model_type, target_division, status, accuracy, version, updated_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("predictions")
        .select("id, model_id, prompt, result, confidence, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const datasetRows = datasets ?? [];
    const modelRows = models ?? [];
    const predictionRows = predictions ?? [];

    const deployed = modelRows.filter(
      (m) => m.status === "deployed" || m.status === "monitoring",
    ).length;
    const trainedAccuracies = modelRows
      .filter((m) => m.accuracy > 0)
      .map((m) => Number(m.accuracy));
    const avgAccuracy = trainedAccuracies.length
      ? Math.round((trainedAccuracies.reduce((a, b) => a + b, 0) / trainedAccuracies.length) * 10) /
        10
      : 0;
    const totalRows = datasetRows.reduce((a, d) => a + (d.rows_count ?? 0), 0);

    return {
      datasets: datasetRows,
      models: modelRows,
      predictions: predictionRows,
      stats: {
        datasets: datasetRows.length,
        models: modelRows.length,
        deployed,
        avgAccuracy,
        totalRows,
      },
    };
  });

// =============== Datasets ===============

const AddDatasetSchema = z.object({
  name: z.string().trim().min(1).max(180),
  source_division: z.enum(SOURCE_DIVISIONS).default("intelligence"),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  rows_count: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
  size_mb: z.coerce.number().min(0).max(1_000_000).default(0),
});

export const addDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => AddDatasetSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("datasets").insert({
      name: data.name,
      source_division: data.source_division,
      description: data.description || null,
      rows_count: data.rows_count,
      size_mb: data.size_mb,
      status: "ready",
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Models ===============

const CreateModelSchema = z.object({
  name: z.string().trim().min(1).max(180),
  dataset_id: z.string().uuid().optional().or(z.literal("")),
  model_type: z.enum(MODEL_TYPES).default("regression"),
  target_division: z.enum(SOURCE_DIVISIONS).default("intelligence"),
});

export const createModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => CreateModelSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("models").insert({
      name: data.name,
      dataset_id: data.dataset_id || null,
      model_type: data.model_type,
      target_division: data.target_division,
      status: "draft",
      accuracy: 0,
      version: "v0.1",
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AdvanceModelSchema = z.object({ id: z.string().uuid() });

/** Move a model to the next lifecycle stage. "training" → "trained" simulates an evaluation accuracy. */
export const advanceModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => AdvanceModelSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: model, error: readErr } = await context.supabase
      .from("models")
      .select("status, accuracy")
      .eq("id", data.id)
      .single();
    if (readErr) throw new Error(readErr.message);

    const idx = MODEL_LIFECYCLE.indexOf(model.status as (typeof MODEL_LIFECYCLE)[number]);
    if (idx < 0 || idx >= MODEL_LIFECYCLE.length - 1) {
      return { ok: true };
    }
    const next = MODEL_LIFECYCLE[idx + 1];
    const update: { status: string; accuracy?: number } = { status: next };
    // When evaluation finishes (training → trained), assign a realistic accuracy.
    if (next === "trained" && (!model.accuracy || model.accuracy === 0)) {
      update.accuracy = Math.round((82 + Math.random() * 14) * 10) / 10;
    }
    const { error } = await context.supabase.from("models").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== AI: predictions + assistant ===============

async function callLovableAI(messages: { role: string; content: string }[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
    }),
  });

  if (res.status === 429) {
    throw new Error("AI rate limit reached. Please try again in a moment.");
  }
  if (res.status === 402) {
    throw new Error("AI credits exhausted. Add credits in your workspace to continue.");
  }
  if (!res.ok) {
    throw new Error(`AI request failed (${res.status}).`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

const RunPredictionSchema = z.object({
  model_id: z.string().uuid().optional().or(z.literal("")),
  prompt: z.string().trim().min(1).max(2000),
});

/** Run a live AI prediction against a model and persist the result. */
export const runPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => RunPredictionSchema.parse(i))
  .handler(async ({ context, data }) => {
    let modelContext = "a general-purpose UIG Intelligence model";
    if (data.model_id) {
      const { data: model } = await context.supabase
        .from("models")
        .select("name, model_type, target_division")
        .eq("id", data.model_id)
        .single();
      if (model) {
        modelContext = `the "${model.name}" ${model.model_type} model for the ${model.target_division} division`;
      }
    }

    const result = await callLovableAI([
      {
        role: "system",
        content:
          `You are ${modelContext} inside UIG Intelligence, the data-science brain of United Innovations Group (a Nigerian multi-division tech conglomerate). ` +
          "Respond to the prediction request with a concise, confident, data-backed estimate in 2-3 sentences. Use Nigerian context (Naira ₦, local cities) where relevant. Do not mention that you are an AI language model.",
      },
      { role: "user", content: data.prompt },
    ]);

    const confidence = Math.round((78 + Math.random() * 18) * 10) / 10;

    const { error } = await context.supabase.from("predictions").insert({
      model_id: data.model_id || null,
      prompt: data.prompt,
      result,
      confidence,
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);

    return { result, confidence };
  });

const ASSISTANT_SYSTEM_PROMPT =
  "You are the UIG Intelligence Assistant — the AI advisor for United Innovations Group, a Nigerian multi-division group spanning Technology, AgriTech, Real Estate, Logistics, Intelligence and an Innovation Lab. " +
  "Give clear, practical insight in markdown. Be concise (under 200 words) unless asked for depth. Use Nigerian context where relevant.";

/** Loads the signed-in user's persisted chat history (most recent 40 messages). */
export const listMyChatMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(40);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const SendChatMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

/** Multi-turn assistant chat: persists the user's message, replies with the last
 * ~12 turns of real conversation history as context, and persists the reply too —
 * a genuine conversation thread rather than a one-shot Q&A. */
export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => SendChatMessageSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: history } = await context.supabase
      .from("ai_chat_messages")
      .select("role, content")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(12);

    const { error: insertErr } = await context.supabase.from("ai_chat_messages").insert({
      user_id: context.userId,
      role: "user",
      content: data.message,
    });
    if (insertErr) throw new Error(insertErr.message);

    const messages = [
      { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
      ...(history ?? []).reverse(),
      { role: "user", content: data.message },
    ];
    const answer = await callLovableAI(messages);

    const { error: replyErr } = await context.supabase.from("ai_chat_messages").insert({
      user_id: context.userId,
      role: "assistant",
      content: answer,
    });
    if (replyErr) throw new Error(replyErr.message);

    return { answer };
  });

export const clearMyChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("ai_chat_messages")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
