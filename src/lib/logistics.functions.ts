import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const SHIPMENT_STATUSES = [
  "pending",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
] as const;

export const VEHICLE_STATUSES = ["available", "in_transit", "maintenance", "idle"] as const;
export const DRIVER_STATUSES = ["available", "on_route", "off_duty"] as const;
export const PRIORITY_LEVELS = ["standard", "express", "fragile"] as const;
export const ROUTE_STATUSES = ["active", "planned", "suspended"] as const;

/** Overview: shipments, drivers, vehicles, routes + KPIs + maintenance/license alerts. */
export const getLogisticsWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: shipments }, { data: drivers }, { data: vehicles }, { data: routes }] =
      await Promise.all([
        supabase
          .from("shipments")
          .select(
            "id, reference, customer, pickup_city, dropoff_city, cargo, weight_kg, status, priority, driver_id, route_id, eta, delivered_at, tracking_code, pod_photo_url, updated_at",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("drivers")
          .select(
            "id, user_id, vehicle_id, full_name, phone, license_no, license_expiry, status, deliveries_completed, rating",
          )
          .order("deliveries_completed", { ascending: false }),
        supabase
          .from("vehicles")
          .select(
            "id, plate, vehicle_type, capacity_kg, status, fuel_level, odometer_km, last_service, next_service_due, insurance_expiry",
          )
          .order("created_at", { ascending: true }),
        supabase
          .from("routes")
          .select(
            "id, name, origin, destination, distance_km, est_hours, stops, status, assigned_driver_id",
          )
          .order("created_at", { ascending: true }),
      ]);

    const shipmentRows = shipments ?? [];
    const driverRows = drivers ?? [];
    const vehicleRows = vehicles ?? [];
    const routeRows = routes ?? [];

    const active = shipmentRows.filter(
      (s) => s.status !== "delivered" && s.status !== "failed",
    ).length;
    const delivered = shipmentRows.filter((s) => s.status === "delivered").length;
    const failed = shipmentRows.filter((s) => s.status === "failed").length;
    const completed = delivered + failed;
    const onTimeRate = completed ? Math.round((delivered / completed) * 1000) / 10 : 0;
    const inTransitVehicles = vehicleRows.filter((v) => v.status === "in_transit").length;

    const today = new Date();
    const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const serviceDue = vehicleRows.filter(
      (v) => v.next_service_due && new Date(v.next_service_due) <= in30,
    ).length;
    const insuranceDue = vehicleRows.filter(
      (v) => v.insurance_expiry && new Date(v.insurance_expiry) <= in30,
    ).length;
    const licenseDue = driverRows.filter(
      (d) => d.license_expiry && new Date(d.license_expiry) <= in30,
    ).length;

    return {
      shipments: shipmentRows,
      drivers: driverRows,
      vehicles: vehicleRows,
      routes: routeRows,
      stats: {
        shipments: shipmentRows.length,
        active,
        delivered,
        onTimeRate,
        drivers: driverRows.length,
        vehicles: vehicleRows.length,
        inTransitVehicles,
        routes: routeRows.length,
        serviceDue,
        insuranceDue,
        licenseDue,
      },
    };
  });

const AddShipmentSchema = z.object({
  customer: z.string().trim().min(1).max(180),
  pickup_city: z.string().trim().max(120).optional().or(z.literal("")),
  dropoff_city: z.string().trim().max(120).optional().or(z.literal("")),
  cargo: z.string().trim().max(240).optional().or(z.literal("")),
  weight_kg: z.coerce.number().min(0).max(1_000_000).default(0),
  priority: z.enum(PRIORITY_LEVELS).default("standard"),
  eta: z.string().trim().max(20).optional().or(z.literal("")),
});

const randomCode = () => "TRK-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export const addShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddShipmentSchema.parse(i))
  .handler(async ({ context, data }) => {
    const reference = "UIG-SHP-" + Math.floor(10000 + Math.random() * 89999);
    const trackingCode = randomCode();
    const { data: row, error } = await context.supabase
      .from("shipments")
      .insert({
        reference,
        customer: data.customer,
        pickup_city: data.pickup_city || null,
        dropoff_city: data.dropoff_city || null,
        cargo: data.cargo || null,
        weight_kg: data.weight_kg,
        priority: data.priority,
        eta: data.eta || null,
        status: "pending",
        tracking_code: trackingCode,
        owner_id: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("shipment_events").insert({
      shipment_id: row.id,
      status: "pending",
      note: "Shipment created",
      created_by: context.userId,
    });

    return { ok: true, id: row.id, tracking_code: trackingCode };
  });

const UpdateShipmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(SHIPMENT_STATUSES),
  note: z.string().trim().max(240).optional().or(z.literal("")),
});

export const updateShipmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateShipmentStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const patch: { status: (typeof SHIPMENT_STATUSES)[number]; delivered_at?: string } = {
      status: data.status,
    };
    if (data.status === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await context.supabase.from("shipments").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    await context.supabase.from("shipment_events").insert({
      shipment_id: data.id,
      status: data.status,
      note: data.note || null,
      created_by: context.userId,
    });
    return { ok: true };
  });

const AssignShipmentSchema = z.object({
  id: z.string().uuid(),
  driver_id: z.string().uuid().nullable(),
  route_id: z.string().uuid().nullable().optional(),
});

