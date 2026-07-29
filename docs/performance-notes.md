# Performance notes

Status: living document · Last reviewed: 2026-07-17

## Done

**Image right-sizing.** Property photos are stored at 1600px but render into
400–800px cards. `sizedImage()` in `src/lib/media.ts` rewrites the CDN URL to
the width actually needed (Cloudinary `w_`, Unsplash `w=`), and passes anything
else through untouched. Applied to the listings hub, per-state listing cards,
listing gallery thumbnails and "similar listings" covers. Generated imagery also
carries `f_auto,q_auto`, so browsers get AVIF/WebP where supported.

**Lazy loading.** Gallery strips, listing cards and thumbnails carry
`loading="lazy"`; only above-the-fold heroes load eagerly.

**Accessibility.** All 13 audited public pages pass WCAG 2.1 A/AA under axe
(`e2e/a11y.spec.ts`), enforced in CI.

## Known risk: unbounded workspace queries

Most division workspace loaders select entire tables with no `.limit()`:

| Module | Selects | Bounded |
|---|---|---|
| `realestate.functions.ts` | 21 | 0 |
| `logistics.functions.ts` | 13 | 0 |
| `innovation.functions.ts` | 12 | 0 |
| `agritech.functions.ts` | 13 | 3 |
| `portal.functions.ts` | 30 | 5 |

At today's data volumes (tens to low hundreds of rows) this is not a user-visible
problem — which is why it hasn't been "fixed" yet.

**Why a naive `.limit()` would be wrong.** These loaders compute their KPI tiles
from the arrays they fetch (`propertyRows.length`, occupancy ratios, on-time
percentages). Capping the fetch would silently make every headline number wrong
once a division crosses the cap — a worse failure than a slow page, because it
looks plausible.

**The correct fix, when volume warrants it:**

1. Split each loader into (a) `count: "exact", head: true` queries for the KPI
   tiles, and (b) a bounded, ordered page of rows for the visible list.
2. Add cursor/offset pagination to the list endpoints
   (`listPropertiesFiltered`, shipments, leads, ideas) and wire the existing
   filter UIs to it.
3. Move the heaviest aggregations (occupancy, on-time rate, yield totals) into
   Postgres views or RPCs so the browser never receives raw rows for them.

**Trigger to act:** any single division table passing ~1,000 rows, or a
workspace payload exceeding ~1 MB. Check with the admin data console
(`/portal/admin/data`), which reports per-table counts platform-wide.

## Other observations

- The client bundle has one chunk over 500 kB (`index-*.js`, ~708 kB raw /
  ~208 kB gzipped) — dominated by Recharts. Worth code-splitting the chart-heavy
  portal routes if bundle size becomes a concern; the public marketing pages
  don't need Recharts at all.
- `vite build` warns about this on every build; the warning is accurate, not
  noise.
