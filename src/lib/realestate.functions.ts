import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PROPERTY_TYPES = ["residential", "commercial", "land", "mixed_use"] as const;
export const PROPERTY_STATUSES = ["available", "reserved", "sold", "rented", "off_market"] as const;
export const LEAD_STAGES = [
  "new",
  "contacted",
  "viewing",
  "negotiation",
  "closed",
  "lost",
] as const;
export const UNIT_STATUSES = ["vacant", "occupied", "maintenance"] as const;
export const ACTIVITY_TYPES = ["call", "email", "viewing", "note", "stage_change"] as const;

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
            "id, title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, featured, updated_at",
          )
          .order("created_at", { ascending: true }),
        supabase
          .from("tenants")
          .select(
            "id, property_id, unit_id, full_name, email, phone, rent_amount, lease_start, lease_end, payment_status, lease_signature_status, lease_sent_at, lease_signed_at, lease_signed_name, lease_document_path",
          )
          .order("created_at", { ascending: true }),
        supabase
          .from("investors")
          .select("id, full_name, email, phone, amount_invested, portfolio_value, expected_roi, user_id")
          .order("portfolio_value", { ascending: false }),
        supabase
          .from("leads")
          .select(
            "id, property_id, full_name, email, phone, stage, notes, budget_max, next_follow_up_date, created_at, updated_at",
          )
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
          (investorRows.reduce((s, i) => s + Number(i.expected_roi ?? 0), 0) /
            investorRows.length) *
            10,
        ) / 10
      : 0;
    const openLeads = leadRows.filter((l) => l.stage !== "closed" && l.stage !== "lost").length;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const newLeadsLast24h = leadRows.filter(
      (l) => new Date(l.created_at).getTime() >= oneDayAgo,
    ).length;
    const overdueFollowUps = leadRows.filter(
      (l) =>
        l.next_follow_up_date &&
        new Date(l.next_follow_up_date).getTime() < Date.now() &&
        l.stage !== "closed" &&
        l.stage !== "lost",
    ).length;

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
        newLeadsLast24h,
        overdueFollowUps,
      },
    };
  });

// =============== Property listing (filtered grid) ===============

const ListPropertiesSchema = z.object({
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  status: z.enum(PROPERTY_STATUSES).optional(),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minBedrooms: z.coerce.number().int().min(0).optional(),
  featuredOnly: z.boolean().optional(),
  search: z.string().trim().max(150).optional().or(z.literal("")),
});

export const listPropertiesFiltered = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListPropertiesSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("properties")
      .select(
        "id, title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured, created_at, updated_at",
      )
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.propertyType) query = query.eq("property_type", data.propertyType);
    if (data.status) query = query.eq("status", data.status);
    if (data.city) query = query.ilike("city", `%${data.city}%`);
    if (typeof data.minPrice === "number") query = query.gte("price", data.minPrice);
    if (typeof data.maxPrice === "number") query = query.lte("price", data.maxPrice);
    if (typeof data.minBedrooms === "number") query = query.gte("bedrooms", data.minBedrooms);
    if (data.featuredOnly) query = query.eq("featured", true);
    if (data.search) query = query.ilike("title", `%${data.search}%`);

    const { data: properties, error } = await query;
    if (error) throw new Error(error.message);

    const ids = (properties ?? []).map((p) => p.id);
    const { data: images } = ids.length
      ? await context.supabase
          .from("property_images")
          .select("property_id, storage_path, position")
          .in("property_id", ids)
          .order("position", { ascending: true })
      : { data: [] as { property_id: string; storage_path: string; position: number }[] };

    const coverByProperty = new Map<string, string>();
    for (const img of images ?? []) {
      if (!coverByProperty.has(img.property_id)) coverByProperty.set(img.property_id, img.storage_path);
    }

    return (properties ?? []).map((p) => ({
      ...p,
      coverImagePath: coverByProperty.get(p.id) ?? null,
    }));
  });

// =============== Property detail ===============

const PropertyIdSchema = z.object({ id: z.string().uuid() });

