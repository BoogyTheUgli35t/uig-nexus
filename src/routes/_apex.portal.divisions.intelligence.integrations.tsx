import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sprout, Building2, Truck, FlaskConical, ArrowRight, Share2, Rocket } from "lucide-react";
import { getIntelligenceWorkspace } from "@/lib/intelligence.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/divisions/intelligence/integrations")({
  head: () => ({ meta: [{ title: "Integrations — UIG Intelligence" }] }),
  component: IntegrationsPage,
});

/** Where each division consumes Intelligence models. Endpoints are the portal
 * surfaces that already call runPrediction / the assistant with division context. */
const DIVISION_ENDPOINTS = [
  {
    slug: "agritech",
    label: "UIG AgriTech",
    icon: Sprout,
    usage: "Yield forecasting per field and season; alerts feed model context.",
    to: "/portal/divisions/agritech/predictions",
    cta: "Yield predictions",
  },
  {
    slug: "real-estate",
    label: "UIG Real Estate",
    icon: Building2,
    usage: "Price and occupancy signals for the portfolio and reports.",
    to: "/portal/divisions/real-estate/reports",
    cta: "Reports",
  },
  {
    slug: "logistics",
    label: "UIG Logistics",
    icon: Truck,
    usage: "Route optimization suggestions and ETA risk flags.",
    to: "/portal/divisions/logistics/routes",
    cta: "Routes",
  },
  {
    slug: "innovation-lab",
    label: "UIG Innovation Lab",
    icon: FlaskConical,
    usage: "Experiments link prototypes to datasets and models for evaluation.",
    to: "/portal/divisions/innovation-lab/experiments",
    cta: "Experiments",
  },
] as const;

function IntegrationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence-workspace"],
    queryFn: async () => getIntelligenceWorkspace({ headers: await authHeaders() }),
  });

  const servingModels = (data?.models ?? []).filter((m) =>
    ["deployed", "monitoring"].includes(m.status),
  );

  return (
    <div className="space-y-6">
      <DataPanel title="Models in production">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading models…</div>
        ) : servingModels.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No deployed models yet"
            description="Deploy a model from the Models tab to make it available to other divisions."
          />
        ) : (
          <div className="space-y-3">
            {servingModels.map((m) => (
              <div key={m.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to="/portal/divisions/intelligence/models/$id"
                    params={{ id: m.id }}
                    className="text-sm font-medium hover:acc-text"
                  >
                    {m.name}
                  </Link>
                  <StatusBadge status={m.status} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="capitalize">{m.model_type}</span> · serving {m.target_division} ·{" "}
                  <span className="font-mono">{m.version}</span>
                  {m.accuracy > 0 && <> · {Number(m.accuracy).toFixed(1)}% acc</>}
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      <DataPanel title="Division endpoints">
        <p className="mb-4 text-sm text-muted-foreground">
          Every division consumes Intelligence through its own workspace — these are the surfaces
          wired to models and the assistant today.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIVISION_ENDPOINTS.map((d) => (
            <div key={d.slug} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <d.icon className="h-4 w-4 acc-text" /> {d.label}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{d.usage}</p>
              <Link
                to={d.to}
                className="mt-3 inline-flex items-center gap-1 text-xs acc-text hover:underline"
              >
                {d.cta} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Share2 className="h-3.5 w-3.5" /> External ML services
          </span>{" "}
          — bring-your-own training endpoint (API key) is planned; today, training runs are
          simulated and inference is served through the platform's AI gateway.
        </div>
      </DataPanel>
    </div>
  );
}
