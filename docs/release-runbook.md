# Release runbook

Status: living document · Last reviewed: 2026-07-17

## What ships where

| Environment | Trigger                              | URL                   | Database              |
| ----------- | ------------------------------------ | --------------------- | --------------------- |
| Local dev   | `npm run dev`                        | http://localhost:8080 | live Supabase project |
| Preview     | Lovable branch preview               | Lovable-assigned      | live Supabase project |
| Production  | push to `main` (Lovable auto-deploy) | production domain     | live Supabase project |

**There is one database.** Dev, preview and production all point at Supabase
project `djocumwhwbncrpbnsfsy`. Treat every local run as touching production
data — this is the single largest operational risk in the current setup, and
the first thing to fix if the platform takes real customers. Until then: never
run destructive SQL locally, and prefer the seeders (which are idempotent and
only fill empty divisions).

## Pre-flight checklist

Run before every release. CI enforces the first four on push.

- [ ] `npm run lint`
- [ ] `npm run typecheck` — must be zero errors
- [ ] `npm run test` — unit tests (vitest)
- [ ] `npm run build` — must succeed
- [ ] `npm run test:e2e` — public suite green; hydration-dependent tests skip
      unless run against a hydrating environment
- [ ] Migrations: any new file in `supabase/migrations/` applied to the live
      project (Lovable applies its own; ones written here must be run manually
      in the SQL editor)
- [ ] `node scripts/check-images.mjs` — no broken image URLs
- [ ] Flags reviewed (below) — anything unfinished is `off` in production

## Feature flags

Set as environment variables in the deploy environment. Unset = enabled, so a
missing variable fails toward the shipped experience rather than silently
hiding a division.

| Variable                         | Gates                                                      |
| -------------------------------- | ---------------------------------------------------------- |
| `VITE_FLAG_REAL_ESTATE_LISTINGS` | Public listings browse (`/divisions/real-estate/listings`) |
| `VITE_FLAG_INNOVATION_INTAKE`    | Public idea submission form                                |
| `VITE_FLAG_STATUS_PAGE`          | Public status page                                         |
| `VITE_FLAG_SELF_SERVE_SIGNUP`    | Portal signup (vs. access-request only)                    |

Set to `off` to disable; the route redirects to its parent instead of 404ing,
so links stay valid, and the page drops out of `/sitemap.xml` so crawlers
aren't sent to a redirect. Flags are build-time — changing one needs a redeploy.

There is deliberately **no payments flag**: Stripe surfaces are already gated at
runtime by whether `STRIPE_SECRET_KEY` is configured, which can't drift out of
sync with whether checkout actually works.

## Monitoring

**Uptime.** Point a monitor at:

- `GET /api/public/health` every 60s — liveness, no database round-trip.
  Alert on non-200.
- `GET /api/public/health?deep=1` every 5min — verifies Supabase answers.
  Returns 503 + `{"status":"degraded"}` when the database is unreachable.
  Alert on 503 twice consecutively (one blip is usually a cold worker).

Don't run the deep check every minute; it costs a query each time.

**Errors.** Unhandled client errors and anything reaching the error screen POST
to `/api/public/client-error`, which writes an `event_type: "client_error"` row
into `portal_audit_log`. Review at `/portal/admin/audit`, filtered to that
event type. Reporting is capped at 10 per browser session so a render loop
can't flood the log.

This is deliberately not Sentry — no third-party DSN or extra dependency is
wired in. Swapping in a real tracker means changing the body of
`src/routes/api/public/client-error.ts`; the callers don't change.

**Data volume.** `/portal/admin/data` reports per-table record counts. See
`docs/performance-notes.md` for the thresholds that should trigger pagination
work.

## Rollback

Lovable deploys from `main`, so rollback is a git operation:

```bash
git revert <bad-commit>   # preferred — keeps history honest
git push
```

Never force-push `main`: Lovable's cloud editor also commits to it, and a
force-push will destroy work that isn't on this machine (this has already
caused one recovery incident).

**Migrations do not roll back with the code.** A revert of application code
leaves the schema change in place. Additive migrations (new column/table) are
safe to leave. If a migration must be undone, write a new forward migration
that reverses it, rather than editing or deleting the original.

## Known operational gaps

Honest list of what is _not_ production-hardened yet:

1. **Single shared database** across all environments (see above).
2. **No staging environment** distinct from preview.
3. **No automated backups verified** — Supabase's own backups exist on the
   plan, but a restore has never been rehearsed.
4. **E2E authenticated flows** only run when `E2E_TEST_EMAIL` /
   `E2E_TEST_PASSWORD` secrets are configured; they are currently unset, so
   portal flows self-skip in CI.
5. **Dependency vulnerabilities** — 8 open at last check (1 high, 6 moderate,
   1 low). See below.

## Dependency vulnerabilities

Current state (verified with `npm audit` _after_ a clean reinstall, which is
the only number worth trusting — see the warning below):

| Severity | Package                                                                 | Fix available?                                            |
| -------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| high     | `undici`                                                                | only by downgrading `@cloudflare/vite-plugin` 1.51 → 1.12 |
| moderate | `@cloudflare/vite-plugin`, `miniflare`                                  | same major downgrade                                      |
| moderate | `@lovable.dev/mcp-js`, `@modelcontextprotocol/sdk`, `@hono/node-server` | none published                                            |
| low      | `esbuild`                                                               | yes, but pulled back in transitively                      |

**Why the high severity is accepted for now.** `undici` reaches the tree only
through `@cloudflare/vite-plugin → miniflare/wrangler` — the local Workers
emulator and the deploy CLI. It is not part of the deployed worker bundle, so
it is not reachable by visitors. The only remedy npm offers is a 39-minor
downgrade of the Cloudflare plugin, which is the deploy target for this app;
that trade (near-certain build breakage against a build-tooling advisory) is
not worth taking. Revisit when Cloudflare ships a patched miniflare.

**Warning learned the hard way.** `npm audit fix` updates the lockfile, but a
later plain `npm install` can re-resolve ranges and silently undo part of it —
this repo went 20 → 4 → back to 14 that way, and the regression was only caught
because GitHub's Dependabot count disagreed with the local one. Always re-run
`npm install` _then_ `npm audit` before believing a number, and prefer
`overrides` in package.json for anything that keeps reverting.
