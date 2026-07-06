import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Seed sample data for Intelligence division */
export const seedIntelligenceData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    
    // Datasets
    const datasets = [
      {
        name: 'Real Estate Transactions — Lagos/Abuja',
        source_division: 'real-estate',
        description: 'Historical sale & rental prices with property attributes.',
        rows_count: 96450,
        size_mb: 28.1,
        status: 'ready',
        owner_id: userId
      },
      {
        name: 'Logistics Delivery Telemetry',
        source_division: 'logistics',
        description: 'Route timings, fuel use and on-time outcomes per shipment.',
        rows_count: 311200,
        size_mb: 67.9,
        status: 'ready',
        owner_id: userId
      }
    ];

    const { data: datasetData, error: datasetError } = await supabase
      .from('datasets')
      .insert(datasets)
      .select('id');
    
    if (datasetError) throw new Error(datasetError.message);

    // Models
    if (datasetData && datasetData.length > 0) {
      const models = [
        {
          name: 'UIG PriceSense',
          dataset_id: datasetData[0].id,
          model_type: 'regression',
          target_division: 'real-estate',
          status: 'monitoring',
          accuracy: 88.7,
          version: 'v1.8',
          owner_id: userId
        },
        {
          name: 'UIG RouteOptimiser',
          dataset_id: datasetData[1].id,
          model_type: 'recommendation',
          target_division: 'logistics',
          status: 'trained',
          accuracy: 84.2,
          version: 'v1.1',
          owner_id: userId
        }
      ];

      const { data: modelData, error: modelError } = await supabase
        .from('models')
        .insert(models)
        .select('id');
      
      if (modelError) throw new Error(modelError.message);

      // Predictions
      if (modelData && modelData.length > 0) {
        const predictions = [
          {
            model_id: modelData[0].id,
            prompt: 'Estimate sale price: 4-bed detached, Lekki Phase 1, 420 sqm',
            result: 'Estimated ₦285,000,000 (range ₦268M–₦302M). Demand index: high.',
            confidence: 89.0,
            owner_id: userId
          },
          {
            model_id: modelData[1].id,
            prompt: 'Optimise Lagos → Abuja with 5 drops, depart 06:00',
            result: 'Suggested corridor saves 1h 40m; reorder stops 3↔4, avoid Lokoja 14:00 peak.',
            confidence: 83.0,
            owner_id: userId
          }
        ];

        const { error: predictionError } = await supabase
          .from('predictions')
          .insert(predictions);
        
        if (predictionError) throw new Error(predictionError.message);
      }
    }

    return { success: true };
  });