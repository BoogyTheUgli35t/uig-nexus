import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Seed sample data for Technology division */
export const seedTechnologyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    
    // Projects
    const projects = [
      {
        title: 'Pan-African Payments Platform',
        client_name: 'UIG Fintech',
        status: 'building',
        progress: 62,
        owner_id: userId
      },
      {
        title: 'Smart Estate Resident App',
        client_name: 'UIG Real Estate',
        status: 'live',
        progress: 100,
        owner_id: userId
      }
    ];

    const { data: projectData, error: projectError } = await supabase
      .from('tech_projects')
      .insert(projects)
      .select('id');
    
    if (projectError) throw new Error(projectError.message);

    // Tasks for projects
    if (projectData && projectData.length > 0) {
      const tasks = [
        {
          tech_project_id: projectData[0].id,
          title: 'Discovery workshop',
          status: 'done'
        },
        {
          tech_project_id: projectData[0].id,
          title: 'System architecture',
          status: 'done'
        },
        {
          tech_project_id: projectData[0].id,
          title: 'Sprint 1 build',
          status: 'in_progress'
        }
      ];

      const { error: taskError } = await supabase
        .from('tech_tasks')
        .insert(tasks);
      
      if (taskError) throw new Error(taskError.message);
    }

    // Integrations
    const integrations = [
      {
        name: 'Stripe Payments',
        provider: 'stripe',
        status: 'connected',
        last_sync: new Date().toISOString()
      },
      {
        name: 'Twilio SMS',
        provider: 'twilio',
        status: 'connected',
        last_sync: new Date().toISOString()
      }
    ];

    const { error: integrationError } = await supabase
      .from('integrations')
      .insert(integrations);
    
    if (integrationError) throw new Error(integrationError.message);

    return { success: true };
  });