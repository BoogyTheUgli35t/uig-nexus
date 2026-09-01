import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  LEAD_STAGES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  UNIT_STATUSES,
} from "@/lib/realestate.functions";

/**
 * Paged / sortable / searchable Real Estate listings plus the edit-side
 * mutations used by the portal Create/Edit/View pages. All access goes through
 * `requireSupabaseAuth`, so division-scoped RLS applies as the signed-in user.
 */

/** Strip PostgREST filter metacharacters before interpolating into ilike. */
function safeLike(term: string) {
  return term.replace(/[%_,().*\\"']/g, " ").trim();
}

const PageSchema = {
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(12),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
};

// =============== Properties ===============

export const PROPERTY_SORTS = ["created_at", "price", "title", "area_sqm"] as const;

const ListPropertiesPagedSchema = z.object({
  ...PageSchema,
  sortBy: z.enum(PROPERTY_SORTS).default("created_at"),
  search: z.string().trim().max(150).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  status: z.enum(PROPERTY_STATUSES).optional(),
});

export const listPropertiesPaged = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListPropertiesPagedSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const from = (data.page - 1) * data.pageSize;
    let query = context.supabase
      .from("properties")
      .select(
        "id, title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, featured, created_at",
        { count: "exact" },
      )
      .order(data.sortBy, { ascending: data.sortDir === "asc" })
      .range(from, from + data.pageSize - 1);

    if (data.propertyType) query = query.eq("property_type", data.propertyType);
    if (data.status) query = query.eq("status", data.status);
    if (data.city) query = query.ilike("city", `%${safeLike(data.city)}%`);
    if (data.search) {
      const term = safeLike(data.search);
      if (term) query = query.or(`title.ilike.%${term}%,address.ilike.%${term}%`);
    }

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => r.id);
    const { data: images } = ids.length
      ? await context.supabase
          .from("property_images")
          .select("property_id, storage_path, position")
          .in("property_id", ids)
          .order("position", { ascending: true })
      : { data: [] as { property_id: string; storage_path: string; position: number }[] };

    const cover = new Map<string, string>();
    for (const img of images ?? []) {
      if (!cover.has(img.property_id)) cover.set(img.property_id, img.storage_path);
    }

    return {
      rows: (rows ?? []).map((r) => ({ ...r, coverImagePath: cover.get(r.id) ?? null })),
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

const FullUpdatePropertySchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(180),
  property_type: z.enum(PROPERTY_TYPES),
  status: z.enum(PROPERTY_STATUSES),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(1_000_000_000_000),
  bedrooms: z.coerce.number().int().min(0).max(100),
  bathrooms: z.coerce.number().int().min(0).max(100),
  area_sqm: z.coerce.number().min(0).max(10_000_000),
  year_built: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  amenities: z.array(z.string().max(60)).max(40).default([]),
  featured: z.boolean().default(false),
});

