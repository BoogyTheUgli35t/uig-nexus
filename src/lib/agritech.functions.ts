import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const FARMER_STATUSES = ["active", "onboarding", "inactive"] as const;
export const FIELD_STATUSES = ["healthy", "at_risk", "critical"] as const;
export const ALERT_SEVERITIES = ["low", "medium", "high"] as const;
export const IMAGE_SOURCES = ["drone", "manual"] as const;

/** Overview: farmers, fields, sensors, yield predictions, alerts + KPIs. */
export const getAgriWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: farmers }, { data: fields }, { data: sensors }, { data: predictions }, { data: alerts }] =
      await Promise.all([
        supabase
          .from("farmers")
          .select(
            "id, full_name, location, cooperative, primary_crop, hectares, status, phone, updated_at, user_id",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("fields")
          .select("id, farmer_id, name, crop, hectares, health, status, lat, lng, updated_at")
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
        supabase
          .from("agri_alerts")
          .select("id, field_id, severity, message, acknowledged, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

    const farmerRows = farmers ?? [];
    const fieldRows = fields ?? [];
    const sensorRows = sensors ?? [];
    const predictionRows = predictions ?? [];
    const alertRows = alerts ?? [];

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
    const openAlerts = alertRows.filter((a) => !a.acknowledged).length;

    const cooperatives = Array.from(
      new Set(farmerRows.map((f) => f.cooperative).filter((c): c is string => Boolean(c))),
    ).sort();

    return {
      farmers: farmerRows,
      fields: fieldRows,
      latestReadings: Array.from(latestByField.values()),
      predictions: predictionRows,
      alerts: alertRows,
      cooperatives,
      stats: {
        farmers: farmerRows.length,
        fields: fieldRows.length,
        totalHectares: Math.round(totalHectares * 10) / 10,
        atRiskFields: atRisk,
        avgHealth,
        openAlerts,
        cooperatives: cooperatives.length,
      },
    };
  });

const OnboardFarmerSchema = z.object({
  full_name: z.string().trim().min(1).max(150),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  location: z.string().trim().max(150).optional().or(z.literal("")),
  cooperative: z.string().trim().max(150).optional().or(z.literal("")),
  primary_crop: z.string().trim().max(100).optional().or(z.literal("")),
  hectares: z.coerce.number().min(0).max(100000).default(0),
  first_field_name: z.string().trim().max(150).optional().or(z.literal("")),
});

/** Farmer onboarding wizard's final step: creates the farmer and, if given, their
 * first field in one go. */
export const onboardFarmer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OnboardFarmerSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: farmer, error } = await context.supabase
      .from("farmers")
      .insert({
        full_name: data.full_name,
        phone: data.phone || null,
        location: data.location || null,
        cooperative: data.cooperative || null,
        primary_crop: data.primary_crop || null,
        hectares: data.hectares,
        status: "onboarding",
        owner_id: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.first_field_name?.trim()) {
      await context.supabase.from("fields").insert({
        farmer_id: farmer.id,
        name: data.first_field_name.trim(),
        crop: data.primary_crop || null,
        hectares: data.hectares,
        status: "healthy",
        health: 90,
      });
    }
    return { ok: true, id: farmer.id };
  });

const UpdateFieldStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(FIELD_STATUSES),
});

/** Updating a field to at_risk/critical raises a real alert row (not just a badge
 * change) so it surfaces on the alerting panel. */
export const updateFieldStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateFieldStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const health = data.status === "healthy" ? 90 : data.status === "at_risk" ? 60 : 30;
    const { data: field, error } = await context.supabase
      .from("fields")
      .update({ status: data.status, health })
      .eq("id", data.id)
      .select("name, farmer_id")
      .single();
    if (error) throw new Error(error.message);

    if (data.status !== "healthy") {
      const message = `${field.name} marked ${data.status.replace(/_/g, " ")}`;
      await context.supabase.from("agri_alerts").insert({
        field_id: data.id,
        severity: data.status === "critical" ? "high" : "medium",
        message,
      });

      // Best-effort notification to the farmer's account owner, if linked.
      const { data: farmer } = await context.supabase
        .from("farmers")
        .select("owner_id")
        .eq("id", field.farmer_id)
        .maybeSingle();
      if (farmer?.owner_id) {
        await context.supabase.from("notifications").insert({
          user_id: farmer.owner_id,
          title: data.status === "critical" ? "Field alert: critical" : "Field alert",
          body: message,
          division: "agritech",
        });
      }
    }
    return { ok: true };
  });

export const acknowledgeAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("agri_alerts")
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Bulk-renames a cooperative across every farmer that belongs to it — the closest
 * thing to "cooperative management" without introducing a whole separate table. */
const RenameCooperativeSchema = z.object({
  from: z.string().trim().min(1).max(150),
  to: z.string().trim().min(1).max(150),
});

export const renameCooperative = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RenameCooperativeSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("farmers")
      .update({ cooperative: data.to })
      .eq("cooperative", data.from);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Field detail: field row + farmer + sensor history + images. */
export const getFieldDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: field, error } = await context.supabase
      .from("fields")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const [{ data: farmer }, { data: readings }, { data: images }, { data: alerts }] = await Promise.all([
      context.supabase.from("farmers").select("id, full_name, phone").eq("id", field.farmer_id).single(),
      context.supabase
        .from("sensor_data")
        .select("id, soil_moisture, temperature, humidity, recorded_at")
        .eq("field_id", data.id)
        .order("recorded_at", { ascending: true })
        .limit(60),
      context.supabase
        .from("field_images")
        .select("id, storage_path, caption, source, created_at")
        .eq("field_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("agri_alerts")
        .select("id, severity, message, acknowledged, created_at")
        .eq("field_id", data.id)
        .order("created_at", { ascending: false }),
    ]);

    return {
      field,
      farmer: farmer ?? null,
      readings: readings ?? [],
      images: images ?? [],
      alerts: alerts ?? [],
    };
  });

const AddFieldImageSchema = z.object({
  field_id: z.string().uuid(),
  storage_path: z.string().trim().min(1).max(500),
  caption: z.string().trim().max(240).optional().or(z.literal("")),
  source: z.enum(IMAGE_SOURCES).default("manual"),
});

export const addFieldImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddFieldImageSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("field_images").insert({
      field_id: data.field_id,
      storage_path: data.storage_path,
      caption: data.caption || null,
      source: data.source,
      uploaded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFieldImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("field_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Farmer self-service ===============
// Mirrors the driver/investor self-service pattern: an admin grants the
// 'farmer' role via /portal/admin/users, then a staff member links the
// farmer record to that person's portal account by email. Once linked,
// "farmers read own record/fields/alerts/sensor data" RLS lets them see
// only their own farm data via getMyFarmerProfile.

const LinkFarmerSchema = z.object({
  farmer_id: z.string().uuid(),
  email: z.string().trim().email(),
});

export const linkFarmerAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LinkFarmerSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw new Error(listErr.message);
    const match = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!match) throw new Error("No UIG portal account found with that email.");

    const { error } = await context.supabase
      .from("farmers")
      .update({ user_id: match.id })
      .eq("id", data.farmer_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** The signed-in farmer's own record + fields, or null if this account isn't
 * linked to a farmer record yet. */
export const getMyFarmerProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: farmer, error } = await context.supabase
      .from("farmers")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!farmer) return null;

    const { data: fields } = await context.supabase
      .from("fields")
      .select("id, name, crop, hectares, health, status, lat, lng, updated_at")
      .eq("farmer_id", farmer.id);

    return { farmer, fields: fields ?? [] };
  });
