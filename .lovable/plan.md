## UIG Divisions — Multi-Module Build

Turn the existing Apex Portal into a true multi-division operating system. Each division becomes its own workspace under `/portal/<division>/*`, sharing one auth layer, one sidebar shell, and shared infrastructure (notifications, messaging, documents). We build the **foundation first**, then one division per phase so each ships fully working and verified.

Roles stay compact (`admin`, `staff`, `client`, plus `investor`, `farmer`, `driver`); per-division access is granted through a `user_divisions` table rather than a role explosion. The AI Model Trainer is an AI-powered placeholder using Lovable AI for live predictions/insights — no real GPU training. Hero + gallery images are generated now as branded dark/gold assets.

---

### Phase 1 — Shared Foundation (this implementation)

**Database**

- Extend `app_role` enum: add `investor`, `farmer`, `driver`.
- `divisions` lookup table (slug, name, tagline, accent) seeded with the 6 divisions.
- `user_divisions` (user_id, division_slug) — controls which division workspaces a user sees.
- `notifications` (user_id, division, title, body, read_at) — cross-division alerts, RLS scoped to owner.
- `messages` (division, thread_key, sender_id, body) — internal + client chat per division, RLS scoped to participants/org.
- Extend `documents` with optional `division` tag column (keeps existing project link working).
- Helper `has_division_access(uid, slug)` security-definer function; GRANTs + RLS on every new table.

**Shell & shared UI**

- Restructure the portal sidebar into division groups: each division a collapsible section showing its modules, filtered by `user_divisions` + role. Keep global topbar, dark/gold theme.
- Shared building blocks reused by every division: `HeroBanner` (background image + overlay), `ImageGallery`, `KpiStat`, `DataPanel`, `EmptyState`, status badges.
- Notifications bell + dropdown in the topbar; a shared Messaging panel component; a shared Documents center with tagging.
- New server functions file(s) for divisions, notifications, messaging, documents.

**Imagery**

- Generate premium hero images (one per division) + a small gallery set per division into `src/assets/`, matching the brief's scenes (futuristic servers, drone over farmland, smart buildings, fleet/GPS, AI brain/data streams, innovation lab).

**Admin**

- Extend the admin area to manage divisions, assign users to divisions, and review access requests (builds on existing audit/access-request work).

Verify: migration clean, build passes, sidebar renders per access, images load.

---

### Phases 2–7 — One division per follow-up

Each phase = migration (tables + RLS + GRANTs) → server functions → routes under `/portal/<division>/*` → sidebar wiring → build + smoke test. All pages use real seeded sample data (no lorem ipsum), hero image, and gallery.

**2. UIG Technology** ✅ DONE — `tech_projects`, `tech_tasks`, `integrations` (RLS by division access + staff/admin, seeded). Workspace at `/portal/divisions/technology`: KPIs, project board (5-column pipeline, status moves, task toggle), new-engagement form, integration hub. Next: client portal/invoices + automation builder.

**3. UIG AgriTech** — `farmers`, `fields`, `sensor_data`, `yield_predictions`. Modules: farmer onboarding, field dashboard (map + sensor readings), AI yield-forecast chart. Roles: admin, farmer, staff(cooperative manager).

**4. UIG Real Estate** — `properties`, `tenants`, `investors`, `leads`. Modules: property listings grid, tenant portal, investor ROI dashboard, CRM pipeline. Roles: admin, staff(agent), client(tenant), investor.

**5. UIG Logistics** — `shipments`, `drivers`, `vehicles`, `routes`. Modules: shipment tracking (map), driver task view (mobile-friendly), fleet panel, route-optimization placeholder. Roles: admin, staff(dispatcher), driver, client(customer).

**6. UIG Intelligence** — `datasets`, `models`, `predictions`. Modules: AI assistant panel (chat + insights via Lovable AI), predictive-analytics dashboard, dataset upload + **UIG Model Trainer** (upload dataset → "train" model record with status/accuracy → run live AI predictions → view insights). Roles: admin, staff(data scientist/analyst).

