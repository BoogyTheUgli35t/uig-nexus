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

/** Overview: shipments, drivers, vehicles, routes + KPIs for UIG Logistics. */
export const getLogisticsWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: shipments }, { data: drivers }, { data: vehicles }, { data: routes }] =
      await Promise.all([
        supabase
          .from("shipments")
          .select(
            "id, reference, customer, pickup_city, dropoff_city, cargo, weight_kg, status, driver_id, route_id, eta, tracking_code, updated_at",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("drivers")
          .select(
            "id, vehicle_id, full_name, phone, license_no, status, deliveries_completed, rating",
          )
          .order("deliveries_completed", { ascending: false }),
        supabase
          .from("vehicles")
          .select(
            "id, plate, vehicle_type, capacity_kg, status, fuel_level, odometer_km, last_service",
          )
          .order("created_at", { ascending: true }),
        supabase
          .from("routes")
          .select("id, name, origin, destination, distance_km, est_hours, stops, status")
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
      },
    };
  });

const AddShipmentSchema = z.object({
  customer: z.string().trim().min(1).max(180),
  pickup_city: z.string().trim().max(120).optional().or(z.literal("")),
  dropoff_city: z.string().trim().max(120).optional().or(z.literal("")),
  cargo: z.string().trim().max(240).optional().or(z.literal("")),
  weight_kg: z.coerce.number().min(0).max(1_000_000).default(0),
});

const randomCode = () =>
  "TRK-" +
  Math.random().toString(36).slice(2, 8).toUpperCase();

export const addShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddShipmentSchema.parse(i))
  .handler(async ({ context, data }) => {
    const reference = "UIG-SHP-" + Math.floor(10000 + Math.random() * 89999);
    const { error } = await context.supabase.from("shipments").insert({
      reference,
      customer: data.customer,
      pickup_city: data.pickup_city || null,
      dropoff_city: data.dropoff_city || null,
      cargo: data.cargo || null,
      weight_kg: data.weight_kg,
      status: "pending",
      tracking_code: randomCode(),
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateShipmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(SHIPMENT_STATUSES),
});

export const updateShipmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateShipmentStatusSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("shipments")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
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
