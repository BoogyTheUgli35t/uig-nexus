import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Seed sample data for Real Estate division */
export const seedRealEstateData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    
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

    // Insert properties
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert(properties)
      .select('id');
    
    if (propertyError) throw new Error(propertyError.message);

    // Tenants (linked to properties)
    if (propertyData && propertyData.length > 0) {
      const tenants = [
        {
          property_id: propertyData[0].id,
          full_name: 'Bashir Adamu',
          email: 'bashir.adamu@example.com',
          phone: '+234 805 222 3344',
          rent_amount: 9500000,
          lease_start: '2024-09-01',
          lease_end: '2025-08-31',
          payment_status: 'due',
          owner_id: userId
        },
        {
          property_id: propertyData[1].id,
          full_name: 'Adaeze Nwosu',
          email: 'adaeze.nwosu@example.com',
          phone: '+234 809 441 7788',
          rent_amount: 48000000,
          lease_start: '2024-06-01',
          lease_end: '2025-05-31',
          payment_status: 'overdue',
          owner_id: userId
        }
      ];

      const { error: tenantError } = await supabase
        .from('tenants')
        .insert(tenants);
      
      if (tenantError) throw new Error(tenantError.message);

      // Leads (linked to properties)
      const leads = [
        {
          property_id: propertyData[0].id,
          full_name: 'Chukwuma Obi',
          email: 'chukwuma.obi@example.com',
          phone: '+234 805 667 8899',
          stage: 'viewing',
          notes: 'Scheduled a second viewing this weekend. Interested in payment plan.',
          owner_id: userId
        },
        {
          property_id: propertyData[2].id,
          full_name: 'Fatima Yusuf',
          email: 'fatima.yusuf@example.com',
          phone: '+234 803 221 9090',
          stage: 'negotiation',
          notes: 'Offered 5% below asking. Awaiting owner response.',
          owner_id: userId
        }
      ];

      const { error: leadError } = await supabase
        .from('leads')
        .insert(leads);
      
      if (leadError) throw new Error(leadError.message);
    }

    // Investors
    const investors = [
      {
        full_name: 'Olumide Bankole',
        email: 'olumide.bankole@example.com',
        phone: '+234 803 100 2003',
        amount_invested: 500000000,
        portfolio_value: 615000000,
        expected_roi: 14.5,
        owner_id: userId
      },
      {
        full_name: 'Aisha Mohammed',
        email: 'aisha.m@example.com',
        phone: '+234 806 332 4455',
        amount_invested: 250000000,
        portfolio_value: 287500000,
        expected_roi: 11.0,
        owner_id: userId
      }
    ];

    const { error: investorError } = await supabase
      .from('investors')
      .insert(investors);
    
    if (investorError) throw new Error(investorError.message);

    return { success: true };
  });