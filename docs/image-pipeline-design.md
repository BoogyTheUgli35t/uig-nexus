# UIG Nexus — Cloudinary image pipeline design

Status: proposal · Author: Claude (with Deen) · Date: 2026-07-14

## 1. Problem and requirements

Today the site's imagery comes from three inconsistent sources: bundled local JPGs
(division heroes), hand-picked Unsplash URLs seeded into `property_images.storage_path`
(unverifiable, some may 404), and future portal uploads to Supabase Storage. There is no
single system for generating, organizing, or delivering images.

**Functional requirements**

- Generate branded imagery for the six division pages and homepage via the Cloudinary
  Image Generation API (owner has an account + API keys).
- Replace the 104 seeded Unsplash listing photos with reliable, owned assets.
- Organize all media into a location-aware folder taxonomy: each state (Lagos, FCT,
  Rivers, Enugu, Kano) owns its listings' images, mirroring the existing route grouping
  (`/divisions/real-estate/listings/$state/$id`).
- Real photos must be able to replace generated ones later with zero code changes.

**Non-functional requirements**

- No broken images, ever: every image slot has a deterministic fallback.
- Fast delivery: CDN, `f_auto`/`q_auto`, responsive widths.
- Cost control: generation happens once, offline; runtime is delivery-only.
- Secrets stay server-side; the browser only ever sees delivery URLs.

**Constraints**

- Stack: TanStack Start + Supabase (Lovable-managed), solo owner, no ops team.
- `property_images.storage_path` already accepts full `https://` URLs
  (`resolveImageUrl()` passes them through) — Cloudinary URLs drop in with no schema change.
- Cloudinary's Image Generation API is early-stage; endpoint shapes may change, so all
  generation logic lives in one script, not in app code.

## 2. High-level design

Generation is a **one-time offline batch**, not a runtime dependency. The running site
never calls the generation API; it only serves finished Cloudinary delivery URLs.

```
        OFFLINE (run once, rerun to regenerate)
┌──────────────────────────────────────────────────────┐
│ scripts/generate-images.mjs  (Node, server-side)     │
│  1. Read manifest (prompts per slot)                 │
│  2. POST Cloudinary Image Generation API             │
│  3. Upload/assign into folder taxonomy (public_id)   │
│  4. Emit url-map.json                                │
└───────────────┬───────────────────┬──────────────────┘
                │                   │
     divisions/homepage        listing photos
                │                   │
                v                   v
   src/lib/divisions.ts      SQL UPDATE property_images
   (constants, committed)    SET storage_path = <cdn url>
                                    │
        RUNTIME                     v
   <img src="res.cloudinary.com/<cloud>/image/upload/
        t_card/uig/listings/lagos/<property-id>/0">
```

## 3. Folder taxonomy (the "location folders" answer)

Routes are already grouped by state; this extends the same grouping into media storage.
`public_id` is deterministic — regenerating overwrites the same slot, and swapping in a
real photo is just an upload to the same `public_id`.

```
uig/
├── brand/                      homepage + shared marketing
│   ├── home-hero
│   └── story-01 … story-06
├── divisions/
│   ├── technology/{hero, gallery-01..04}
│   ├── agritech/{hero, gallery-01..04}
│   ├── real-estate/…  logistics/…  intelligence/…  innovation-lab/…
└── listings/
    ├── lagos/<property-uuid>/{0,1,2}        ← position = filename
    ├── fct-abuja/<property-uuid>/{0,1,2}
    ├── rivers/…  enugu/…  kano/…
```

State folder names are slugified from `properties.state` ("FCT (Abuja)" → `fct-abuja`).
The generation script derives every listing slot by querying
`properties JOIN property_images` — new properties added later get folders automatically
on the next script run.

## 4. Deep dive

