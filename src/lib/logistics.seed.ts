import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Seed sample data for Logistics division */
export const seedLogisticsData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Vehicles
    const vehicles = [
      {
        plate: "LAG-241-KJA",
        vehicle_type: "truck",
        capacity_kg: 8000,
        status: "available",
        fuel_level: 88,
        odometer_km: 184250,
        last_service: "2026-04-12",
      },
      {
        plate: "ABJ-518-MNA",
        vehicle_type: "van",
        capacity_kg: 1500,
        status: "in_transit",
        fuel_level: 62,
        odometer_km: 92430,
        last_service: "2026-05-02",
      },
    ];

    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .insert(vehicles)
      .select("id");

    if (vehicleError) throw new Error(vehicleError.message);

    // Drivers
    if (vehicleData && vehicleData.length > 0) {
      const drivers = [
        {
          vehicle_id: vehicleData[0].id,
          full_name: "Tunde Bakare",
          phone: "+234 803 111 2233",
          license_no: "LAG-DRV-44821",
          status: "available",
          deliveries_completed: 1284,
          rating: 4.8,
        },
        {
          vehicle_id: vehicleData[1].id,
          full_name: "Ngozi Eze",
          phone: "+234 805 332 9090",
          license_no: "ABJ-DRV-10233",
          status: "on_route",
          deliveries_completed: 932,
          rating: 4.9,
        },
      ];

      const { error: driverError } = await supabase.from("drivers").insert(drivers);

      if (driverError) throw new Error(driverError.message);
    }

    // Routes
    const routes = [
      {
        name: "Lagos – Ibadan Express",
        origin: "Lagos",
        destination: "Ibadan",
        distance_km: 130,
        est_hours: 2.5,
        stops: 3,
        status: "active",
      },
      {
        name: "Lagos – Abuja Corridor",
        origin: "Lagos",
        destination: "Abuja",
        distance_km: 760,
        est_hours: 11,
        stops: 5,
        status: "active",
      },
    ];

    const { data: routeData, error: routeError } = await supabase
      .from("routes")
      .insert(routes)
      .select("id");

    if (routeError) throw new Error(routeError.message);

    // Shipments
    if (routeData && routeData.length > 0) {
      const shipments = [
        {
          reference: "UIG-SHP-10241",
          customer: "Jumia Nigeria",
          pickup_city: "Lagos",
          dropoff_city: "Ibadan",
          cargo: "Consumer electronics (24 cartons)",
          weight_kg: 640,
          status: "in_transit",
          driver_id: vehicleData[0].id,
          route_id: routeData[0].id,
          eta: "2026-06-10",
          tracking_code: "TRK-7H2K9A",
        },
        {
          reference: "UIG-SHP-10244",
          customer: "Shoprite Holdings",
          pickup_city: "Lagos",
          dropoff_city: "Abuja",
          cargo: "FMCG retail stock",
          weight_kg: 5400,
          status: "in_transit",
          driver_id: vehicleData[1].id,
          route_id: routeData[1].id,
          eta: "2026-06-11",
          tracking_code: "TRK-5RT0WK",
        },
      ];

      const { error: shipmentError } = await supabase.from("shipments").insert(shipments);

      if (shipmentError) throw new Error(shipmentError.message);
    }

    return { success: true };
  });
