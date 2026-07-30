import { createFileRoute } from "@tanstack/react-router";

/**
 * Uptime/health endpoint for external monitors (and the status page's own
 * checks). Deliberately unauthenticated and cheap:
 *
 *  - `GET /api/public/health`        → liveness only, no database round-trip
 *  - `GET /api/public/health?deep=1` → also verifies the database answers
 *
 * Point an uptime monitor at the shallow check every minute (it proves the
 * worker is serving), and the deep check every five (it proves Supabase is
 * reachable) — the deep check costs a query, so don't hammer it.
 *
 * Returns 200 when healthy, 503 when a dependency is down, so monitors can
 * alert on status code alone. No internal detail (connection strings, stack
 * traces, row contents) is ever exposed.
 */

const startedAt = Date.now();

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const deep = url.searchParams.get("deep") === "1";

        const body: Record<string, unknown> = {
          status: "ok",
          uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
          checked_at: new Date().toISOString(),
        };

        if (!deep) {
          return Response.json(body, {
            headers: { "cache-control": "no-store" },
          });
        }

        const began = Date.now();
        try {
          // Deliberately the anon client, not the service-role one: a health
          // check must not depend on the most privileged credential in the
          // system (and would report a false outage anywhere that key isn't
          // configured). status_components is public-readable, so this proves
          // the database answers over the same path real visitors use.
          const { supabase } = await import("@/integrations/supabase/client");
          const { error } = await supabase
            .from("status_components")
            .select("id", { count: "exact", head: true });

          if (error) throw new Error(error.message);

          body.database = { status: "ok", latency_ms: Date.now() - began };
          return Response.json(body, { headers: { "cache-control": "no-store" } });
        } catch {
          // Message is intentionally omitted — monitors need the signal, not
          // our internals.
          body.status = "degraded";
          body.database = { status: "error", latency_ms: Date.now() - began };
          return Response.json(body, {
            status: 503,
            headers: { "cache-control": "no-store" },
          });
        }
      },
    },
  },
});
