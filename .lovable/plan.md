
# UIG Website + Apex Portal

This is a large build. To keep quality high and reviewable, I'll deliver it in two phases. Phase 1 ships everything users can see today (full marketing site + portal login + foundational portal). Phase 2 layers in the deeper portal modules (messaging, notifications, admin panel polish).

## Design system

- Dark premium theme, near-black background, soft elevated surfaces
- Gold accent (`#D4AF37`-ish) for CTAs, highlights, dividers
- Typography: modern sans (Inter / Space Grotesk pairing), generous spacing
- Subtle futuristic motifs: thin gold gradients, grid backgrounds, glow on hover
- Fully responsive, mobile-first nav with dropdown for Divisions

---

## Phase 1 — Public website + portal foundation

### Public site (TanStack routes)

Each page is its own route file with unique SEO metadata (title, description, OG tags).

- `/` Home — hero, divisions ticker, About snapshot, "Why UIG" cards, CTA
- `/about` — story, mission, vision, operating model, stats
- `/divisions` — intro + 6 division cards
- `/divisions/technology` — full content as provided (hero, problem, solutions, 5-step process, why, CTA)
- `/divisions/agritech` — full content (hero, problem, solutions, use cases, CTA)
- `/divisions/real-estate` — full content (hero, problem, solutions, CTA)
- `/divisions/logistics` — full content (hero, problem, solutions, CTA)
- `/divisions/intelligence` — full content (hero, solutions, positioning, CTA)
- `/divisions/innovation-lab` — full content (focus, startups/corporates/investors, CTA)
- `/services` — cross-division service cards linking to division pages
- `/contact` — intro + form (name, email, company, division dropdown, message) with success state; submissions stored in `contact_submissions` table
- `/portal` — explainer + "Login to Portal" / "Request Access"

Shared layout: top nav (logo, Home, About, Divisions dropdown, Services, Portal, Contact) and footer (description, divisions, contact email, social placeholders).

### Apex Portal foundation

- **Auth** (Lovable Cloud): email/password + Google sign-in, signup, login, password reset
- **Role system** via separate `user_roles` table with enum (`admin`, `staff`, `client`) + `has_role()` security-definer function
- **Organizations**: users belong to an org; org-scoped data
- **Protected routes** under `/portal/*` using TanStack `_authenticated` layout pattern
- **Portal dashboard** (`/portal/dashboard`): KPI cards, recent projects, recent tasks, notification bell (static feed in Phase 1)
- **Universal Projects module** (`/portal/projects`): list + detail view with tabs (Overview, Tasks, Documents, Timeline). One `projects` table with a `type` field (`tech` | `real_estate` | `logistics`) so the same module powers all three.
- **Tasks**: create, assign, status, due date — scoped to a project
- **Documents**: upload to Lovable Cloud storage, list per project
- **Profile/settings** page

### Database (Phase 1)

- `profiles` (id, full_name, avatar, org_id)
- `user_roles` (user_id, role) — separate table, enforced via RLS
- `organizations` (id, name)
- `projects` (id, org_id, type, name, status, owner_id, metadata jsonb)
- `tasks` (id, project_id, title, status, assignee_id, due_date)
- `documents` (id, project_id, file_path, name, uploaded_by)
- `contact_submissions` (id, name, email, company, division, message)

RLS on every table; org-scoped policies; admins bypass via `has_role()`.

---

## Phase 2 — Portal depth (after Phase 1 approval)

- Messaging system (project threads + client/internal channels)
- Real notifications table + realtime subscriptions
- Project Timeline (activity log auto-populated from tasks/docs/messages)
- Admin panel: manage users, roles, organizations
- AI insights widget on dashboard (Lovable AI summary of recent activity)
- Per-division specialized fields (properties for real estate, shipments for logistics)

---

## Technical notes

- Stack: TanStack Start (already set up), React + TS, Tailwind v4, shadcn/ui, Lovable Cloud (Supabase) for auth/db/storage
- All portal data access through `createServerFn` with `requireSupabaseAuth` middleware
- Contact form writes via server function (no email integration in Phase 1 — just DB + success toast)
- SEO: per-route `head()` with unique title/description/OG

---

## What I'd like to confirm

1. **Phasing OK?** Phase 1 = full website + portal scaffolding (auth, dashboard, projects, tasks, documents). Phase 2 = messaging, notifications, admin panel, AI insights. If you'd rather everything in one go, I'll do it but it'll be a much larger single build.
2. **Logo / brand assets**: none provided — I'll use a clean text wordmark "UIG" with a gold accent mark. Swap later when you have a logo.
3. **Contact form**: store submissions in DB only for now, or also email them somewhere (would need Resend setup)?

If the above looks right, hit Implement and I'll start on Phase 1.
