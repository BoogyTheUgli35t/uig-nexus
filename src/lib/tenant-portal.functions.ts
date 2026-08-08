import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Tenant self-service portal.
 *
 * Everything here is scoped to the caller's own tenancy via
 * `tenants.user_id = auth.uid()` (see 20260730010000_tenant_portal.sql). The
 * request-scoped client is used deliberately — never supabaseAdmin — so RLS
 * remains the enforcement boundary rather than application code.
 */

export const MAINTENANCE_CATEGORIES = [
  "general",
  "plumbing",
  "electrical",
  "appliance",
  "structural",
  "security",
] as const;

export const MAINTENANCE_PRIORITIES = ["low", "normal", "urgent"] as const;
export const MAINTENANCE_STATUSES = [
  "open",
  "acknowledged",
  "in_progress",
  "resolved",
  "closed",
] as const;

/** The signed-in tenant's lease, unit, property and maintenance history. */
export const getMyTenancy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: tenant, error } = await supabase
      .from("tenants")
      .select(
        "id, full_name, email, phone, rent_amount, payment_status, lease_start, lease_end, lease_document_path, lease_signature_status, lease_signed_at, property_id, unit_id",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    // Not every portal account is a tenant — this is a normal state, not an
    // error, and the UI shows a "no tenancy linked" explainer.
    if (!tenant) return { linked: false as const };

    const [{ data: property }, { data: unit }, { data: requests }] = await Promise.all([
      tenant.property_id
        ? supabase
            .from("properties")
            .select("id, title, address, city, state, property_type")
            .eq("id", tenant.property_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      tenant.unit_id
        ? supabase
            .from("property_units")
            .select("id, unit_number, floor, bedrooms, bathrooms, area_sqm, rent_amount, status")
            .eq("id", tenant.unit_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("maintenance_requests")
        .select("id, title, description, category, priority, status, staff_notes, created_at, resolved_at")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false }),
    ]);

    // Lease runway, computed server-side so the badge can't disagree with the
    // dates shown next to it.
    const now = Date.now();
    const endMs = tenant.lease_end ? new Date(tenant.lease_end).getTime() : null;
    const daysRemaining =
      endMs === null ? null : Math.ceil((endMs - now) / (1000 * 60 * 60 * 24));

    const openRequests = (requests ?? []).filter(
      (r) => !["resolved", "closed"].includes(r.status),
    ).length;

    return {
      linked: true as const,
      tenant,
      property,
      unit,
      requests: requests ?? [],
      summary: {
        daysRemaining,
        leaseExpired: daysRemaining !== null && daysRemaining < 0,
        leaseExpiringSoon: daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 60,
        openRequests,
      },
    };
  });

const RaiseRequestSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.enum(MAINTENANCE_CATEGORIES).default("general"),
  priority: z.enum(MAINTENANCE_PRIORITIES).default("normal"),
});

/** File a maintenance request against the caller's own tenancy. */
export const raiseMaintenanceRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RaiseRequestSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Resolve the tenancy from the session rather than trusting a client-sent
    // tenant_id — the RLS policy would reject a forged one anyway, but failing
    // here gives a clearer error and keeps the contract obvious.
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("id, property_id, unit_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!tenant) throw new Error("No tenancy is linked to your account.");

    const { error } = await supabase.from("maintenance_requests").insert({
      tenant_id: tenant.id,
      property_id: tenant.property_id,
      unit_id: tenant.unit_id,
      title: data.title,
      description: data.description || null,
      category: data.category,
      priority: data.priority,
      status: "open",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Staff side ===============

/** Every maintenance request across the portfolio, for Real Estate staff. */
export const listMaintenanceRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("maintenance_requests")
      .select(
        "id, tenant_id, property_id, title, description, category, priority, status, staff_notes, created_at, resolved_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const UpdateRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(MAINTENANCE_STATUSES),
  staff_notes: z.string().trim().max(2000).optional(),
});

export const updateMaintenanceRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateRequestSchema.parse(i))
  .handler(async ({ context, data }) => {
    const resolved = data.status === "resolved" || data.status === "closed";
    const { error } = await context.supabase
      .from("maintenance_requests")
      .update({
        status: data.status,
        ...(data.staff_notes !== undefined ? { staff_notes: data.staff_notes } : {}),
        resolved_at: resolved ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const LinkTenantSchema = z.object({
  tenant_id: z.string().uuid(),
  email: z.string().trim().email(),
});

/**
 * Link a tenancy record to an existing portal account by email, so the tenant
 * can sign in and see their own lease. Mirrors linkInvestorAccount /
 * linkFarmerAccount. Staff-only by RLS on `tenants`.
 */
export const linkTenantAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LinkTenantSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw new Error(listErr.message);
    const match = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!match) throw new Error("No UIG portal account found with that email.");

    // Written through the caller's client so the staff RLS policy on `tenants`
    // is what authorises the link — the admin client is only used to look the
    // account up by email.
    const { error } = await context.supabase
      .from("tenants")
      .update({ user_id: match.id })
      .eq("id", data.tenant_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
