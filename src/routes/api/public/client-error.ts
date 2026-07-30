import { createFileRoute } from "@tanstack/react-router";

/**
 * Client error sink.
 *
 * There's no third-party error tracker wired into this build (no Sentry DSN,
 * no extra dependency), so unhandled client errors previously vanished — the
 * user saw the fallback screen and we learned nothing. This endpoint gives the
 * app somewhere to report to, writing into `portal_audit_log` so errors sit
 * alongside the rest of the operational trail and are visible in
 * /portal/admin/audit.
 *
 * Hardening notes:
 *  - Unauthenticated by necessity (errors happen to signed-out visitors too),
 *    so payloads are strictly capped and never echoed back.
 *  - No PII is requested; only message, route and a truncated stack.
 *  - Always answers 204 — a failing error reporter must never itself surface
 *    an error, and must never tell a prober what it did.
 *
 * Swapping in Sentry later means changing this handler's body, not the callers.
 */

const MAX = { message: 500, stack: 2000, route: 300, agent: 200 } as const;

const clip = (v: unknown, max: number): string =>
  typeof v === "string" ? v.slice(0, max) : "";

export const Route = createFileRoute("/api/public/client-error")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = (await request.json()) as Record<string, unknown>;
          const message = clip(raw.message, MAX.message);
          if (!message) return new Response(null, { status: 204 });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("portal_audit_log").insert({
            event_type: "client_error",
            metadata: {
              message,
              route: clip(raw.route, MAX.route),
              stack: clip(raw.stack, MAX.stack),
              user_agent: clip(request.headers.get("user-agent"), MAX.agent),
            },
          });
        } catch {
          // Swallow: reporting failures must stay invisible to the visitor.
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
