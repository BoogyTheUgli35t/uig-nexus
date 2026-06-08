import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PROPERTY_TYPES = ["residential", "commercial", "land", "mixed_use"] as const;
export const PROPERTY_STATUSES = ["available", "reserved", "sold", "rented", "off_market"] as const;
export const LEAD_STAGES = ["new", "contacted", "viewing", "negotiation", "closed", "lost"] as const;

/** Overview: properties, tenants, investors, leads + KPIs for UIG Real Estate. */
export const getRealEstateWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: properties }, { data: tenants }, { data: investors }, { data: leads }] =
      await Promise.all([
        supabase
          .from("properties")
          .select(
            "id, title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, updated_at",
          )
          .order("created_at", { ascending: true }),
        supabase
          .from("tenants")
          .select(
            "id, property_id, full_name, email, phone, rent_amount, lease_start, lease_end, payment_status",
          )
          .order("created_at", { ascending: true }),
        supabase
          .from("investors")
          .select("id, full_name, email, phone, amount_invested, portfolio_value, expected_roi")
          .order("portfolio_value", { ascending: false }),
        supabase
          .from("leads")
          .select("id, property_id, full_name, email, phone, stage, notes, updated_at")
          .order("created_at", { ascending: false }),
      ]);

    const propertyRows = properties ?? [];
    const tenantRows = tenants ?? [];
    const investorRows = investors ?? [];
    const leadRows = leads ?? [];

    const portfolioValue = propertyRows.reduce((s, p) => s + Number(p.price ?? 0), 0);
    const available = propertyRows.filter((p) => p.status === "available").length;
    const monthlyRent = tenantRows.reduce((s, t) => s + Number(t.rent_amount ?? 0), 0);
    const invested = investorRows.reduce((s, i) => s + Number(i.amount_invested ?? 0), 0);
    const investorValue = investorRows.reduce((s, i) => s + Number(i.portfolio_value ?? 0), 0);
    const avgRoi = investorRows.length
      ? Math.round(
          (investorRows.reduce((s, i) => s + Number(i.expected_roi ?? 0), 0) / investorRows.length) *
            10,
        ) / 10
      : 0;
    const openLeads = leadRows.filter((l) => l.stage !== "closed" && l.stage !== "lost").length;

    return {
      properties: propertyRows,
      tenants: tenantRows,
      investors: investorRows,
      leads: leadRows,
      stats: {
        properties: propertyRows.length,
        available,
        portfolioValue,
        monthlyRent,
        invested,
        investorValue,
        investorGain: investorValue - invested,
        avgRoi,
        tenants: tenantRows.length,
        openLeads,
      },
    };
  });

const AddPropertySchema = z.object({
  title: z.string().trim().min(1).max(180),
  property_type: z.enum(PROPERTY_TYPES).default("residential"),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(1_000_000_000_000).default(0),
  bedrooms: z.coerce.number().int().min(0).max(100).default(0),
  bathrooms: z.coerce.number().int().min(0).max(100).default(0),
  area_sqm: z.coerce.number().min(0).max(10_000_000).default(0),
});

export const addProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddPropertySchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("properties").insert({
      title: data.title,
      property_type: data.property_type,
      city: data.city || null,
      address: data.address || null,
      price: data.price,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      area_sqm: data.area_sqm,
      status: "available",
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdatePropertyStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(PROPERTY_STATUSES),
});

export const updatePropertyStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdatePropertyStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("properties")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateLeadStageSchema = z.object({
  id: z.string().uuid(),
  stage: z.enum(LEAD_STAGES),
});

export const updateLeadStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateLeadStageSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("leads")
      .update({ stage: data.stage })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AddLeadSchema = z.object({
  full_name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(180).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  property_id: z.string().uuid().optional().or(z.literal("")),
});

export const addLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddLeadSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("leads").insert({
      full_name: data.full_name,
      email: data.email || null,
      phone: data.phone || null,
      property_id: data.property_id || null,
      stage: "new",
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
