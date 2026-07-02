# 🌱 Sample Data Seeding Specification

All seed data should be realistic, Nigerian-focused, and ready for demo/testing.

## Tech Division
```sql
-- 8 Projects
INSERT INTO tech_projects (title, client_name, status, progress, owner_id) VALUES
('Client Portal Redesign', 'ABC Finance Ltd', 'building', 60, <user_id>),
('API Integration Suite', 'XYZ Logistics', 'review', 85, <user_id>),
('Mobile App MVP', 'TechStart Nigeria', 'discovery', 20, <user_id>),
('Data Dashboard', 'Energy Corp', 'live', 100, <user_id>),
('Automation Engine', 'Supply Co', 'building', 50, <user_id>),
('CRM Platform', 'Sales Team Inc', 'paused', 30, <user_id>),
('E-commerce Platform', 'RetailHub NG', 'discovery', 10, <user_id>),
('Analytics Pipeline', 'Data Insights', 'review', 90, <user_id>);

-- 40 Tasks (5 per project, spread across statuses)
-- For each project, create tasks: 2 todo, 2 in_progress, 1 done
-- Titles: "Setup database", "Create API endpoints", "Build UI components", "Testing", "Deployment"

-- 5 Integrations
INSERT INTO integrations (name, provider, status, last_sync) VALUES
('Slack Integration', 'slack', 'connected', now()),
('Stripe Payments', 'stripe', 'error', now() - interval '2 days'),
('GitHub Sync', 'github', 'connected', now()),
('SendGrid Email', 'sendgrid', 'disconnected', now() - interval '7 days'),
('Datadog Monitoring', 'datadog', 'connected', now());
```

---

## Real Estate Division
```sql
-- 10 Properties (mixed types, Lagos/Abuja/PH)
INSERT INTO properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, owner_id) VALUES
('Lekki Phase 1 Luxury Apartment', 'residential', 'Lagos', '123 Admiralty Way, Lekki', 250000000, 3, 3, 250, 'available', 'Modern luxury apartment with sea view'),
('Ikoyi Office Complex', 'commercial', 'Lagos', '45 Broad Street, Ikoyi', 850000000, 0, 5, 5000, 'available', 'Prime commercial space in CBD'),
('Abuja Residential Plot', 'land', 'Abuja', 'Plot 456, Maitama', 35000000, 0, 0, 2000, 'available', 'Residential land in Maitama'),
('Port Harcourt Mixed Use', 'mixed_use', 'Port Harcourt', '789 Aba Road', 120000000, 8, 8, 2500, 'rented', 'Mixed commercial and residential'),
('Lekki Two-Bedroom', 'residential', 'Lagos', '567 Off Lekki-Epe Road', 95000000, 2, 2, 120, 'sold', 'Cozy apartment in gated estate'),
('Parkview Estate Penthouse', 'residential', 'Ikoyi', '234 Ikoyi Lane', 450000000, 4, 4, 350, 'available', 'Luxury penthouse with pool'),
('Abuja Commercial Mall', 'commercial', 'Abuja', 'Plot 100, Wuse 2', 500000000, 0, 20, 8000, 'available', 'Modern shopping mall'),
('Lagos Island Townhouse', 'residential', 'Lagos', '111 Ozumba Mbadiwe Ave', 180000000, 3, 3, 200, 'reserved', 'Waterfront townhouse'),
('Lekki Business Park', 'commercial', 'Lagos', '222 Lekki-Epe Expressway', 200000000, 0, 8, 3000, 'available', 'Office park with 10 units'),
('Kaduna Residential Estate', 'residential', 'Kaduna', '333 Ahmadu Bello Way', 50000000, 3, 2, 150, 'available', 'Newly built residential estate');

-- 20 Leads (5 per property, mix of stages)
-- Stages: new, contacted, viewing, negotiation, closed, lost
-- For each property, create 2 new, 2 contacted, 1 viewing

-- 8 Tenants (active leases)
INSERT INTO tenants (property_id, full_name, email, phone, rent_amount, lease_start, lease_end, payment_status) VALUES
(<prop1_id>, 'Chinedu Okafor', 'chinedu@email.com', '+234802123456', 1500000, '2025-01-01', '2027-01-01', 'current'),
(<prop2_id>, 'Amara Nwosu', 'amara@email.com', '+234803456789', 2500000, '2025-03-01', '2026-03-01', 'current'),
(<prop3_id>, 'Yusuf Ibrahim', 'yusuf@email.com', '+234901234567', 500000, '2025-02-01', '2026-02-01', 'overdue'),
(<prop4_id>, 'Zainab Ahmed', 'zainab@email.com', '+234909876543', 800000, '2024-12-01', '2025-12-01', 'current'),
(<prop5_id>, 'Emeka Eze', 'emeka@email.com', '+234807654321', 1200000, '2025-01-15', '2026-01-15', 'current'),
(<prop6_id>, 'Lara Silva', 'lara@email.com', '+234802468135', 3500000, '2025-04-01', '2027-04-01', 'current'),
(<prop7_id>, 'Bola Adeyemi', 'bola@email.com', '+234803579246', 1800000, '2024-11-01', '2025-11-01', 'due'),
(<prop8_id>, 'Grace Okonkwo', 'grace@email.com', '+234809753246', 2200000, '2025-02-15', '2026-02-15', 'current');

-- 3 Investors
INSERT INTO investors (full_name, email, phone, amount_invested, portfolio_value, expected_roi) VALUES
('Tunde Adeleke', 'tunde@investors.com', '+234802000000', 500000000, 650000000, 18.5),
('Folake Okonkwo', 'folake@investors.com', '+234803000000', 750000000, 945000000, 22.0),
('Chisom Nnamdi', 'chisom@investors.com', '+234801000000', 300000000, 375000000, 15.0);
```

