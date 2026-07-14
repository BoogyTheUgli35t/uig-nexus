#!/usr/bin/env node
// UIG Nexus — Cloudinary image generation batch (see docs/image-pipeline-design.md).
//
// Usage:
//   node scripts/generate-images.mjs [--brand] [--divisions] [--listings] [--force] [--dry-run]
//   (no scope flags = all scopes)
//
// Requires CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> in .env.
// Never expose CLOUDINARY_URL to client code.
//
// Outputs:
//   scripts/url-map.json                — slot -> delivery URL (resumable state)
//   scripts/update-listing-images.sql   — paste into Supabase SQL editor to swap listing photos

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// ---------- env ----------
const env = {};
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const CLOUDINARY_URL = process.env.CLOUDINARY_URL || env.CLOUDINARY_URL;
if (!CLOUDINARY_URL) {
  console.error("Missing CLOUDINARY_URL in .env (cloudinary://<key>:<secret>@<cloud>)");
  process.exit(1);
}
const cu = new URL(CLOUDINARY_URL);
const CLOUD = cu.hostname, KEY = cu.username, SECRET = cu.password;

// Signed upload via plain REST (no SDK dep; repo is bun-managed).
async function uploadTo(publicId, fileUrl) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { invalidate: "true", overwrite: "true", public_id: publicId, timestamp: String(timestamp) };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const signature = createHash("sha1").update(toSign + SECRET).digest("hex");
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append("file", fileUrl);
  form.append("api_key", KEY);
  form.append("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(`Upload failed for ${publicId}: ${JSON.stringify(json)}`);
  return json;
}

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");
const DRY = args.has("--dry-run");
const scopes = ["--brand", "--divisions", "--listings"].filter((s) => args.has(s));
const inScope = (s) => scopes.length === 0 || scopes.includes(`--${s}`);

const manifest = JSON.parse(readFileSync(new URL("./image-manifest.json", import.meta.url), "utf8"));
const urlMapPath = new URL("./url-map.json", import.meta.url);
const urlMap = existsSync(urlMapPath) ? JSON.parse(readFileSync(urlMapPath, "utf8")) : {};
const saveMap = () => writeFileSync(urlMapPath, JSON.stringify(urlMap, null, 2));

// ---------- generation API (early-version; endpoint self-discovery) ----------
// Confirmed shape from docs: JSON POST, { prompt, model, target: { public_id, ... } },
// async mode returns 202 + task_id. Exact path may evolve — candidates tried in order,
// override with CLOUDINARY_GEN_ENDPOINT if Cloudinary's Console code panel shows another.
const GEN_ENDPOINTS = [
  process.env.CLOUDINARY_GEN_ENDPOINT || env.CLOUDINARY_GEN_ENDPOINT,
  `https://api.cloudinary.com/v2/${CLOUD}/ai/image_generation`,
  `https://api.cloudinary.com/v2/${CLOUD}/ai/image/generate`,
  `https://api.cloudinary.com/v1_1/${CLOUD}/image/generate`,
].filter(Boolean);
let genEndpoint = null;
const auth = "Basic " + Buffer.from(`${KEY}:${SECRET}`).toString("base64");

async function callGen(body) {
  const candidates = genEndpoint ? [genEndpoint] : GEN_ENDPOINTS;
  let lastErr;
  for (const ep of candidates) {
    const res = await fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(body),
    });
    if (res.status === 404 && !genEndpoint) { lastErr = `404 at ${ep}`; continue; }
    const json = await res.json().catch(() => ({}));
    if (!res.ok && res.status !== 202) {
      throw new Error(`Generation API ${res.status} at ${ep}: ${JSON.stringify(json)}`);
    }
    genEndpoint = ep;
    return { status: res.status, json };
  }
  throw new Error(
    `No generation endpoint responded (${lastErr}). Open Cloudinary Console > Image > Image Generation, ` +
    `generate once, copy the endpoint from the Code panel, and set CLOUDINARY_GEN_ENDPOINT in .env.`,
  );
}

async function pollTask(taskUrlOrId) {
  const url = String(taskUrlOrId).startsWith("http")
    ? taskUrlOrId
    : `${genEndpoint}/tasks/${taskUrlOrId}`;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(url, { headers: { Authorization: auth } });
    const json = await res.json().catch(() => ({}));
    const state = json.status || json.state;
    if (state === "completed" || json.secure_url || json.asset?.secure_url) return json;
    if (state === "failed") throw new Error(`Generation task failed: ${JSON.stringify(json)}`);
  }
  throw new Error("Generation task timed out after 3 minutes");
}

