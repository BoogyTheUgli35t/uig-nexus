import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

// Public, unauthenticated read for /status. Runs as the anon role against
// status_components / status_incidents — a separate, intentionally public
// data model from the portal's confidential per-project SLA tracker.
export const getSystemStatus = createServerFn({ method: "GET" }).handler(async () => {
  const [{ data: components, error: compError }, { data: incidents, error: incError }] =
    await Promise.all([
      supabase.from("status_components").select("*").order("position", { ascending: true }),
      supabase
        .from("status_incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
  if (compError) throw new Error(compError.message);
  if (incError) throw new Error(incError.message);

  const componentRows = components ?? [];
  const overall = componentRows.some((c) => c.status === "major_outage")
    ? "major_outage"
    : componentRows.some((c) => c.status === "partial_outage")
      ? "partial_outage"
      : componentRows.some((c) => c.status === "degraded")
        ? "degraded"
        : "operational";

  return {
    overall,
    components: componentRows,
    incidents: incidents ?? [],
  };
});
