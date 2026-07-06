// signup_choose_division Supabase Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

// Define the structure of our function payload
interface SignupPayload {
  user_id: string;
  email: string | null;
  selected_divisions: string[];
  primary_division?: string;
  role_preference?: string;
}

// Seed functions for each division
async function seedRealEstate(supabase: any, userId: string) {
  // Properties
  const properties = [
    {
      title: 'Lekki Phase 1 Smart Villa',
      property_type: 'residential',
      city: 'Lagos',
      address: '14 Admiralty Way, Lekki Phase 1',
      price: 285000000,
      bedrooms: 5,
      bathrooms: 6,
      area_sqm: 520,
      status: 'available',
      description: 'Automated 5-bedroom smart villa with solar backup, smart locks and a private cinema.',
      owner_id: userId
    },
    {
      title: 'Ikoyi Waterfront Penthouse',
      property_type: 'residential',
      city: 'Lagos',
      address: 'Banana Island Road, Ikoyi',
      price: 650000000,
      bedrooms: 4,
      bathrooms: 5,
      area_sqm: 410,
      status: 'reserved',
      description: 'Top-floor penthouse with panoramic lagoon views and full home automation.',
      owner_id: userId
    },
    {
      title: 'Maitama Executive Duplex',
      property_type: 'residential',
      city: 'Abuja',
      address: '7 Gana Street, Maitama',
      price: 420000000,
      bedrooms: 4,
      bathrooms: 5,
      area_sqm: 480,
      status: 'available',
      description: 'Diplomatic-zone duplex with energy management and integrated security.',
      owner_id: userId
    }
  ];

  // Tenants
  const tenants = [
    {
      full_name: 'Bashir Adamu',
      email: 'bashir.adamu@example.com',
      phone: '+234 805 222 3344',
      rent_amount: 9500000,
      lease_start: '2024-09-01',
      lease_end: '2025-08-31',
      payment_status: 'due'
    },
    {
      full_name: 'Adaeze Nwosu',
      email: 'adaeze.nwosu@example.com',
      phone: '+234 809 441 7788',
      rent_amount: 48000000,
      lease_start: '2024-06-01',
      lease_end: '2025-05-31',
      payment_status: 'overdue'
    }
  ];

  // Investors
  const investors = [
    {
      full_name: 'Olumide Bankole',
      email: 'olumide.bankole@example.com',
      phone: '+234 803 100 2003',
      amount_invested: 500000000,
      portfolio_value: 615000000,
      expected_roi: 14.5
    },
    {
      full_name: 'Aisha Mohammed',
      email: 'aisha.m@example.com',
      phone: '+234 806 332 4455',
      amount_invested: 250000000,
      portfolio_value: 287500000,
      expected_roi: 11.0
    }
  ];

  // Leads
  const leads = [
    {
      full_name: 'Chukwuma Obi',
      email: 'chukwuma.obi@example.com',
      phone: '+234 805 667 8899',
      stage: 'viewing',
      notes: 'Scheduled a second viewing this weekend. Interested in payment plan.'
    },
    {
      full_name: 'Fatima Yusuf',
      email: 'fatima.yusuf@example.com',
      phone: '+234 803 221 9090',
      stage: 'negotiation',
      notes: 'Offered 5% below asking. Awaiting owner response.'
    }
  ];

  // Insert properties
  const { data: propertyData, error: propertyError } = await supabase
    .from('properties')
    .insert(properties)
    .select('id');
  
  if (propertyError) {
    console.error('Error seeding properties:', propertyError);
    return;
  }

  // Link tenants to properties (simplified for demo)
  if (propertyData && propertyData.length > 0) {
    const propertyIds = propertyData.map((p: any) => p.id);
    
    // Update tenants with property_id
    const tenantsWithProperty = tenants.map((tenant, index) => ({
      ...tenant,
      property_id: propertyIds[index % propertyIds.length],
      owner_id: userId
    }));

    const { error: tenantError } = await supabase
      .from('tenants')
      .insert(tenantsWithProperty);
    
    if (tenantError) {
      console.error('Error seeding tenants:', tenantError);
    }

    // Update leads with property_id
    const leadsWithProperty = leads.map((lead, index) => ({
      ...lead,
      property_id: propertyIds[index % propertyIds.length],
      owner_id: userId
    }));

    const { error: leadError } = await supabase
      .from('leads')
      .insert(leadsWithProperty);
    
    if (leadError) {
      console.error('Error seeding leads:', leadError);
    }
  }

  // Insert investors
  const investorsWithOwner = investors.map(investor => ({
    ...investor,
    owner_id: userId
  }));

  const { error: investorError } = await supabase
    .from('investors')
    .insert(investorsWithOwner);
  
  if (investorError) {
    console.error('Error seeding investors:', investorError);
  }
}

