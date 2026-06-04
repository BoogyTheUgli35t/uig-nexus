import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const FARMER_STATUSES = ["active", "onboarding", "inactive"] as const;
export const FIELD_STATUSES = ["healthy", "at_risk", "critical"] as const;

/** Overview: farmers, fields, sensors, yield predictions + KPIs for UIG AgriTech. */
export const getAgriWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: farmers }, { data: fields }, { data: sensors }, { data: predictions }] =
      await Promise.all([
        supabase
          .from("farmers")
          .select("id, full_name, location, cooperative, primary_crop, hectares, status, updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("fields")
          .select("id, farmer_id, name, crop, hectares, health, status, updated_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("sensor_data")
          .select("id, field_id, soil_moisture, temperature, humidity, recorded_at")
          .order("recorded_at", { ascending: false })
          .limit(300),
        supabase
          .from("yield_predictions")
          .select("id, field_id, season, predicted_yield_tons, confidence")
          .order("created_at", { ascending: true }),
      ]);

    const farmerRows = farmers ?? [];
    const fieldRows = fields ?? [];
    const sensorRows = sensors ?? [];
    const predictionRows = predictions ?? [];

    // Latest reading per field
    const latestByField = new Map<string, (typeof sensorRows)[number]>();
    for (const s of sensorRows) {
      if (!latestByField.has(s.field_id)) latestByField.set(s.field_id, s);
    }

    const totalHectares = farmerRows.reduce((sum, f) => sum + Number(f.hectares ?? 0), 0);
    const atRisk = fieldRows.filter((f) => f.status !== "healthy").length;
    const avgHealth = fieldRows.length
      ? Math.round(fieldRows.reduce((s, f) => s + f.health, 0) / fieldRows.length)
      : 0;

    return {
      farmers: farmerRows,
      fields: fieldRows,
      latestReadings: Array.from(latestByField.values()),
      predictions: predictionRows,
      stats: {
        farmers: farmerRows.length,
        fields: fieldRows.length,
        totalHectares: Math.round(totalHectares * 10) / 10,
        atRiskFields: atRisk,
        avgHealth,
      },
    };
  });

const OnboardFarmerSchema = z.object({
  full_name: z.string().trim().min(1).max(150),
  location: z.string().trim().max(150).optional().or(z.literal("")),
  cooperative: z.string().trim().max(150).optional().or(z.literal("")),
  primary_crop: z.string().trim().max(100).optional().or(z.literal("")),
  hectares: z.coerce.number().min(0).max(100000).default(0),
});

export const onboardFarmer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OnboardFarmerSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("farmers").insert({
      full_name: data.full_name,
      location: data.location || null,
      cooperative: data.cooperative || null,
      primary_crop: data.primary_crop || null,
      hectares: data.hectares,
      status: "onboarding",
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateFieldStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(FIELD_STATUSES),
});

export const updateFieldStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateFieldStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const health = data.status === "healthy" ? 90 : data.status === "at_risk" ? 60 : 30;
    const { error } = await context.supabase
      .from("fields")
      .update({ status: data.status, health })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