**7. UIG Innovation Lab** — `ideas`, `prototypes`, `partners`, `experiments`. Modules: idea submission, prototype tracker, partner collaboration, experiment log. Cross-links into Intelligence's Model Trainer for AI experiments. Roles: admin, staff(founder), partner, investor.

---

### Technical notes

- All data access via `createServerFn` + `requireSupabaseAuth` (RLS as the signed-in user); admin client only for trusted server work.
- AI features use Lovable AI Gateway (`google/gemini-3-flash-preview` for chat/insights) — no user API key.
- Portal stays behind the `_apex` role gate and `noindex`; public marketing site/divisions pages are untouched.
- No new raw color literals — reuse existing dark/gold design tokens in `src/styles.css`.
- Dataset/document uploads use the existing private storage bucket with per-user/division path scoping.

### Out of scope (stubbed as MVP placeholders)

Real IoT sensor ingestion, live GPS/Maps SDK tracking, real ML model training/GPUs, payment processing, native driver mobile app. These render as realistic dashboards with seeded/simulated data.  
  
  
🎨 Creative Enhancements (Add Below the Plan)

**AI Model Trainer Upgrade**

- Keep the Lovable AI placeholder for runtime, but design the UX as if UIG is training its own models.
- Add a **Model Lifecycle dashboard**: Upload → Train → Evaluate → Deploy → Monitor.
- Cross‑link this into every division (AgriTech yield models, Real Estate price prediction, Logistics route optimization).
- Position **UIG Intelligence** as the brain of the group, with **Innovation Lab** as the sandbox.

**Imagery as Storytelling**

- Don’t just drop hero images — weave galleries into the workflow.
- AgriTech: farmer dashboard shows live sensor data alongside drone imagery.
- Real Estate: property listings grid includes smart building renders.
- Logistics: shipment tracking map overlays with fleet photos.
- This makes each division feel alive and industry‑specific.

**Division UX Personality**

- Give each division its own accent color (within dark/gold theme):
  - Technology = electric blue highlights
  - AgriTech = green overlays
  - Real Estate = silver/white accents
  - Logistics = orange/red highlights
  - Intelligence = neon purple
  - Innovation Lab = teal
- This makes the portal feel unified but with distinct “rooms.”

**Innovation Lab as the Creative Hub**

- Expand cross‑links: every division can submit ideas into the Lab.
- Add **“Experiment with AI”** button that pipes datasets into Intelligence.
- Add **“Prototype Showcase”** gallery with screenshots of MVPs.
- This makes UIG look like a venture studio, not just a service provider.

## ✨ Improved Build Plan (Creative Version)

**Foundation**

- Compact roles + division access.
- Shared infra (notifications, messaging, docs).
- Sidebar grouped by division, each with accent color + hero/gallery.
- Admin panel manages divisions, users, and AI model trainer access.

**Division Modules**

- **Technology:** Project board, client portal, automation hub, integration gallery.
- **AgriTech:** Farmer onboarding, field dashboard with drone imagery, yield prediction chart.
- **Real Estate:** Property listings grid with smart renders, tenant portal, investor ROI dashboard.
- **Logistics:** Shipment tracking map with fleet photos, driver app, route optimization.
- **Intelligence:** AI assistant, predictive analytics, Model Lifecycle dashboard.
- **Innovation Lab:** Idea submission, prototype tracker, partner collaboration, experiment showcase.

**Imagery**

- Generate premium hero + gallery images now.
- Integrate galleries into workflows (not just static).
- Accent colors per division for personality.

**AI Model Trainer**

- Placeholder runtime with Lovable AI.
- UX designed as full lifecycle (upload → train → evaluate → deploy → monitor).
- Cross‑linked into AgriTech, Real Estate, Logistics.
- Innovation Lab acts as experimentation hub.

🔥 This way, you keep Lovable’s **solid technical plan** intact, but directly beneath it you add the **creative upgrade layer**. Together, it reads like: *“Here’s the architecture Lovable will build, and here’s how we’ll make it visually rich, personality‑driven, and AI‑powered.”*