async function seedTechnology(supabase: any, userId: string) {
  // Projects
  const projects = [
    {
      title: 'Pan-African Payments Platform',
      description: 'Building a unified payment solution for African markets',
      status: 'building',
      progress: 62,
      owner_id: userId
    },
    {
      title: 'Smart Estate Resident App',
      description: 'Mobile application for estate residents with access control and services',
      status: 'live',
      progress: 100,
      owner_id: userId
    }
  ];

  const { data: projectData, error: projectError } = await supabase
    .from('tech_projects')
    .insert(projects)
    .select('id');
  
  if (projectError) {
    console.error('Error seeding tech projects:', projectError);
    return;
  }

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
    
    if (taskError) {
      console.error('Error seeding tech tasks:', taskError);
    }
  }

  // Integrations
  const integrations = [
    {
      name: 'Stripe Payments',
      provider: 'stripe',
      status: 'connected',
      last_sync: new Date().toISOString(),
      owner_id: userId
    },
    {
      name: 'Twilio SMS',
      provider: 'twilio',
      status: 'connected',
      last_sync: new Date().toISOString(),
      owner_id: userId
    }
  ];

  const { error: integrationError } = await supabase
    .from('integrations')
    .insert(integrations);
  
  if (integrationError) {
    console.error('Error seeding integrations:', integrationError);
  }
}

async function seedAgriTech(supabase: any, userId: string) {
  // Farmers
  const farmers = [
    {
      full_name: 'Aliyu Bello',
      phone: '+234 803 111 2233',
      location: 'Kano State',
      cooperative: 'Kano Rice Growers',
      primary_crop: 'Rice',
      hectares: 12.5,
      status: 'active',
      owner_id: userId
    },
    {
      full_name: 'Ngozi Okeke',
      phone: '+234 802 445 6677',
      location: 'Benue State',
      cooperative: 'Benue Yam Cooperative',
      primary_crop: 'Yam',
      hectares: 8.0,
      status: 'active',
      owner_id: userId
    }
  ];

  const { data: farmerData, error: farmerError } = await supabase
    .from('farmers')
    .insert(farmers)
    .select('id');
  
  if (farmerError) {
    console.error('Error seeding farmers:', farmerError);
    return;
  }

  // Fields for farmers
  if (farmerData && farmerData.length > 0) {
    const fields = [
      {
        farmer_id: farmerData[0].id,
        name: 'Rice Field A',
        crop: 'Rice',
        hectares: 6.2,
        health: 85,
        status: 'healthy'
      },
      {
        farmer_id: farmerData[1].id,
        name: 'Yam Field A',
        crop: 'Yam',
        hectares: 4.0,
        health: 78,
        status: 'healthy'
      }
    ];

    const { error: fieldError } = await supabase
      .from('fields')
      .insert(fields);
    
    if (fieldError) {
      console.error('Error seeding fields:', fieldError);
    }

    // Sensor data for fields
    const sensorData = [];
    for (const field of fields) {
      for (let i = 0; i < 3; i++) {
        sensorData.push({
          field_id: field.farmer_id, // Simplified for demo
          soil_moisture: 35 + Math.random() * 10,
          temperature: 25 + Math.random() * 5,
          humidity: 60 + Math.random() * 20,
          recorded_at: new Date(Date.now() - i * 3600000).toISOString()
        });
      }
    }

    const { error: sensorError } = await supabase
      .from('sensor_data')
      .insert(sensorData);
    
    if (sensorError) {
      console.error('Error seeding sensor data:', sensorError);
    }

    // Yield predictions
    const yieldPredictions = fields.map(field => ({
      field_id: field.farmer_id, // Simplified for demo
      season: '2025 Wet',
      predicted_yield_tons: 3 + Math.random() * 5,
      confidence: 75 + Math.floor(Math.random() * 20)
    }));

    const { error: yieldError } = await supabase
      .from('yield_predictions')
      .insert(yieldPredictions);
    
    if (yieldError) {
      console.error('Error seeding yield predictions:', yieldError);
    }
  }

  // Cooperatives
  const cooperatives = [
    {
      name: 'Kano Rice Growers',
      members: JSON.stringify(['Aliyu Bello', 'Other Members']),
      contact: '+234 803 111 2233',
      owner_id: userId
    },
    {
      name: 'Benue Yam Cooperative',
      members: JSON.stringify(['Ngozi Okeke', 'Other Members']),
      contact: '+234 802 445 6677',
      owner_id: userId
    }
  ];

  const { error: cooperativeError } = await supabase
    .from('cooperatives')
    .insert(cooperatives);
  
  if (cooperativeError) {
    console.error('Error seeding cooperatives:', cooperativeError);
  }
}