export const getPropertyDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PropertyIdSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const [{ data: property, error }, { data: images }, { data: units }, { data: tenants }, { data: leads }] =
      await Promise.all([
        supabase.from("properties").select("*").eq("id", data.id).maybeSingle(),
        supabase
          .from("property_images")
          .select("*")
          .eq("property_id", data.id)
          .order("position", { ascending: true }),
        supabase
          .from("property_units")
          .select("*")
          .eq("property_id", data.id)
          .order("unit_number", { ascending: true }),
        supabase.from("tenants").select("*").eq("property_id", data.id),
        supabase
          .from("leads")
          .select("id, full_name, stage, email, phone, created_at")
          .eq("property_id", data.id)
          .order("created_at", { ascending: false }),
      ]);
    if (error) throw new Error(error.message);
    if (!property) throw new Error("Property not found");

    const unitRows = units ?? [];
    const occupiedUnits = unitRows.filter((u) => u.status === "occupied").length;
    const totalUnits = unitRows.length;
    const unitMonthlyRevenue = unitRows
      .filter((u) => u.status === "occupied")
      .reduce((s, u) => s + Number(u.rent_amount ?? 0), 0);

    return {
      property,
      images: images ?? [],
      units: unitRows,
      tenants: tenants ?? [],
      leads: leads ?? [],
      analytics: {
        totalUnits,
        occupiedUnits,
        vacantUnits: totalUnits - occupiedUnits,
        occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : null,
        unitMonthlyRevenue,
      },
    };
  });

// =============== Create / update property (wizard) ===============

export const AMENITY_OPTIONS = [
  "solar_backup",
  "smart_locks",
  "cctv",
  "swimming_pool",
  "gym",
  "generator",
  "borehole",
  "parking",
  "serviced",
  "furnished",
] as const;

const CreatePropertySchema = z.object({
  title: z.string().trim().min(1).max(180),
  property_type: z.enum(PROPERTY_TYPES).default("residential"),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(1_000_000_000_000).default(0),
  bedrooms: z.coerce.number().int().min(0).max(100).default(0),
  bathrooms: z.coerce.number().int().min(0).max(100).default(0),
  area_sqm: z.coerce.number().min(0).max(10_000_000).default(0),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  year_built: z.coerce.number().int().min(1900).max(2100).optional(),
  amenities: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
});

export const createProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreatePropertySchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("properties")
      .insert({
        title: data.title,
        property_type: data.property_type,
        city: data.city || null,
        address: data.address || null,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area_sqm: data.area_sqm,
        description: data.description || null,
        year_built: data.year_built ?? null,
        amenities: data.amenities,
        featured: data.featured,
        status: "available",
        owner_id: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const UpdatePropertySchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(180).optional(),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(1_000_000_000_000).optional(),
  year_built: z.coerce.number().int().min(1900).max(2100).optional(),
  amenities: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

export const updateProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdatePropertySchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("properties")
      .update({
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.year_built !== undefined ? { year_built: data.year_built } : {}),
        ...(data.amenities !== undefined ? { amenities: data.amenities } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
      })
      .eq("id", data.id);
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

// =============== Property units ===============

const AddUnitSchema = z.object({
  property_id: z.string().uuid(),
  unit_number: z.string().trim().min(1).max(40),
  floor: z.coerce.number().int().optional(),
  bedrooms: z.coerce.number().int().min(0).max(50).default(0),
  bathrooms: z.coerce.number().int().min(0).max(50).default(0),
  area_sqm: z.coerce.number().min(0).max(1_000_000).default(0),
  rent_amount: z.coerce.number().min(0).max(1_000_000_000).default(0),
});

export const addUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddUnitSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("property_units").insert({
      property_id: data.property_id,
      unit_number: data.unit_number,
      floor: data.floor ?? null,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      area_sqm: data.area_sqm,
      rent_amount: data.rent_amount,
      status: "vacant",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateUnitStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(UNIT_STATUSES),
  tenant_id: z.string().uuid().optional().nullable(),
});

export const updateUnitStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateUnitStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("property_units")
      .update({
        status: data.status,
        tenant_id: data.status === "occupied" ? (data.tenant_id ?? null) : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Unit detail ===============

const UnitIdSchema = z.object({ id: z.string().uuid() });

export const getUnitDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UnitIdSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: unit, error } = await supabase
      .from("property_units")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!unit) throw new Error("Unit not found");

    const [{ data: property }, { data: tenant }, { data: otherTenants }] = await Promise.all([
      supabase
        .from("properties")
        .select("id, title, city, address")
        .eq("id", unit.property_id)
        .maybeSingle(),
      unit.tenant_id
        ? supabase.from("tenants").select("*").eq("id", unit.tenant_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("tenants")
        .select("id, full_name")
        .eq("property_id", unit.property_id)
        .is("unit_id", null),
    ]);

    return {
      unit,
      property,
      tenant: tenant ?? null,
      unassignedTenants: otherTenants ?? [],
    };
  });

const CreateTenantSchema = z.object({
  property_id: z.string().uuid(),
  unit_id: z.string().uuid().optional(),
  full_name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(180).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  rent_amount: z.coerce.number().min(0).max(1_000_000_000).default(0),
  lease_start: z.string().optional().or(z.literal("")),
  lease_end: z.string().optional().or(z.literal("")),
});

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateTenantSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("tenants")
      .insert({
        property_id: data.property_id,
        unit_id: data.unit_id ?? null,
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone || null,
        rent_amount: data.rent_amount,
        lease_start: data.lease_start || null,
        lease_end: data.lease_end || null,
        payment_status: "current",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (data.unit_id) {
      await context.supabase
        .from("property_units")
        .update({ status: "occupied", tenant_id: row.id })
        .eq("id", data.unit_id);
    }
    return { id: row.id };
  });

const AssignTenantSchema = z.object({
  unit_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
});

export const assignTenantToUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AssignTenantSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("property_units")
      .update({ status: "occupied", tenant_id: data.tenant_id })
      .eq("id", data.unit_id);
    if (error) throw new Error(error.message);
    await context.supabase.from("tenants").update({ unit_id: data.unit_id }).eq("id", data.tenant_id);
    return { ok: true };
  });

