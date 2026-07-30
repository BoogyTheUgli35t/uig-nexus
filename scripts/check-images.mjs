#!/usr/bin/env node
// Smoke test: HEAD every image URL the site serves (url-map.json + live property_images).
// Exits 1 if anything 404s. Usage: node scripts/check-images.mjs

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Prefer real environment variables (CI) and fall back to .env (local dev),
// so this can run as a CI gate without a checked-in secrets file.
const env = { ...process.env };
const envPath = new URL("../.env", import.meta.url);
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2];
  }
}

if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY — cannot check image URLs.");
  process.exit(1);
}

const urls = new Map();
const mapPath = new URL("./url-map.json", import.meta.url);
if (existsSync(mapPath)) {
  for (const [slot, url] of Object.entries(JSON.parse(readFileSync(mapPath, "utf8")))) {
    urls.set(url, slot);
  }
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
const { data, error } = await supabase.from("property_images").select("id, storage_path");
if (error) {
  console.error("DB read failed:", error.message);
  process.exit(1);
}
for (const row of data) {
  if (/^https?:\/\//.test(row.storage_path))
    urls.set(row.storage_path, `property_images:${row.id}`);
}

let failed = 0;
const entries = [...urls.entries()];
console.log(`checking ${entries.length} urls...`);
for (let i = 0; i < entries.length; i += 10) {
  await Promise.all(
    entries.slice(i, i + 10).map(async ([url, slot]) => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (!res.ok) {
          failed++;
          console.error(`${res.status}  ${slot}  ${url}`);
        }
      } catch (e) {
        failed++;
        console.error(`ERR  ${slot}  ${url}  ${e.message}`);
      }
    }),
  );
}
console.log(failed ? `${failed} broken image(s)` : "all images ok");
process.exit(failed ? 1 : 0);
