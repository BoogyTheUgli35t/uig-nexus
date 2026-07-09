make sure to follow this exact build plan: Here’s a regenerated **full build plan** that merges the already‑built Lovable plan (from your UIG Nexus project) with the creative enhancements we designed. This way you have a single, unified spec that reflects what’s live, what’s complete, and what’s still missing — with every division page, route, and feature included.

# UIG Nexus — Full Build Plan (Regenerated Master Spec)

## Foundation

- **Roles:** Compact set (admin, staff, client, plus investor, farmer, driver).
- **Access control:** `user_divisions` table controls which division dashboards a user sees.
- **Shared infra:** Notifications, messaging, documents center, admin panel.
- **UI shell:** Global topbar (notifications, search, user menu), sidebar grouped by division, premium dark UI with gold accents.
- **Imagery:** HeroBanner + ImageGallery per division, seeded with premium branded assets.
- **Payments:** Stripe sandbox integrated, checkout flow working, webhook route ready.
- **Security:** RLS scoped per division, dangerous “any user can read/edit everything” policies removed.
- **Auth:** Supabase sign‑up/sign‑in verified, Google sign‑in enabled, leaked‑password protection active.

## Division Workspaces

### 1. UIG Technology (Accent: Electric Blue)

- **Tables:** `tech_projects`, `tech_tasks`, `integrations`, `deployments`.
- **Routes:** `/portal/divisions/technology`, `/projects`, `/automation`, `/integrations`, `/client-portal/:id`.
- **Modules:** Project board (Kanban + timeline), client portal, automation rules builder, integration hub.
- **Imagery:** Futuristic servers, dashboards, coding visuals.
- **Extra features:** SLA tracker, release notes, milestone billing.

### 2. UIG AgriTech (Accent: Green)

- **Tables:** `farmers`, `fields`, `sensor_data`, `yield_predictions`, `cooperatives`.
- **Routes:** `/portal/divisions/agritech`, `/farmers`, `/fields/:id`, `/sensors`, `/predictions`.
- **Modules:** Farmer onboarding, field dashboard (map + sensor overlays), yield prediction chart.
- **Imagery:** Drone over farmland, smart tractors, irrigation systems.
- **Extra features:** Field health index, alerting (low moisture/pest risk), farmer training content.

### 3. UIG Real Estate (Accent: Silver/White)

- **Tables:** `properties`, `property_units`, `tenants`, `investors`, `leads`, `crm_activities`, `property_analytics`.
- **Routes:** `/portal/divisions/real-estate`, `/properties`, `/properties/:id`, `/tenants`, `/investors`, `/leads`, `/reports`.
- **Modules:** Property listings grid with images, tenant portal, investor ROI dashboard, CRM pipeline.
- **Imagery:** Modern Nigerian smart buildings, luxury apartments, smart housing renders.
- **Extra features:** Smart alerts, automated lead follow‑ups, property comparison tool, eSign stub.

### 4. UIG Logistics (Accent: Orange/Red)

- **Tables:** `shipments`, `drivers`, `vehicles`, `routes`, `delivery_proofs`.
- **Routes:** `/portal/divisions/logistics`, `/shipments`, `/shipments/:id`, `/drivers`, `/fleet`, `/routes`.
- **Modules:** Shipment tracking (map + live board), driver task view (mobile‑friendly), fleet panel, route optimization grid.
- **Imagery:** Trucks, GPS maps, logistics hubs, fleet vehicles.
- **Extra features:** ETA prediction, driver performance dashboards, customer tracking portal.

### 5. UIG Intelligence (Accent: Neon Purple)

- **Tables:** `datasets`, `models`, `predictions`, `model_runs`.
- **Routes:** `/portal/divisions/intelligence`, `/datasets`, `/models`, `/models/:id`, `/assistant`, `/integrations`.
- **Modules:** AI assistant panel, predictive analytics dashboard, dataset upload, Model Trainer.
- **Creative upgrade:** Full Model Lifecycle dashboard (Upload → Train → Evaluate → Deploy → Monitor).
- **Imagery:** AI brain graphics, neural networks, predictive charts.
- **Extra features:** Model explainability, drift alerts, experiment tracking.

### 6. UIG Innovation Lab (Accent: Teal)

- **Tables:** `ideas`, `prototypes`, `experiments`, `partners`.
- **Routes:** `/portal/divisions/innovation-lab`, `/ideas`, `/prototypes`, `/experiments`.
- **Modules:** Idea submission, prototype tracker, partner collaboration, experiment log.
- **Creative upgrade:** “Experiment with AI” button pipes datasets into Intelligence; Prototype Showcase gallery.
- **Imagery:** Startup teams, hackathons, lab experiments.
- **Extra features:** Partner portal, MVP checklist, demo day scheduler.

## Signup & Onboarding Flow

- **Route:** `/signup` → `/signup/choose-division`.
- **Flow:** User registers → verifies email → chooses division(s) → `user_divisions` seeded → lands on chosen dashboard.
- **UX:** Division cards with hero thumbnails and taglines; multi‑select allowed; primary workspace set.
- **Result:** Each user lands directly in the division they bought into, with seeded demo data and galleries.

## Website Status

- **Built:** Public site (Home, About, Divisions, Services, Careers, Insights, Contact), division pages with hero sections, portal infrastructure, SEO basics, admin setup, error handling.
- **Missing:** Division functional modules (now specified above), Playwright E2E suite, cookie banner, WhatsApp FAB, About page expansion, Services page polish, image galleries wired into workflows, payment gating, subscription management.

## Strategies & Next Steps

- **Phase delivery:** Foundation → Tech + Real Estate → AgriTech + Logistics → Intelligence + Innovation Lab.
- **Seeded demo data:** Nigerian properties, farms, fleets, datasets.
- **Image storytelling:** Galleries integrated into dashboards and reports.
- **Pilots:** Secure 2–3 pilot customers per division.
- **Payments:** Stripe live setup with webhook secret; subscription management.
- **Testing:** Playwright E2E for signup, division onboarding, core flows.
- **Compliance:** Cookie banner, NDPR/GDPR consent, RLS audits.
- **AI roadmap:** Placeholder training now, external ML service integration later.
- **Innovation:** Use Lab to incubate spinouts and showcase prototypes.

## Closing

This regenerated plan now matches your **already built Lovable phases** (Logistics, Intelligence, Innovation Lab complete, Stripe sandbox integrated, Supabase auth fixed) and incorporates the **creative upgrades** (accent colors, galleries, Model Lifecycle, division storytelling). It’s the **full build pipeline**: every division page, route, module, and feature accounted for, with signup routing users to their chosen division dashboards.