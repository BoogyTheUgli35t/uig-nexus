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