---

## AgriTech Division
```sql
-- 15 Farmers (3 cooperatives: Oyo, Kaduna, Taraba)
INSERT INTO farmers (full_name, phone, location, cooperative, primary_crop, hectares, status, owner_id) VALUES
('Hassan Adeniyi', '+234802111111', 'Ibadan, Oyo', 'Oyo Farmers Coop', 'Maize', 5.5, 'active', <user_id>),
('Adekunle Fasusi', '+234803222222', 'Ibadan, Oyo', 'Oyo Farmers Coop', 'Cassava', 3.2, 'active', <user_id>),
('Feyisayo Oladele', '+234804333333', 'Ogbomoso, Oyo', 'Oyo Farmers Coop', 'Rice', 4.0, 'active', <user_id>),
('Musa Garba', '+234805444444', 'Kaduna', 'Kaduna Agro Alliance', 'Sorghum', 6.0, 'active', <user_id>),
('Abubakar Hassan', '+234806555555', 'Kaduna', 'Kaduna Agro Alliance', 'Groundnut', 4.5, 'active', <user_id>),
('Khadija Mohammed', '+234807666666', 'Zaria, Kaduna', 'Kaduna Agro Alliance', 'Millet', 3.8, 'active', <user_id>),
('Ibrahim Aliyu', '+234808777777', 'Jalingo, Taraba', 'Taraba Green Farmers', 'Cocoa', 7.2, 'active', <user_id>),
('Amina Usman', '+234809888888', 'Jalingo, Taraba', 'Taraba Green Farmers', 'Cashew', 5.0, 'active', <user_id>),
('Eben Okoye', '+234810999999', 'Wukari, Taraba', 'Taraba Green Farmers', 'Ginger', 2.5, 'onboarding', <user_id>),
('Ngozi Igwe', '+234811000000', 'Ibadan, Oyo', 'Oyo Farmers Coop', 'Yam', 3.0, 'active', <user_id>),
('Bayo Adeyinka', '+234812111111', 'Oyo Town, Oyo', 'Oyo Farmers Coop', 'Maize', 4.5, 'active', <user_id>),
('Zainab Rabiu', '+234813222222', 'Kano', 'Kano Agro Network', 'Wheat', 5.5, 'active', <user_id>),
('Ahmed Danjuma', '+234814333333', 'Jos, Plateau', 'Jos Farmers Union', 'Irish Potato', 6.0, 'active', <user_id>),
('Chioma Obi', '+234815444444', 'Enugu', 'Enugu Farm Collective', 'Cocoyam', 2.0, 'inactive', <user_id>),
('Segun Bello', '+234816555555', 'Ibadan, Oyo', 'Oyo Farmers Coop', 'Palm', 8.0, 'active', <user_id>);

-- 30 Fields (2 per farmer on average)
-- For each farmer, create 2 fields with different crops
-- Health: 60-95, Status: mostly healthy, some at_risk, one critical

-- 100+ Sensor Readings (simulated IoT)
-- For each field, create 15-20 readings over past 30 days
-- soil_moisture: 20-80%, temperature: 20-35°C, humidity: 40-95%

-- 10 Yield Predictions
INSERT INTO yield_predictions (field_id, season, predicted_yield_tons, confidence) VALUES
(<field1_id>, '2025-2026 Season', 12.5, 92),
(<field2_id>, '2025-2026 Season', 8.3, 88),
(<field3_id>, '2025-2026 Season', 4.2, 85),
(<field4_id>, '2025-2026 Season', 15.0, 90),
(<field5_id>, '2025-2026 Season', 6.8, 87),
(<field6_id>, '2025-2026 Season', 7.5, 89),
(<field7_id>, '2025-2026 Season', 18.2, 91),
(<field8_id>, '2025-2026 Season', 5.0, 83),
(<field9_id>, '2025-2026 Season', 9.5, 86),
(<field10_id>, '2025-2026 Season', 11.0, 88);
```