export const assignShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AssignShipmentSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("shipments")
      .update({
        driver_id: data.driver_id,
        ...(data.route_id !== undefined ? { route_id: data.route_id } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Shipment detail: full row + driver/route names + full event timeline. */
export const getShipmentDetail = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: shipment, error } = await context.supabase
      .from("shipments")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const [{ data: events }, { data: drivers }, { data: routes }] = await Promise.all([
      context.supabase
        .from("shipment_events")
        .select("id, status, note, created_at")
        .eq("shipment_id", data.id)
        .order("created_at", { ascending: true }),
      context.supabase.from("drivers").select("id, full_name, phone"),
      context.supabase.from("routes").select("id, name"),
    ]);

    return { shipment, events: events ?? [], drivers: drivers ?? [], routes: routes ?? [] };
  });

const PodSchema = z.object({
  id: z.string().uuid(),
  pod_photo_url: z.string().trim().max(500).optional().or(z.literal("")),
  pod_signature_name: z.string().trim().max(180).optional().or(z.literal("")),
  pod_notes: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Marks a shipment delivered with proof-of-delivery details. Photo upload itself
 * happens client-side straight to the `pod-photos` bucket (same pattern as other
 * divisions' direct-to-storage uploads); this just records the resulting URL. */
export const completeDeliveryWithPod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PodSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: shipment, error } = await context.supabase
      .from("shipments")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
        pod_photo_url: data.pod_photo_url || null,
        pod_signature_name: data.pod_signature_name || null,
        pod_notes: data.pod_notes || null,
      })
      .eq("id", data.id)
      .select("reference, customer, owner_id")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("shipment_events").insert({
      shipment_id: data.id,
      status: "delivered",
      note: data.pod_signature_name
        ? `Delivered — signed by ${data.pod_signature_name}`
        : "Delivered",
      created_by: context.userId,
    });

    // Best-effort notification to whoever created the shipment.
    if (shipment?.owner_id) {
      await context.supabase.from("notifications").insert({
        user_id: shipment.owner_id,
        title: "Shipment delivered",
        body: `${shipment.reference} for ${shipment.customer} has been delivered.`,
        division: "logistics",
      });
    }
    return { ok: true };
  });

const UpdateVehicleStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(VEHICLE_STATUSES),
});

export const updateVehicleStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateVehicleStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("vehicles")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AddMaintenanceLogSchema = z.object({
  vehicle_id: z.string().uuid(),
  service_type: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  cost: z.coerce.number().min(0).optional(),
  performed_at: z.string().trim().max(20).optional().or(z.literal("")),
  next_due: z.string().trim().max(20).optional().or(z.literal("")),
});

export const addMaintenanceLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddMaintenanceLogSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("vehicle_maintenance_logs").insert({
      vehicle_id: data.vehicle_id,
      service_type: data.service_type,
      notes: data.notes || null,
      cost: data.cost ?? null,
      performed_at: data.performed_at || new Date().toISOString().slice(0, 10),
      next_due: data.next_due || null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);

    if (data.next_due) {
      await context.supabase
        .from("vehicles")
        .update({ last_service: data.performed_at || new Date().toISOString().slice(0, 10), next_service_due: data.next_due })
        .eq("id", data.vehicle_id);
    }
    return { ok: true };
  });

export const listMaintenanceLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vehicle_maintenance_logs")
      .select("id, vehicle_id, service_type, notes, cost, performed_at, next_due, created_at")
      .order("performed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const AddRouteStopSchema = z.object({
  route_id: z.string().uuid(),
  address: z.string().trim().min(1).max(240),
  sequence: z.coerce.number().int().min(0).default(0),
  shipment_id: z.string().uuid().optional(),
});

export const addRouteStop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddRouteStopSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("route_stops").insert({
      route_id: data.route_id,
      address: data.address,
      sequence: data.sequence,
      shipment_id: data.shipment_id || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ToggleRouteStopSchema = z.object({ id: z.string().uuid(), completed: z.boolean() });

export const toggleRouteStop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ToggleRouteStopSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("route_stops")
      .update({ completed: data.completed, completed_at: data.completed ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listRouteStops = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("route_stops")
      .select("id, route_id, shipment_id, sequence, address, lat, lng, completed, completed_at")
      .order("sequence", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const AssignRouteDriverSchema = z.object({
  id: z.string().uuid(),
  assigned_driver_id: z.string().uuid().nullable(),
});

export const assignRouteDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AssignRouteDriverSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("routes")
      .update({ assigned_driver_id: data.assigned_driver_id })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Links a driver record to a login (by email) so that user gets the "My tasks"
 * mobile driver view. Uses the admin API to look up the account — there's no
 * self-serve invite flow, so an admin performs this once per driver. */
const LinkDriverSchema = z.object({
  driver_id: z.string().uuid(),
  email: z.string().trim().email(),
});

export const linkDriverAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LinkDriverSchema.parse(i))
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
      .from("drivers")
      .update({ user_id: match.id })
      .eq("id", data.driver_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** The signed-in driver's own profile, or null if this account isn't linked to a
 * driver record yet. */
export const getMyDriverProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("drivers")
      .select("id, full_name, phone, status, rating, deliveries_completed, vehicle_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

/** Shipments assigned to the signed-in driver — the mobile task-view queue. */
export const getMyDriverTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: driver, error: driverErr } = await context.supabase
      .from("drivers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (driverErr) throw new Error(driverErr.message);
    if (!driver) return { driverId: null, shipments: [] };

    const { data: shipments, error } = await context.supabase
      .from("shipments")
      .select(
        "id, reference, customer, pickup_city, dropoff_city, cargo, weight_kg, status, priority, eta, tracking_code, pod_photo_url",
      )
      .eq("driver_id", driver.id)
      .neq("status", "delivered")
      .neq("status", "failed")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { driverId: driver.id, shipments: shipments ?? [] };
  });

const UpdateMyDriverStatusSchema = z.object({ status: z.enum(DRIVER_STATUSES) });

export const updateMyDriverStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateMyDriverStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("drivers")
      .update({ status: data.status })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
