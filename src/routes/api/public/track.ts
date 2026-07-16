import { createFileRoute } from "@tanstack/react-router";

/**
 * Public, unauthenticated shipment tracking endpoint.
 *
 * The underlying `track_shipment` / `track_shipment_events` Postgres functions
 * are SECURITY DEFINER and were previously granted directly to `anon`, which
 * the Supabase linter flagged. We now revoke direct EXECUTE and proxy the
 * lookup through this server route using the service-role client. The route
 * still only returns rows that match the exact tracking code supplied — it
 * never lists shipments — so the safety posture is unchanged.
 */
export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const raw = (url.searchParams.get("code") ?? "").trim().toUpperCase();
        if (!raw || raw.length < 3 || raw.length > 40 || !/^[A-Z0-9_-]+$/.test(raw)) {
          return Response.json({ shipment: null, events: [] }, { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [{ data: rows, error }, { data: evRows }] = await Promise.all([
          supabaseAdmin.rpc("track_shipment", { p_tracking_code: raw }),
          supabaseAdmin.rpc("track_shipment_events", { p_tracking_code: raw }),
        ]);
        if (error) return Response.json({ shipment: null, events: [] }, { status: 500 });
        return Response.json({
          shipment: (rows?.[0] as Record<string, unknown> | undefined) ?? null,
          events: (evRows as unknown[]) ?? [],
        });
      },
    },
  },
});
