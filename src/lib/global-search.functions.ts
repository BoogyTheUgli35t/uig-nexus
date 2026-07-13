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
    const q = `%${data.query}%`;

    const [{ data: properties }, { data: shipments }, { data: farmers }, { data: ideas }, { data: techProjects }] =
      await Promise.all([
        supabase.from("properties").select("id, title").ilike("title", q).limit(5),
        supabase
          .from("shipments")
          .select("id, reference, customer, tracking_code")
          .or(`customer.ilike.${q},reference.ilike.${q},tracking_code.ilike.${q}`)
          .limit(5),
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