async function seedLogistics(supabase: any, userId: string) {
  // Vehicles
  const vehicles = [
    {
      plate: 'LAG-241-KJA',
      vehicle_type: 'truck',
      capacity_kg: 8000,
      status: 'available',
      fuel_level: 88,
      odometer_km: 184250,
      last_service: '2026-04-12',
      owner_id: userId
    },
    {
      plate: 'ABJ-518-MNA',
      vehicle_type: 'van',
      capacity_kg: 1500,
      status: 'in_transit',
      fuel_level: 62,
      odometer_km: 92430,
      last_service: '2026-05-02',
      owner_id: userId
    }
  ];

  const { data: vehicleData, error: vehicleError } = await supabase
    .from('vehicles')
    .insert(vehicles)
    .select('id');
  
  if (vehicleError) {
    console.error('Error seeding vehicles:', vehicleError);
    return;
  }

  // Drivers
  if (vehicleData && vehicleData.length > 0) {
    const drivers = [
      {
        vehicle_id: vehicleData[0].id,
        full_name: 'Tunde Bakare',
        phone: '+234 803 111 2233',
        license_no: 'LAG-DRV-44821',
        status: 'available',
        deliveries_completed: 1284,
        rating: 4.8,
        owner_id: userId
      },
      {
        vehicle_id: vehicleData[1].id,
        full_name: 'Ngozi Eze',
        phone: '+234 805 332 9090',
        license_no: 'ABJ-DRV-10233',
        status: 'on_route',
        deliveries_completed: 932,
        rating: 4.9,
        owner_id: userId
      }
    ];

    const { error: driverError } = await supabase
      .from('drivers')
      .insert(drivers);
    
    if (driverError) {
      console.error('Error seeding drivers:', driverError);
    }
  }

  // Routes
  const routes = [
    {
      name: 'Lagos – Ibadan Express',
      origin: 'Lagos',
      destination: 'Ibadan',
      distance_km: 130,
      est_hours: 2.5,
      stops: 3,
      status: 'active',
      owner_id: userId
    },
    {
      name: 'Lagos – Abuja Corridor',
      origin: 'Lagos',
      destination: 'Abuja',
      distance_km: 760,
      est_hours: 11,
      stops: 5,
      status: 'active',
      owner_id: userId
    }
  ];

  const { data: routeData, error: routeError } = await supabase
    .from('routes')
    .insert(routes)
    .select('id');
  
  if (routeError) {
    console.error('Error seeding routes:', routeError);
    return;
  }

  // Shipments
  if (routeData && routeData.length > 0) {
    const shipments = [
      {
        reference: 'UIG-SHP-10241',
        customer: 'Jumia Nigeria',
        pickup_city: 'Lagos',
        dropoff_city: 'Ibadan',
        cargo: 'Consumer electronics (24 cartons)',
        weight_kg: 640,
        status: 'in_transit',
        driver_id: vehicleData[0].id, // Simplified for demo
        route_id: routeData[0].id,
        eta: '2026-06-10',
        tracking_code: 'TRK-7H2K9A',
        owner_id: userId
      },
      {
        reference: 'UIG-SHP-10244',
        customer: 'Shoprite Holdings',
        pickup_city: 'Lagos',
        dropoff_city: 'Abuja',
        cargo: 'FMCG retail stock',
        weight_kg: 5400,
        status: 'in_transit',
        driver_id: vehicleData[1].id, // Simplified for demo
        route_id: routeData[1].id,
        eta: '2026-06-11',
        tracking_code: 'TRK-5RT0WK',
        owner_id: userId
      }
    ];

    const { error: shipmentError } = await supabase
      .from('shipments')
      .insert(shipments);
    
    if (shipmentError) {
      console.error('Error seeding shipments:', shipmentError);
    }
  }
}

