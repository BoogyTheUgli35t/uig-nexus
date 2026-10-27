import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, Leaf, MapPin, Ruler, Sprout, TrendingUp } from "lucide-react";
import { getMyFarmerProfile } from "@/lib/agritech.functions";
import { authHeaders } from "@/lib/auth-headers";
import {
  DataPanel,
  EmptyState,
  KpiStat,
  QueryError,
  StatusBadge,
} from "@/components/portal/blocks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_apex/portal/my-farm")({
  head: () => ({
    meta: [{ title: "My farm — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: MyFarmPage,
});

const SEVERITY_STYLES: Record<string, string> = {
  high: "text-destructive border-destructive/40",
  medium: "text-amber-400 border-amber-400/30",
  low: "text-muted-foreground border-border",
};

function healthTone(health: number) {
  if (health >= 75) return "text-emerald-400";
  if (health >= 50) return "text-amber-400";
  return "text-destructive";
}

/**
 * Farmer self-service.
 *
 * `farmer` has been an allowed portal role since the shell was written, and
 * the access-request form offers "Farmer / Cooperative" — but the portal had
 * a My tenancy page for clients, My investments for investors and Driver
 * tasks for drivers, and nothing for farmers. A farmer could be granted the
 * role, sign in, and find no page addressed to them.
 *
 * Mirrors the other self-service pages: staff and admins can open it to see
 * exactly what a farmer sees, and it explains itself when the signed-in
 * account isn't linked to a farmer record.
 */
function MyFarmPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-farmer-profile"],
    queryFn: async () => getMyFarmerProfile({ headers: await authHeaders() }),
  });

  if (error) return <QueryError error={error} />;
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading your farm…</div>;

  if (!data) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Sprout}
          title="No farmer profile linked to your account"
          description="If you farm with UIG AgriTech, ask your cooperative lead or field officer to link this email address to your farmer record. Your fields, yields and alerts will appear here once they do."
        />
      </div>
    );
  }

  const { farmer, fields, predictions, alerts } = data;

  const openAlerts = alerts.filter((a) => !a.acknowledged);
  const totalHectares = fields.reduce((s, f) => s + Number(f.hectares ?? 0), 0);
  const avgHealth = fields.length
    ? Math.round(fields.reduce((s, f) => s + Number(f.health ?? 0), 0) / fields.length)
    : 0;

  // The most recent prediction per field is the one worth acting on; older
  // rows for the same field are previous seasons.
  const latestByField = new Map<string, (typeof predictions)[number]>();
  for (const p of predictions) if (!latestByField.has(p.field_id)) latestByField.set(p.field_id, p);
  const projectedTons = Array.from(latestByField.values()).reduce(
    (s, p) => s + Number(p.predicted_yield_tons ?? 0),
    0,
  );

  const fieldName = new Map(fields.map((f) => [f.id, f.name]));

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wider text-gold">My farm</p>
        <h1 className="mt-2 text-3xl font-bold">{farmer.full_name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {farmer.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {farmer.location}
            </span>
          )}
          {farmer.cooperative && <span>Cooperative: {farmer.cooperative}</span>}
          {farmer.primary_crop && <span>Primary crop: {farmer.primary_crop}</span>}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Leaf} label="Fields" value={fields.length} />
        <KpiStat icon={Ruler} label="Hectares" value={totalHectares.toLocaleString()} />
        <KpiStat
          icon={TrendingUp}
          label="Projected yield"
          value={projectedTons > 0 ? `${projectedTons.toFixed(1)}t` : "—"}
          hint={latestByField.size > 0 ? `across ${latestByField.size} fields` : undefined}
        />
        <KpiStat
          icon={Bell}
          label="Open alerts"
          value={openAlerts.length}
          hint={fields.length > 0 ? `average health ${avgHealth}%` : undefined}
        />
      </div>

      {openAlerts.length > 0 && (
        <DataPanel title={`Needs your attention (${openAlerts.length})`}>
          <ul className="divide-y divide-border">
            {openAlerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3">
                <AlertTriangle
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    a.severity === "high" ? "text-destructive" : "text-amber-400",
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{a.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {fieldName.get(a.field_id) ?? "Field"} ·{" "}
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                    SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.low,
                  )}
                >
                  {a.severity}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Alerts are raised and cleared by your UIG field officer — contact them if something here
            looks wrong.
          </p>
        </DataPanel>
      )}

      <DataPanel title={`Your fields (${fields.length})`}>
        {fields.length === 0 ? (
          <EmptyState
            icon={Leaf}
            title="No fields registered yet"
            description="Your field officer registers each plot against your farmer record."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const prediction = latestByField.get(f.id);
              return (
                <div key={f.id} className="rounded-xl border border-border bg-surface/60 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{f.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {f.crop ?? "Crop not set"} · {Number(f.hectares ?? 0)} ha
                      </p>
                    </div>
                    <StatusBadge status={f.status} />
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Health</span>
                      <span className={cn("font-semibold tabular-nums", healthTone(f.health))}>
                        {f.health}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          f.health >= 75
                            ? "bg-emerald-400"
                            : f.health >= 50
                              ? "bg-amber-400"
                              : "bg-destructive",
                        )}
                        style={{ width: `${Math.max(0, Math.min(100, f.health))}%` }}
                      />
                    </div>
                  </div>

                  {prediction && (
                    <div className="mt-4 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-gold">
                        {prediction.season} forecast
                      </div>
                      <div className="mt-0.5 text-sm">
                        <span className="font-semibold">
                          {Number(prediction.predicted_yield_tons).toFixed(1)}t
                        </span>{" "}
                        <span className="text-xs text-muted-foreground">
                          · {Math.round(Number(prediction.confidence) * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DataPanel>

      {predictions.length > latestByField.size && (
        <DataPanel title="Previous forecasts">
          <ul className="divide-y divide-border">
            {predictions
              .filter((p) => latestByField.get(p.field_id)?.id !== p.id)
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="truncate">
                    {fieldName.get(p.field_id) ?? "Field"}{" "}
                    <span className="text-xs text-muted-foreground">· {p.season}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {Number(p.predicted_yield_tons).toFixed(1)}t ·{" "}
                    {Math.round(Number(p.confidence) * 100)}%
                  </span>
                </li>
              ))}
          </ul>
        </DataPanel>
      )}
    </div>
  );
}