**Generation manifest.** A checked-in `scripts/image-manifest.json` maps each slot to a
prompt. Division prompts describe the division's world (e.g. agritech: "aerial drone view
of irrigated farmland in Nigeria, golden hour, editorial photography style"); listing
prompts are derived from the row: property_type + city + description keywords + caption.
Prompts are data, so re-art-directing requires no code changes.

**API usage.** Default model `nano-banana` (standard tier) for galleries and listing
images; `flux` (premium) for the seven hero slots where quality matters most. The exact
request shape is confirmed from the Console's code panel at implementation time (the API
is documented as early-version). Uploads use the Node SDK with `public_id`, `overwrite: true`,
`invalidate: true`.

**Delivery.** Three named transformations, referenced everywhere instead of inline params:
`t_hero` (w 1600, ar 16:9, c_fill, f_auto, q_auto), `t_card` (w 800, ar 16:10),
`t_thumb` (w 400, ar 4:3). Marketing pages keep local JPGs as the `onError` fallback;
listing cards already fall back to the building icon.

**Wiring into the app.**
- Divisions/homepage: the script emits `url-map.json`; constants in `src/lib/divisions.ts`
  and `src/routes/index.tsx` are updated once (galleries can be repopulated from
  `uig/divisions/<slug>/gallery-*`).
- Listings: one SQL migration updates `property_images.storage_path` per row (keyed on
  property title + position, same idempotent style as the seed migration). No schema change.

**Secrets.** `CLOUDINARY_URL` goes in `.env` (already gitignored) and is read only by the
script — never by client code, never committed. Delivery URLs are public by design.

**Honesty requirement (non-negotiable for listings).** These are real properties offered
for sale/rent. AI-generated property photos can misrepresent the asset. Mitigation:
every generated listing image gets caption prefix "Illustrative render —" and the listing
detail page shows an "Illustrative imagery" badge whenever `is_render = true` (new boolean
column on `property_images`, default false). Real photos uploaded via the portal clear the
flag. Division/homepage imagery has no such concern (it's brand art, not product claims).

## 5. Scale, cost, reliability

- Volume: 7 heroes + 30 gallery/story + ~104 listing slots ≈ **141 generations, one-time**.
  At typical add-on credit rates this fits comfortably in a paid plan's monthly credits;
  regeneration is incremental (only slots you re-prompt).
- Runtime load: delivery-only through Cloudinary's CDN; 34 listings is trivial traffic.
  Free/low-tier bandwidth is sufficient by orders of magnitude.
- Failure modes: generation script is resumable (skips existing `public_id`s unless
  `--force`); site keeps current images until the URL swap is committed, so a failed batch
  changes nothing in production.
- Monitoring: Cloudinary dashboard for credit/bandwidth; a `scripts/check-images.mjs`
  smoke test HEADs every URL in `url-map.json` + `property_images` and fails CI on 404s —
  this also permanently retires the "are the Unsplash IDs real?" class of bug.

## 6. Trade-offs

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| When to generate | Offline batch | Runtime on-the-fly | Deterministic cost, no latency, no API-instability exposure |
| Where listing URLs live | DB (`storage_path`) | Code constants | Portal uploads already write there; zero schema change |
| Where division URLs live | Code constants | DB | Marketing content is versioned with the site, reviewable in PRs |
| Hero model | flux (premium) | nano-banana everywhere | 7 slots define the brand; the delta cost is a few credits |
| Listing renders | Labeled "illustrative" | Pass off as photos | Legal/trust risk on real property listings |
| Storage | Cloudinary folders | Supabase Storage | Generation + transforms + CDN in one system; Supabase Storage remains for portal-uploaded originals if desired |

## 7. Revisit as it grows

- If listing count grows past ~1k: move generation trigger into the portal ("generate
  placeholder" button per property) instead of batch scans.
- If Cloudinary's generation API changes (it's early-version): only
  `scripts/generate-images.mjs` is touched.
- When real photography arrives: upload to the same `public_id`s, clear `is_render`,
  done — no code or DB changes.