async function seedIntelligence(supabase: any, userId: string) {
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
  
  if (datasetError) {
    console.error('Error seeding datasets:', datasetError);
    return;
  }

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
    
    if (modelError) {
      console.error('Error seeding models:', modelError);
      return;
    }

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
      
      if (predictionError) {
        console.error('Error seeding predictions:', predictionError);
      }
    }
  }
}

async function seedInnovationLab(supabase: any, userId: string) {
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
  
  if (ideaError) {
    console.error('Error seeding ideas:', ideaError);
    return;
  }

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
    
    if (prototypeError) {
      console.error('Error seeding prototypes:', prototypeError);
    }
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
  
  if (partnerError) {
    console.error('Error seeding partners:', partnerError);
  }
}

// Main function handler
Deno.serve(async (req) => {
  try {
    // Create a Supabase client with the request's authorization header
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Parse the request body
    const { user_id, email, selected_divisions, primary_division, role_preference }: SignupPayload = await req.json();

    // Assign default role based on preference
    const role = role_preference === 'staff' ? 'staff' : 'client';

    // Insert user divisions
    const userDivisions = selected_divisions.map((division_slug) => ({
      user_id,
      division_slug,
    }));

    const { error: divisionError } = await supabaseClient
      .from('user_divisions')
      .insert(userDivisions);

    if (divisionError) {
      console.error('Error inserting user divisions:', divisionError);
      return new Response(JSON.stringify({ error: divisionError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Assign role to user
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id,
        role,
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Seed sample data for each selected division
    for (const division of selected_divisions) {
      switch (division) {
        case 'real-estate':
          await seedRealEstate(supabaseClient, user_id);
          break;
        case 'technology':
          await seedTechnology(supabaseClient, user_id);
          break;
        case 'agritech':
          await seedAgriTech(supabaseClient, user_id);
          break;
        case 'logistics':
          await seedLogistics(supabaseClient, user_id);
          break;
        case 'intelligence':
          await seedIntelligence(supabaseClient, user_id);
          break;
        case 'innovation-lab':
          await seedInnovationLab(supabaseClient, user_id);
          break;
      }
    }

    // Create welcome notification
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        title: 'Welcome to UIG!',
        body: `You've successfully joined the ${selected_divisions.length} division${selected_divisions.length > 1 ? 's' : ''} you selected. Your workspace${selected_divisions.length > 1 ? 's are' : ' is'} now ready.`,
        division: primary_division || selected_divisions[0],
      });

    if (notificationError) {
      console.error('Error creating welcome notification:', notificationError);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in signup_choose_division function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});