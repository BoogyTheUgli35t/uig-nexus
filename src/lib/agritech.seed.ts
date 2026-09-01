import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Seed sample data for AgriTech division */
export const seedAgriTechData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Farmers
    const farmers = [
      {
        full_name: "Aliyu Bello",
        phone: "+234 803 111 2233",
        location: "Kano State",
        cooperative: "Kano Rice Growers",
        primary_crop: "Rice",
        hectares: 12.5,
        status: "active",
        owner_id: userId,
      },
      {
        full_name: "Ngozi Okeke",
        phone: "+234 802 445 6677",
        location: "Benue State",
        cooperative: "Benue Yam Cooperative",
        primary_crop: "Yam",
        hectares: 8.0,
        status: "active",
        owner_id: userId,
      },
    ];

    const { data: farmerData, error: farmerError } = await supabase
      .from("farmers")
      .insert(farmers)
      .select("id");

    if (farmerError) throw new Error(farmerError.message);

    // Fields for farmers
    if (farmerData && farmerData.length > 0) {
      const fields = [
        {
          farmer_id: farmerData[0].id,
          name: "Rice Field A",
          crop: "Rice",
          hectares: 6.2,
          health: 85,
          status: "healthy",
        },
        {
          farmer_id: farmerData[1].id,
          name: "Yam Field A",
          crop: "Yam",
          hectares: 4.0,
          health: 78,
          status: "healthy",
        },
      ];

      const { error: fieldError } = await supabase.from("fields").insert(fields);

      if (fieldError) throw new Error(fieldError.message);

      // Sensor data for fields
      const sensorData = [];
      for (const field of fields) {
        for (let i = 0; i < 3; i++) {
          sensorData.push({
            field_id: field.farmer_id,
            soil_moisture: 35 + Math.random() * 10,
            temperature: 25 + Math.random() * 5,
            humidity: 60 + Math.random() * 20,
            recorded_at: new Date(Date.now() - i * 3600000).toISOString(),
          });
        }
      }

      const { error: sensorError } = await supabase.from("sensor_data").insert(sensorData);

      if (sensorError) throw new Error(sensorError.message);

      // Yield predictions
      const yieldPredictions = fields.map((field) => ({
        field_id: field.farmer_id,
        season: "2025 Wet",
        predicted_yield_tons: 3 + Math.random() * 5,
        confidence: 75 + Math.floor(Math.random() * 20),
      }));

      const { error: yieldError } = await supabase
        .from("yield_predictions")
        .insert(yieldPredictions);

      if (yieldError) throw new Error(yieldError.message);
    }

    return { success: true };
  });