const UpdateTenantPaymentSchema = z.object({
  id: z.string().uuid(),
  payment_status: z.enum(["current", "due", "overdue"]),
});

export const updateTenantPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateTenantPaymentSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tenants")
      .update({ payment_status: data.payment_status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Lease eSign stub ===============
// Real workflow (draft -> sent -> signed/void) rather than a fake "connected"
// eSign vendor — no DocuSign/PandaDoc credentials are configured for this
// build. See the 20260712120000_lease_esign_stub.sql migration comment.

const UploadLeaseDocSchema = z.object({ id: z.string().uuid(), file_path: z.string().min(1) });

export const attachLeaseDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UploadLeaseDocSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tenants")
      .update({ lease_document_path: data.file_path, lease_signature_status: "draft" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const TenantIdSchema = z.object({ id: z.string().uuid() });

export const sendLeaseForSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TenantIdSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tenants")
      .update({ lease_signature_status: "sent", lease_sent_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const RecordSignatureSchema = z.object({ id: z.string().uuid(), signed_name: z.string().trim().min(1).max(150) });

export const recordLeaseSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RecordSignatureSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tenants")
      .update({
        lease_signature_status: "signed",
        lease_signed_at: new Date().toISOString(),
        lease_signed_name: data.signed_name,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const voidLease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TenantIdSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tenants")
      .update({ lease_signature_status: "void" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Leads / CRM ===============

const AddLeadSchema = z.object({
  full_name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(180).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  property_id: z.string().uuid().optional().or(z.literal("")),
  budget_max: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
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
      budget_max: data.budget_max ?? null,
      notes: data.notes || null,
      stage: "new",
      owner_id: context.userId,
    });
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
    const { data: lead, error } = await context.supabase
      .from("leads")
      .update({ stage: data.stage })
      .eq("id", data.id)
      .select("full_name, owner_id")
      .single();
    if (error) throw new Error(error.message);
    // Best-effort activity log — don't fail the stage move if this insert fails.
    await context.supabase.from("crm_activities").insert({
      lead_id: data.id,
      activity_type: "stage_change",
      notes: `Moved to ${data.stage.replace(/_/g, " ")}`,
      created_by: context.userId,
    });
    // Best-effort notification to the lead owner when a deal closes.
    if (data.stage === "closed" && lead?.owner_id) {
      await context.supabase.from("notifications").insert({
        user_id: lead.owner_id,
        title: "Deal closed 🎉",
        body: `${lead.full_name} just moved to Closed.`,
        division: "real-estate",
      });
    }
    return { ok: true };
  });

const AddLeadActivitySchema = z.object({
  lead_id: z.string().uuid(),
  activity_type: z.enum(ACTIVITY_TYPES),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  next_follow_up_date: z.string().optional().or(z.literal("")),
});

export const addLeadActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddLeadActivitySchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("crm_activities").insert({
      lead_id: data.lead_id,
      activity_type: data.activity_type,
      notes: data.notes || null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    if (data.next_follow_up_date) {
      await context.supabase
        .from("leads")
        .update({ next_follow_up_date: data.next_follow_up_date })
        .eq("id", data.lead_id);
    }
    return { ok: true };
  });

export const listLeadActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ lead_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("crm_activities")
      .select("*")
      .eq("lead_id", data.lead_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// =============== Reports ===============

export const getRealEstateReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: properties }, { data: units }, { data: tenants }, { data: leads }] =
      await Promise.all([
        supabase.from("properties").select("id, status, price, city"),
        supabase.from("property_units").select("id, status, rent_amount"),
        supabase.from("tenants").select("id, rent_amount, payment_status"),
        supabase.from("leads").select("id, stage, created_at"),
      ]);

    const propertyRows = properties ?? [];
    const unitRows = units ?? [];
    const tenantRows = tenants ?? [];
    const leadRows = leads ?? [];

    const byStatus: Record<string, number> = {};
    for (const p of propertyRows) byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;

    const cityValue = new Map<string, number>();
    for (const p of propertyRows) {
      if (!p.city) continue;
      cityValue.set(p.city, (cityValue.get(p.city) ?? 0) + Number(p.price ?? 0));
    }
    const topCities = Array.from(cityValue.entries())
      .map(([city, value]) => ({ city, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const occupiedUnits = unitRows.filter((u) => u.status === "occupied").length;
    const occupancyRate = unitRows.length ? Math.round((occupiedUnits / unitRows.length) * 100) : null;

    const pipeline = LEAD_STAGES.map((stage) => ({
      stage,
      count: leadRows.filter((l) => l.stage === stage).length,
    }));
    const totalLeads = leadRows.length;
    const closedLeads = leadRows.filter((l) => l.stage === "closed").length;
    const conversionRate = totalLeads ? Math.round((closedLeads / totalLeads) * 1000) / 10 : 0;

    const overdueRent = tenantRows.filter((t) => t.payment_status === "overdue").length;
    const monthlyRent = tenantRows.reduce((s, t) => s + Number(t.rent_amount ?? 0), 0);

    return {
      byStatus,
      topCities,
      occupancy: { occupiedUnits, totalUnits: unitRows.length, occupancyRate },
      revenue: { monthlyRent, overdueRent, tenants: tenantRows.length },
      pipeline: { stages: pipeline, totalLeads, closedLeads, conversionRate },
    };
  });

// E-signature: see the "Lease eSign stub" block above (attachLeaseDocument,
// sendLeaseForSignature, recordLeaseSignature, voidLease) for the real
// draft -> sent -> signed/void workflow that replaced the old dead-end stub
// here (it always returned "not connected" and did nothing).

// =============== Investor self-service ===============
// Mirrors the driver self-service pattern in logistics.functions.ts: an
// admin grants the 'investor' role via /portal/admin/users, then a staff
// member links the investor record to that person's portal account by
// email. Once linked, "investors read own record" RLS lets them see their
// own portfolio row via getMyInvestorProfile.

const LinkInvestorSchema = z.object({
  investor_id: z.string().uuid(),
  email: z.string().trim().email(),
});

export const linkInvestorAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LinkInvestorSchema.parse(i))
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
      .from("investors")
      .update({ user_id: match.id })
      .eq("id", data.investor_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** The signed-in investor's own portfolio row, or null if this account isn't
 * linked to an investor record yet. */
export const getMyInvestorProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("investors")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });
