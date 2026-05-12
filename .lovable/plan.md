
# UIG — Final Pre-Phase-2 Master Build

Build the full Unified Innovations Group digital HQ to the brief's standard, harden the Apex Portal, fix Projects, promote the admin, add Playwright smoke tests, and lock in a build-verification routine.

---

## 1. Design system lockdown

`src/styles.css` tokens (oklch equivalents of brand hex):
- `--background` deep black `#0A0A0A`, `--surface` navy `#0D0F1A`
- `--gold` `#C9A84C`, `--gold-light` `#E8C97A`, `--shadow-gold` glow
- `--foreground` off-white `#F5F0E8`, `--muted-foreground` `#8A8070`
- Fonts: Playfair Display (display) + Inter (sans) via `@fontsource`
- Utility classes: `.text-gradient-gold`, `.gradient-gold`, `.shadow-gold`, scroll-reveal helper

Reusable site primitives in `src/components/site/`:
- `Section`, `Eyebrow`, `MarqueeTicker`, `StatBar`, `DivisionCard`, `PillarGrid`, `QuoteBlock`, `LogoStrip`, `InsightCard`, `CTAStrip`, `BackToTop`, `WhatsAppFAB`, `CookieBanner`, `NewsletterForm`, `LoadingScreen`

Header gets a Divisions dropdown (NavigationMenu) + Careers + News & Insights links + gold Get Started CTA.
Footer gets the 6-column structure from the brief.

---

## 2. Public pages (every one fully built — no lorem)

Routes (each with unique `head()` meta — title/description/og):

| Route | File | Notes |
|---|---|---|
| `/` | `index.tsx` | 10 sections from the brief |
| `/about` | `about.tsx` | 7 sections incl. animated counters & reach map |
| `/divisions` | `divisions.index.tsx` | Multi-sector thesis + 6 rich cards |
| `/divisions/technology` | existing | Rewrite to full brief copy + real-time capabilities + metrics |
| `/divisions/agritech` | existing | Same |
| `/divisions/real-estate` | existing | Same |
| `/divisions/logistics` | existing | Same |
| `/divisions/intelligence` | existing | Same |
| `/divisions/innovation-lab` | existing | Same |
| `/services` | `services.tsx` | 6 grouped categories + Custom Solutions block |
| `/careers` | `careers.tsx` | 7 placeholder roles + open application form |
| `/insights` | `insights.tsx` | 3 featured articles, listing |
| `/insights/$slug` | `insights.$slug.tsx` | Full article template (3 seeded posts) |
| `/contact` | `contact.tsx` | Expanded form with Country + Division + Budget + Message |
| 404 | `__root.tsx` notFoundComponent | Branded 404 |

`DivisionPage` component extended to support: hero, problem block, services grid, real-time capabilities list, target clients, metrics bar, CTA — driven by typed props so all 6 pages stay consistent and rich.

Global add-ons mounted in `__root.tsx`:
- `LoadingScreen` (first visit only, sessionStorage flag)
- `CookieBanner` (gold, dismiss persisted)
- `WhatsAppFAB` (placeholder number, env-overridable)
- `BackToTop`
- `sitemap.xml` + `robots.txt` as server routes under `src/routes/api/public/`

Forms (contact, careers application, newsletter) all use Zod + insert into Supabase tables with RLS allowing public insert + admin read.

---

## 3. Portal hardening

- **Error diagnostics with reference IDs**: helper `logPortalError({ stage, error, email })` writes a `portal_audit_log` row with `metadata.ref_id = 'UIG-' + 6char`. Login/Signup show *"Something went wrong. Reference: UIG-XXXXXX"* for unexpected errors; friendly copy for known cases (wrong password, duplicate email) still gets a ref ID.
- **Audit view** at `/portal/admin/audit` (admin-only via `_apex.tsx` RBAC) — searchable table of recent events.
- **Projects fix** (both empty & no create):
  - Migration: ensure default "UIG Internal" org; backfill profiles missing `org_id` for staff/admin; update `handle_new_user` to assign default org for staff/admin.
  - UI: `New Project` dialog on `/portal/projects` (staff/admin only) — name/type/status/description, calls `createProject` server fn (`requireSupabaseAuth` + role check). Detail page gets edit + tasks add/complete.
  - Empty state CTA when list is empty.
- **Sidebar/route RBAC** already in `_apex.tsx`; add the Audit entry for admins.

---

## 4. Promote William Barber

Insert/upsert `('admin')` in `user_roles` for the user with email `boogyharry090@gmail.com` (lookup via `auth.users`). Verify with a follow-up `read_query`.

---

## 5. Playwright smoke tests

Add `@playwright/test`, config targeting the preview URL. Specs:
- `signup.spec.ts`, `login.spec.ts`, `logout.spec.ts`
- `rbac.spec.ts` (client vs admin nav)
- `access-denied.spec.ts` (no-role user → access request CTA)
- `public-links.spec.ts` (crawl every public route + every nav link, assert 200 + h1)
- `contact-form.spec.ts`, `careers-form.spec.ts`

Test users provisioned via service-role admin API in `globalSetup`; teardown deletes them. `bun run test:e2e` script.

---

## 6. Build verification routine

`BUILD_CHECKLIST.md` at repo root + this order after every change:
1. `bun run build:dev`
2. `bun run build:prod`
3. `bun run test:e2e`
4. Manual spot-check (home, /divisions, one division page, /services, /careers, /insights, /contact, /portal/login → /portal/dashboard)

Drive-by: restart dev server to clear the `virtual:tanstack-start-client-entry` stale-cache error currently in the runtime log.

---

## Out of scope (Phase 2)

Real CMS for insights, live messaging/notifications, AI insights inside portal, payments, custom domain email setup. Phase 1 finishes the public site, the portal foundation, and the verification harness.

---

## Technical reference

- **Counters**: `useInView` + `requestAnimationFrame` ramp; no extra deps.
- **Marquee**: pure CSS `@keyframes` translate; pause on hover.
- **Reach map**: SVG of Africa with Nigerian states highlighted (inline, no asset dep).
- **Insights articles**: stored as MDX-style TS objects in `src/content/insights/`; full article pages rendered from typed data — no DB needed for Phase 1.
- **Newsletter table**: new `newsletter_subscribers` (email unique, source, created_at) with public insert + admin read RLS.
- **Careers table**: new `career_applications` (name, email, phone, role, location, cover, resume_url) with public insert + admin read; resumes go to a private storage bucket.
- **Contact table**: extend `contact_submissions` with `country` + `division` (already exists) + `budget_range` (nullable text). Migration handles the additive columns.
- **SEO files**: `src/routes/api/public/sitemap.xml.ts` and `robots.txt.ts` server routes generate from a static route registry.
- **Auth ref ID**: `'UIG-' + crypto.randomUUID().replace(/-/g,'').slice(0,6).toUpperCase()`.

Ready to implement on approval.
