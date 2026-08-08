import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SearchSchema = z.object({ query: z.string().trim().min(2).max(120) });

/**
 * Cross-division search — queries a handful of key tables directly with the
 * caller's own RLS-scoped client, so results are automatically limited to
 * whatever divisions the signed-in user actually has access to (no separate
 * permission check needed here).
 */
export const searchPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SearchSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    // Escape PostgREST filter metacharacters so the raw query cannot inject
    // additional filter clauses or column references into the .or() expression.
    // Reject/strip: , . ( ) : *  → replaced with space; wildcards % _ are also stripped
    // because we surround with our own %…% for ilike.
    const safe = data.query.replace(/[,.():*%_]/g, " ").trim();
    if (safe.length < 2) {
      return { properties: [], shipments: [], farmers: [], ideas: [], techProjects: [] };
    }
    const q = `%${safe}%`;

    const [{ data: properties }, { data: shipments }, { data: farmers }, { data: ideas }, { data: techProjects }] =
      await Promise.all([
        supabase.from("properties").select("id, title").ilike("title", q).limit(5),
        // Separate per-column ilike calls (unioned in-memory below) to avoid
        // splicing user text into a raw .or() filter string.
        Promise.all([
          supabase.from("shipments").select("id, reference, customer, tracking_code").ilike("customer", q).limit(5),
          supabase.from("shipments").select("id, reference, customer, tracking_code").ilike("reference", q).limit(5),
          supabase.from("shipments").select("id, reference, customer, tracking_code").ilike("tracking_code", q).limit(5),
        ]).then((results) => {
          const seen = new Set<string>();
          const merged: { id: string; reference: string; customer: string; tracking_code: string | null }[] = [];
          for (const r of results) {
            for (const row of r.data ?? []) {
              if (seen.has(row.id)) continue;
              seen.add(row.id);
              merged.push(row);
              if (merged.length >= 5) break;
            }
            if (merged.length >= 5) break;
          }
          return { data: merged };
        }),
        supabase.from("farmers").select("id, full_name").ilike("full_name", q).limit(5),
        supabase.from("ideas").select("id, title").ilike("title", q).limit(5),
        supabase.from("tech_projects").select("id, title").ilike("title", q).limit(5),
      ]);

    return {
      properties: (properties ?? []).map((p) => ({
        id: p.id,
        label: p.title,
        to: "/portal/divisions/real-estate/properties/$id",
      })),
      shipments: (shipments ?? []).map((s) => ({
        id: s.id,
        label: `${s.customer} · ${s.tracking_code ?? s.reference}`,
        to: "/portal/divisions/logistics/shipments/$id",
      })),
      farmers: (farmers ?? []).map((f) => ({
        id: f.id,
        label: f.full_name,
        to: "/portal/divisions/agritech/farmers",
      })),
      ideas: (ideas ?? []).map((i) => ({
        id: i.id,
        label: i.title,
        to: "/portal/divisions/innovation-lab",
      })),
      techProjects: (techProjects ?? []).map((p) => ({
        id: p.id,
        label: p.title,
        to: "/portal/divisions/technology/projects/$id",
      })),
    };
  });