export const updatePropertyFull = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => FullUpdatePropertySchema.parse(i))
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("properties")
      .update({
        ...rest,
        city: rest.city || null,
        address: rest.address || null,
        description: rest.description || null,
        year_built: rest.year_built ?? null,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("properties").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Units ===============

export const UNIT_SORTS = ["unit_number", "rent_amount", "created_at"] as const;

const ListUnitsPagedSchema = z.object({
  ...PageSchema,
  sortBy: z.enum(UNIT_SORTS).default("unit_number"),
  search: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(UNIT_STATUSES).optional(),
  propertyId: z.string().uuid().optional(),
});

export const listUnitsPaged = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListUnitsPagedSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const from = (data.page - 1) * data.pageSize;
    let query = context.supabase
      .from("property_units")
      .select(
        "id, property_id, unit_number, floor, bedrooms, bathrooms, area_sqm, rent_amount, status, tenant_id, created_at",
        { count: "exact" },
      )
      .order(data.sortBy, { ascending: data.sortDir === "asc" })
      .range(from, from + data.pageSize - 1);

    if (data.status) query = query.eq("status", data.status);
    if (data.propertyId) query = query.eq("property_id", data.propertyId);
    if (data.search) {
      const term = safeLike(data.search);
      if (term) query = query.ilike("unit_number", `%${term}%`);
    }

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);

    const propertyIds = Array.from(new Set((rows ?? []).map((r) => r.property_id)));
    const tenantIds = (rows ?? []).map((r) => r.tenant_id).filter((v): v is string => !!v);

    const [{ data: properties }, { data: tenants }] = await Promise.all([
      propertyIds.length
        ? context.supabase.from("properties").select("id, title, city").in("id", propertyIds)
        : Promise.resolve({ data: [] as { id: string; title: string; city: string | null }[] }),
      tenantIds.length
        ? context.supabase.from("tenants").select("id, full_name").in("id", tenantIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    ]);

    const propertyById = new Map((properties ?? []).map((p) => [p.id, p]));
    const tenantById = new Map((tenants ?? []).map((t) => [t.id, t]));

    return {
      rows: (rows ?? []).map((r) => ({
        ...r,
        propertyTitle: propertyById.get(r.property_id)?.title ?? "—",
        propertyCity: propertyById.get(r.property_id)?.city ?? null,
        tenantName: r.tenant_id ? (tenantById.get(r.tenant_id)?.full_name ?? null) : null,
      })),
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

const UpdateUnitSchema = z.object({
  id: z.string().uuid(),
  unit_number: z.string().trim().min(1, "Unit number is required").max(40),
  floor: z.coerce.number().int().min(-10).max(300).optional().nullable(),
  bedrooms: z.coerce.number().int().min(0).max(50),
  bathrooms: z.coerce.number().int().min(0).max(50),
  area_sqm: z.coerce.number().min(0).max(1_000_000),
  rent_amount: z.coerce.number().min(0).max(1_000_000_000),
  status: z.enum(UNIT_STATUSES),
});

export const updateUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateUnitSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("property_units")
      .update({ ...rest, floor: rest.floor ?? null })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Tenants ===============

export const TENANT_SORTS = ["full_name", "rent_amount", "lease_end", "created_at"] as const;

const ListTenantsPagedSchema = z.object({
  ...PageSchema,
  sortBy: z.enum(TENANT_SORTS).default("created_at"),
  search: z.string().trim().max(120).optional().or(z.literal("")),
  paymentStatus: z.enum(["current", "due", "overdue"]).optional(),
});

export const listTenantsPaged = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListTenantsPagedSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const from = (data.page - 1) * data.pageSize;
    let query = context.supabase
      .from("tenants")
      .select(
        "id, property_id, unit_id, full_name, email, phone, rent_amount, lease_start, lease_end, payment_status, lease_signature_status, created_at",
        { count: "exact" },
      )
      .order(data.sortBy, { ascending: data.sortDir === "asc" })
      .range(from, from + data.pageSize - 1);

    if (data.paymentStatus) query = query.eq("payment_status", data.paymentStatus);
    if (data.search) {
      const term = safeLike(data.search);
      if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const getTenantDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!tenant) throw new Error("Tenant not found");

    const [{ data: property }, { data: unit }, { data: properties }] = await Promise.all([
      tenant.property_id
        ? context.supabase
            .from("properties")
            .select("id, title, city")
            .eq("id", tenant.property_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      tenant.unit_id
        ? context.supabase
            .from("property_units")
            .select("id, unit_number")
            .eq("id", tenant.unit_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      context.supabase.from("properties").select("id, title").order("title"),
    ]);

    return { tenant, property, unit, properties: properties ?? [] };
  });

const UpdateTenantSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1, "Name is required").max(150),
  email: z.string().trim().email("Enter a valid email").max(180).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  property_id: z.string().uuid().optional().nullable(),
  rent_amount: z.coerce.number().min(0).max(1_000_000_000),
  lease_start: z.string().max(20).optional().or(z.literal("")),
  lease_end: z.string().max(20).optional().or(z.literal("")),
  payment_status: z.enum(["current", "due", "overdue"]),
});

export const updateTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateTenantSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tenants")
      .update({
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone || null,
        property_id: data.property_id || null,
        rent_amount: data.rent_amount,
        lease_start: data.lease_start || null,
        lease_end: data.lease_end || null,
        payment_status: data.payment_status,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Leads ===============

export const LEAD_SORTS = ["created_at", "full_name", "budget_max", "next_follow_up_date"] as const;

const ListLeadsPagedSchema = z.object({
  ...PageSchema,
  sortBy: z.enum(LEAD_SORTS).default("created_at"),
  search: z.string().trim().max(120).optional().or(z.literal("")),
  stage: z.enum(LEAD_STAGES).optional(),
});

export const listLeadsPaged = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListLeadsPagedSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const from = (data.page - 1) * data.pageSize;
    let query = context.supabase
      .from("leads")
      .select(
        "id, property_id, full_name, email, phone, stage, notes, budget_max, next_follow_up_date, created_at",
        { count: "exact" },
      )
      .order(data.sortBy, { ascending: data.sortDir === "asc", nullsFirst: false })
      .range(from, from + data.pageSize - 1);

    if (data.stage) query = query.eq("stage", data.stage);
    if (data.search) {
      const term = safeLike(data.search);
      if (term)
        query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    }

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const getLeadDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: lead, error } = await context.supabase
      .from("leads")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!lead) throw new Error("Lead not found");

    const [{ data: activities }, { data: properties }] = await Promise.all([
      context.supabase
        .from("crm_activities")
        .select("id, activity_type, notes, created_at")
        .eq("lead_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase.from("properties").select("id, title").order("title"),
    ]);

    return { lead, activities: activities ?? [], properties: properties ?? [] };
  });

const UpdateLeadSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1, "Name is required").max(150),
  email: z.string().trim().email("Enter a valid email").max(180).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  stage: z.enum(LEAD_STAGES),
  property_id: z.string().uuid().optional().nullable(),
  budget_max: z.coerce.number().min(0).max(1_000_000_000_000).optional().nullable(),
  next_follow_up_date: z.string().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateLeadSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("leads")
      .update({
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone || null,
        stage: data.stage,
        property_id: data.property_id || null,
        budget_max: data.budget_max ?? null,
        next_follow_up_date: data.next_follow_up_date || null,
        notes: data.notes || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