---

## Logistics Division
```sql
-- 5 Vehicles
INSERT INTO vehicles (plate, type, capacity, status, odometer_km, last_service) VALUES
('LG-001-XYZ', 'Volvo Truck', 15000, 'available', 125000, '2025-06-01'),
('LG-002-ABC', 'Cargo Truck', 12000, 'on_route', 98000, '2025-05-15'),
('LG-003-DEF', 'Box Truck', 6000, 'available', 45000, '2025-06-10'),
('LG-004-GHI', 'Flatbed', 18000, 'available', 156000, '2025-04-20'),
('LG-005-JKL', 'Refrigerated', 8000, 'off_duty', 78000, '2025-03-10');

-- 8 Drivers
INSERT INTO drivers (vehicle_id, full_name, phone, license_no, status, deliveries_completed, rating) VALUES
(<vehicle1_id>, 'Emeka Obi', '+234802500000', 'DL001/25', 'available', 145, 4.8),
(<vehicle2_id>, 'Aliu Abdullahi', '+234803500000', 'DL002/25', 'on_route', 203, 4.9),
(<vehicle3_id>, 'Kunle Adeyemi', '+234804500000', 'DL003/25', 'available', 89, 4.6),
(<vehicle4_id>, 'Yakubu Hassan', '+234805500000', 'DL004/25', 'available', 267, 4.7),
(<vehicle5_id>, 'Chidi Nwosu', '+234806500000', 'DL005/25', 'off_duty', 34, 4.5),
(NULL, 'Segun Adeolu', '+234807500000', 'DL006/25', 'available', 112, 4.8),
(NULL, 'Musa Ibrahim', '+234808500000', 'DL007/25', 'available', 156, 4.6),
(NULL, 'Ose Osadolor', '+234809500000', 'DL008/25', 'available', 201, 4.9);

-- 6 Routes
INSERT INTO routes (name, origin, destination, distance_km, est_hours, stops, status) VALUES
('Lagos-Abuja Express', 'Lagos (Apapa)', 'Abuja (JKIA)', 485, 9, 3, 'active'),
('Lagos-Kano Highway', 'Lagos (Ikeja)', 'Kano (Sabon Gari)', 820, 14, 5, 'active'),
('Ibadan-Oyo Loop', 'Ibadan', 'Oyo', 85, 2, 2, 'active'),
('Benin-Warri Coastal', 'Benin City', 'Warri', 120, 3, 2, 'active'),
('Port Harcourt Circle', 'Port Harcourt', 'Aba', 145, 3, 4, 'planned'),
('Abuja-Kaduna Fast', 'Abuja', 'Kaduna', 165, 3.5, 1, 'active');

-- 12 Shipments (mix of statuses)
INSERT INTO shipments (reference, customer, pickup_city, dropoff_city, cargo, weight_kg, status, driver_id, route_id, eta, tracking_code, owner_id) VALUES
('SHP-001-2025', 'ABC Trading Co', 'Lagos', 'Abuja', 'Electronics', 2500, 'in_transit', <driver1_id>, <route1_id>, '2025-07-03', 'TRK001', <user_id>),
('SHP-002-2025', 'XYZ Logistics', 'Lagos', 'Kano', 'Textiles', 5000, 'picked_up', <driver2_id>, <route2_id>, '2025-07-05', 'TRK002', <user_id>),
('SHP-003-2025', 'RetailHub NG', 'Ibadan', 'Oyo', 'Clothing', 800, 'delivered', <driver3_id>, <route3_id>, '2025-07-02', 'TRK003', <user_id>),
('SHP-004-2025', 'Supply Chain Inc', 'Benin', 'Warri', 'Food Products', 1500, 'out_for_delivery', <driver4_id>, <route4_id>, '2025-07-02', 'TRK004', <user_id>),
('SHP-005-2025', 'Oil & Gas Ltd', 'Port Harcourt', 'Aba', 'Equipment', 3000, 'pending', NULL, NULL, '2025-07-04', 'TRK005', <user_id>),
('SHP-006-2025', 'Farm Fresh Exports', 'Lagos', 'Abuja', 'Agricultural Products', 4500, 'in_transit', <driver1_id>, <route1_id>, '2025-07-03', 'TRK006', <user_id>),
('SHP-007-2025', 'Tech Solutions', 'Lagos', 'Kano', 'IT Equipment', 1200, 'picked_up', <driver2_id>, <route2_id>, '2025-07-05', 'TRK007', <user_id>),
('SHP-008-2025', 'Construction Co', 'Ibadan', 'Lagos', 'Building Materials', 6000, 'delivered', <driver5_id>, <route1_id>, '2025-07-01', 'TRK008', <user_id>),
('SHP-009-2025', 'Pharma Corp', 'Lagos', 'Abuja', 'Medicines', 800, 'in_transit', <driver3_id>, <route1_id>, '2025-07-03', 'TRK009', <user_id>),
('SHP-010-2025', 'E-commerce Hub', 'Lagos', 'Ibadan', 'Consumer Goods', 2000, 'out_for_delivery', <driver4_id>, <route3_id>, '2025-07-02', 'TRK010', <user_id>),
('SHP-011-2025', 'Distribution Plus', 'Abuja', 'Kaduna', 'Wholesale Items', 3500, 'picked_up', <driver5_id>, <route6_id>, '2025-07-04', 'TRK011', <user_id>),
('SHP-012-2025', 'Import/Export', 'Lagos', 'Kano', 'Fashion Items', 2200, 'pending', NULL, NULL, '2025-07-06', 'TRK012', <user_id>);
```

