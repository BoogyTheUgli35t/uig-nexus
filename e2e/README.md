# E2E smoke suite (Playwright)

Run locally (not runnable in this sandbox — needs `npm install` + a browser):

```bash
npm install
npx playwright install --with-deps chromium
npm run test:e2e
```

`playwright.config.ts` boots `npm run dev` automatically and points tests at
it, unless `E2E_BASE_URL` is set (e.g. to run against a deployed preview).

Covers:

- Public site: home, divisions index, legal pages, tracking page, contact
  form shell, cookie consent banner.
- Portal auth: login form renders, bad credentials surface an error, forgot
  password flow, signup form renders, unauthenticated portal routes redirect
  to `/portal/login`.

Not covered (needs a seeded, already-confirmed test account): the full
signup -> verify email -> choose division -> land on dashboard flow, and any
authenticated division workflow (creating a shipment, listing a property,
etc.). Set `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` to a real confirmed portal
account to unlock the "Authenticated smoke" test in `auth.spec.ts`, and
extend that file with additional authenticated flows as you seed more test
accounts.
