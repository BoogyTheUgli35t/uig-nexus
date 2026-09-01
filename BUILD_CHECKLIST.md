# UIG Build Verification Checklist

Run after every meaningful change. Stop and fix at the first failing step.

## 1. Build

```bash
bun run build:dev
bun run build:prod
```

## 2. Smoke (manual, ~3 min)

Visit each in preview and confirm hero loads + no console errors:

- `/` — Two Steps Ahead hero, marquee, divisions grid, vision quote
- `/about`
- `/divisions` and all 6 division pages
- `/services`
- `/careers`
- `/insights` and one article (`/insights/nigeria-agriculture-tech-opportunity`)
- `/divisions/real-estate/listings` → click a state → click a property.
  Both hops used to dead-end on the hub: `listings.tsx` and `$state.tsx` were
  parent routes rendering a component with no `<Outlet />`, so every child URL
  fell back to the parent. They are `.index` leaves now — if either regresses,
  this walk is what catches it.
- On a listing: gallery arrows, the Outside/Indoors/Area chips, the thumbnail
  rail scrolling sideways, and the full-screen viewer closing on Escape
- `/contact`
- `/portal/login` → sign in → `/portal/dashboard`
- `/portal/projects` → New project dialog opens
- Sign out → returns to `/portal/login`

## 3. Header / footer parity

- Divisions dropdown lists all 6
- Careers + News links present (desktop and mobile)
- Footer shows Lagos HQ + `hello@unifiedinnovationsgroup.online`

## 4. RBAC

- Admin sees all nav (William Barber: `boogyharry090@gmail.com`)
- New signup with no role hits access-denied + Request Access form

## 5. (Deferred to next pass) Playwright E2E

Specs to add: signup, login, logout, rbac, access-denied, public-links crawl, contact form. Will require `@playwright/test` install + service-role test-user provisioning.