---

## Intelligence Division
```sql
-- 3 Datasets
INSERT INTO datasets (name, source_division, description, rows_count, size_mb, status, owner_id) VALUES
('Real Estate Pricing 2024', 'real-estate', 'Historical property prices across Lagos, Abuja, PH', 2500, 45, 'ready', <user_id>),
('AgriTech Yields 2024', 'agritech', 'Yield data from 150+ farms across 3 seasons', 5000, 120, 'ready', <user_id>),
('Tech Projects Metrics', 'technology', 'KPI data from 200+ completed projects', 1200, 28, 'ready', <user_id>);

-- 2 Models
INSERT INTO models (name, dataset_id, model_type, target_division, status, accuracy, version, owner_id) VALUES
('Real Estate Price Predictor', <dataset1_id>, 'regression', 'real-estate', 'deployed', 94.5, 'v1.0', <user_id>),
('Yield Forecast AI', <dataset2_id>, 'forecast', 'agritech', 'trained', 88.2, 'v1.0', <user_id>);

-- 5 Predictions
INSERT INTO predictions (model_id, prompt, result, confidence, owner_id) VALUES
(<model1_id>, 'Predict price for 3BR apartment in Lekki, 200sqm', '₦285M - ₦315M', 92, <user_id>),
(<model1_id>, 'Price for 2BR in Abuja, 150sqm', '₦95M - ₦110M', 89, <user_id>),
(<model2_id>, 'Yield forecast for maize, 5ha, Oyo state', '12.5 - 13.2 tons', 88, <user_id>),
(<model2_id>, 'Yield forecast for cocoa, 7ha, Taraba state', '8.8 - 9.5 tons', 85, <user_id>),
(<model1_id>, 'Commercial space price, Lagos Island, 3000sqm', '₦850M - ₦950M', 91, <user_id>);
```