function extractUrl(json) {
  return json.secure_url || json.asset?.secure_url || json.result?.secure_url ||
    json.data?.secure_url || json.images?.[0]?.secure_url || null;
}

async function generateTo(publicId, prompt, { model, aspectRatio }) {
  if (urlMap[publicId] && !FORCE) { console.log(`skip (done): ${publicId}`); return urlMap[publicId]; }
  if (DRY) { console.log(`[dry-run] ${publicId} <- "${prompt.slice(0, 70)}..." (${model})`); return null; }

  let { status, json } = await callGen({
    prompt,
    model,
    aspect_ratio: aspectRatio,
    target: { public_id: publicId, target_type: "permanent" },
  });
  if (status === 202 && (json.task_id || json.location)) json = await pollTask(json.location || json.task_id);

  let url = extractUrl(json);
  if (!url) throw new Error(`No secure_url in response for ${publicId}: ${JSON.stringify(json).slice(0, 400)}`);

  // If the API stored the asset under its own id rather than our target, copy it into place.
  if (!url.includes(encodeURIComponent(publicId)) && !url.includes(publicId)) {
    const up = await uploadTo(publicId, url);
    url = up.secure_url;
  }
  urlMap[publicId] = url;
  saveMap();
  console.log(`generated: ${publicId}`);
  return url;
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ---------- scopes ----------
async function runBrand() {
  for (const slot of manifest.brand) {
    await generateTo(slot.publicId, `${slot.prompt}, ${manifest.defaults.style}`, {
      model: manifest.defaults.model, aspectRatio: slot.aspectRatio || "4:3",
    });
  }
}

async function runDivisions() {
  for (const d of manifest.divisions) {
    await generateTo(`uig/divisions/${d.slug}/hero`, `${d.hero}, ${manifest.defaults.style}`, {
      model: manifest.defaults.heroModel, aspectRatio: "16:9",
    });
    for (let i = 0; i < d.gallery.length; i++) {
      await generateTo(
        `uig/divisions/${d.slug}/gallery-${String(i + 1).padStart(2, "0")}`,
        `${d.gallery[i]}, ${manifest.defaults.style}`,
        { model: manifest.defaults.model, aspectRatio: "4:3" },
      );
    }
  }
}

async function runListings() {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
  const { data: props, error } = await supabase
    .from("properties")
    .select("id, title, property_type, city, state, description")
    .neq("status", "off_market");
  if (error) throw new Error(error.message);
  const { data: imgs, error: e2 } = await supabase
    .from("property_images")
    .select("id, property_id, position");
  if (e2) throw new Error(e2.message);

  const t = manifest.listings;
  const sql = [
    "-- Generated by scripts/generate-images.mjs — swap listing photos to Cloudinary renders.",
    "-- Marks rows as illustrative renders (requires 20260714160000_property_image_renders.sql).",
    "BEGIN;",
  ];
  for (const p of props) {
    const stateFolder = slugify(p.state || p.city || "unassigned");
    const rows = imgs.filter((i) => i.property_id === p.id).sort((a, b) => a.position - b.position);
    for (const row of rows) {
      const angle = t.angles[row.position % t.angles.length];
      const subject = t.subjects[p.property_type] || t.subjects.residential;
      const prompt = t.promptTemplate
        .replace("{subject}", subject).replace("{city}", p.city || "Lagos").replace("{angle}", angle);
      const publicId = `uig/listings/${stateFolder}/${p.id}/${row.position}`;
      const url = await generateTo(publicId, prompt, { model: manifest.defaults.model, aspectRatio: "16:10" });
      if (url) {
        sql.push(
          `UPDATE public.property_images SET storage_path = '${url}', is_render = true, ` +
          `caption = 'Illustrative render — ' || COALESCE(NULLIF(caption, ''), '${angle.replace(/'/g, "''")}') ` +
          `WHERE id = '${row.id}';`,
        );
      }
    }
  }
  sql.push("COMMIT;");
  if (!DRY) {
    writeFileSync(new URL("./update-listing-images.sql", import.meta.url), sql.join("\n") + "\n");
    console.log(`wrote scripts/update-listing-images.sql (${sql.length - 3} updates)`);
  }
}

// ---------- main ----------
try {
  if (inScope("brand")) await runBrand();
  if (inScope("divisions")) await runDivisions();
  if (inScope("listings")) await runListings();
  console.log("done.");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
