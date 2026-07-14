# UIG Nexus — Recovery + Build Plan

## Context / findings

The live database is out of sync with the repo. Confirmed missing from the live schema: **every migration from `20260709130000` onward was never applied** — roughly 16 files. This is why `document_library`, `billing_transactions`, and the investor/farmer self-service columns don't appear in `src/integrations/supabase/types.ts`.

Missing tables include: `property_units`, `property_images`, `crm_activities`, `deployments`, `automation_rules`, `project_invoices`, `tech_project_documents`, `shipment_events`, `route_stops`, `vehicle_maintenance_logs`, `field_images`, `agri_alerts`, `ai_chat_messages`, `mvp_checklist_items`, `demo_days`, `demo_day_slots`, `newsletter_subscribers`, `document_library`, `billing_transactions` — plus lease e-sign columns on `tenants` and `user_id` columns on `investors`/`farmers`.

Load-bearing files you flagged (`_apex.tsx` roles/nav, `portal.choose-division.tsx` role-intent selector, `package.json` stripe/playwright deps, all `supabase/migrations/`) are present and will be preserved, not reverted.

Two items I cannot do as literally described (explained in chat): I can't `git pull` from your GitHub repo (Lovable manages git internally), and on Lovable Cloud the service-role key / DB password / a separate Supabase dashboard login are not accessible — local dev uses the anon key + URL already in `.env`.

---

## Phase 1 — Apply pending migrations + regenerate types  (do first, then PAUSE)

Re-run the SQL of each unapplied migration through the migration tool, **in dependency order** (each requires your approval). Most use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`, so already-present objects are skipped safely.

Order:
1. `newsletter_subscribers`
2. Division expansions: `real_estate` → `technology` → `logistics` → `agritech` → `intelligence` → `innovation_lab` (+ RLS tighten, notifications insert fix)
3. `documents_center` (`document_library` + storage policies)
4. `messaging`
5. `lease_esign_stub` (depends on `tenants`)
6. `billing_stripe` (`billing_transactions`)
7. `investor_farmer_self_service` (depends on `agritech` tables: `field_images`, `agri_alerts`)

After all migrations run, the types file regenerates automatically from the live schema. I'll then verify each new table/column exists via read queries and run the DB linter for new RLS gaps.

**Stop here and report verification results before feature work.**

---

## Phase 2 — Real Estate core CRUD + division-scoped RLS

Working create/edit/delete for **properties, units, tenants, leads, documents**, all scoped to `real-estate` division access:
- Server functions in `src/lib/realestate.functions.ts` (CRUD + list/detail), guarded by `requireSupabaseAuth` + division-access check.
- Wire existing routes: `properties.index/$id/new`, `real-estate.units.$id`, `tenants`, `leads`, plus a documents surface backed by `document_library`.
- Verify RLS: only users with `real-estate` in `user_divisions` can read/write; confirm inserts set owner/division correctly.

## Phase 3 — Technology portal + access-request approval flow

- Technology KPIs + searchable project/document library + project/workflow management tied to the selected division (builds on existing `tech.functions.ts`).
- "Request access to another division" UI → writes to `access_requests`.
- Admin approval flow (admin route) that, on approval, updates `user_divisions` and lets the user route into the new workspace. Reuses the `getMyAccessRequestStatus` pattern already in `_apex.tsx`.

## Phase 4 — Creative upgrades (largest; sequenced after core is stable)

Real Estate: virtual tours, mortgage/ROI calculator, neighborhood scoring · AgriTech: weather-linked yield forecasts, produce marketplace · Logistics: live GPS map, route suggestions · Intelligence: anomaly-detection alerts · Innovation Lab: idea submission + upvoting board · Cross-cutting: NGN/USD dual-currency display, PWA install, WhatsApp notifications. (Paystack/Flutterwave deferred — Stripe sandbox stays for now.)

## Phase 5 — Playwright regression tests

Cover sign up → choose division → dashboard, and sign in → dashboard → sign out → sign in, asserting redirects/routing never regress. Uses existing `@playwright/test` dep + `test:e2e` script.

---

## Technical notes
- Migrations applied via the migration tool (not raw psql) so approval + type regen happen correctly; run strictly in the order above to satisfy FK/column dependencies.
- All new server logic uses `createServerFn` + `requireSupabaseAuth` (no edge functions for app logic); admin-only actions verify role via `has_role`.
- New public tables (if any arise) get GRANTs in the same migration.
- I'll also quietly fix the current realtime notifications runtime error (a `postgres_changes` callback added after `subscribe()`).