---

## Innovation Lab Division
```sql
-- 5 Ideas
INSERT INTO ideas (title, description, tags, submitted_by, status) VALUES
('Predictive Maintenance for Fleet', 'Use IoT sensors + ML to predict vehicle maintenance needs', JSON_ARRAY('logistics', 'ai', 'iot'), <user_id>, 'active'),
('Farmer Finance Platform', 'Microfinance platform linked to yield predictions', JSON_ARRAY('agritech', 'fintech', 'impact'), <user_id>, 'active'),
('Carbon Tracking Dashboard', 'Track carbon emissions across all divisions', JSON_ARRAY('sustainability', 'analytics'), <user_id>, 'active'),
('Property Virtual Tours', 'AI-powered 3D property tours for real estate', JSON_ARRAY('real-estate', 'ar', 'ai'), <user_id>, 'active'),
('Supply Chain Transparency', 'Blockchain-based supply chain tracking', JSON_ARRAY('logistics', 'blockchain'), <user_id>, 'under_review');

-- 2 Prototypes
INSERT INTO prototypes (idea_id, repo_link, demo_link, status, screenshots) VALUES
(<idea1_id>, 'https://github.com/uig/fleet-maintenance', 'https://demo.uig.com/fleet', 'build', JSON_ARRAY('screenshot1.jpg', 'screenshot2.jpg')),
(<idea2_id>, 'https://github.com/uig/farmer-finance', 'https://demo.uig.com/farmer-finance', 'pilot', JSON_ARRAY('screenshot3.jpg', 'screenshot4.jpg'));

-- 1 Experiment
INSERT INTO experiments (prototype_id, dataset_id, model_id, results, notes) VALUES
(<proto1_id>, <dataset3_id>, <model2_id>, JSON_OBJECT('accuracy', 0.92, 'recall', 0.88), 'Yield prediction model performs well for maize');
```

---

## Shared Tables
```sql
-- Notifications (auto-generated on division selection)
-- For each user_division created, create welcome notification

INSERT INTO notifications (user_id, division, title, body, created_at) VALUES
(<user_id>, 'technology', 'Welcome to UIG Technology', 'You now have access to technology division. Explore projects and integrations.', now()),
(<user_id>, 'real-estate', 'Welcome to UIG Real Estate', 'Start managing properties, leads, and investors.', now()),
... (per division selected)

-- Messages (sample general chat)
INSERT INTO messages (division, thread_key, sender_id, body, created_at) VALUES
(<div_id>, 'general', <user_id>, 'Welcome to the team! Check out the latest projects.', now()),
... (a few per division)
```

---

## Notes for Seeding

1. **UUIDs**: Replace `<user_id>`, `<prop1_id>`, etc. with actual UUIDs from the database
2. **Timestamps**: Use `now()` for current time; vary past dates for realistic history
3. **Images**: Store image URLs in metadata JSON or separate storage
4. **Relationships**: Ensure foreign keys exist before inserting dependent rows
5. **Sample images**: Generate realistic Nigerian locations + activities

## Sample Image URLs (using Lovable or stock)
- Tech: Dashboard mockup, code, integration logos
- Real Estate: Lagos skyline, modern apartment interior, office building
- AgriTech: Drone over farmland, tractor, irrigation system
- Logistics: Truck on highway, warehouse, map interface
- Intelligence: AI brain graphic, data streams, prediction chart
- Innovation Lab: Team brainstorming, prototype demo, pitch presentation
