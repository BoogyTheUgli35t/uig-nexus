import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Seed sample data for Innovation Lab division */
export const seedInnovationData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    
    // Ideas
    const ideas = [
      {
        title: 'AI-Powered Crop Disease Detection',
        description: 'Using computer vision to identify plant diseases from field photos',
        tags: JSON.stringify(['agritech', 'ai', 'computer-vision']),
        status: 'concept',
        submitted_by: userId
      },
      {
        title: 'Smart Property Valuation Engine',
        description: 'Real-time property pricing using ML models and market data',
        tags: JSON.stringify(['real-estate', 'ml', 'analytics']),
        status: 'prototype',
        submitted_by: userId
      }
    ];

    const { data: ideaData, error: ideaError } = await supabase
      .from('ideas')
      .insert(ideas)
      .select('id');
    
    if (ideaError) throw new Error(ideaError.message);

    // Prototypes
    if (ideaData && ideaData.length > 0) {
      const prototypes = [
        {
          idea_id: ideaData[0].id,
          repo_link: 'https://github.com/uig/crop-disease-detection',
          demo_link: 'https://demo.uig.online/crop-disease',
          status: 'build',
          screenshots: JSON.stringify([
            'screenshot1.jpg',
            'screenshot2.jpg'
          ])
        },
        {
          idea_id: ideaData[1].id,
          repo_link: 'https://github.com/uig/property-valuation',
          demo_link: 'https://demo.uig.online/property-valuation',
          status: 'pilot',
          screenshots: JSON.stringify([
            'dashboard1.jpg',
            'analysis1.jpg'
          ])
        }
      ];

      const { error: prototypeError } = await supabase
        .from('prototypes')
        .insert(prototypes);
      
      if (prototypeError) throw new Error(prototypeError.message);
    }

    // Partners
    const partners = [
      {
        name: 'AgriTech Nigeria',
        type: 'corporate',
        contact: 'partners@agritechnigeria.org'
      },
      {
        name: 'Real Estate Analytics Ltd',
        type: 'corporate',
        contact: 'collab@realestateanalytics.ng'
      }
    ];

    const { error: partnerError } = await supabase
      .from('partners')
      .insert(partners);
    
    if (partnerError) throw new Error(partnerError.message);

    return { success: true };
  });