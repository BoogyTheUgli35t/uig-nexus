import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radio, Droplets, Thermometer, Wind, ArrowRight } from "lucide-react";
import { getAgriWorkspace } from "@/lib/agritech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { KpiStat, DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/divisions/agritech/sensors")({
  head: () => ({ meta: [{ title: "Sensors — UIG AgriTech" }] }),
  component: SensorsPage,
});

function freshness(recordedAt: string) {
  const mins = Math.round((Date.now() - new Date(recordedAt).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / (60 * 24))}d ago`;
}

function SensorsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["agri-workspace"],
    queryFn: async () => getAgriWorkspace({ headers: await authHeaders() }),
  });

  const fields = data?.fields ?? [];
  const readings = data?.latestReadings ?? [];
  const fieldById = new Map(fields.map((f) => [f.id, f]));
  const reporting = readings.length;
  const silent = fields.length - reporting;

  const avg = (key: "soil_moisture" | "temperature" | "humidity") =>
    readings.length
      ? Math.round((readings.reduce((s, r) => s + Number(r[key] ?? 0), 0) / readings.length) * 10) /
        10
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          icon={Radio}
          label="Fields reporting"
          value={isLoading ? "—" : reporting}
          hint={`${silent} silent`}
        />
        <KpiStat
          icon={Droplets}
          label="Avg soil moisture"
          value={isLoading ? "—" : `${avg("soil_moisture")}%`}
          hint="latest readings"
        />
        <KpiStat
          icon={Thermometer}
          label="Avg temperature"
          value={isLoading ? "—" : `${avg("temperature")}°C`}
          hint="latest readings"
        />
        <KpiStat
          icon={Wind}
          label="Avg humidity"
          value={isLoading ? "—" : `${avg("humidity")}%`}
          hint="latest readings"
        />
      </div>

      <DataPanel title="Sensor network — latest reading per field">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading sensor network…</div>
        ) : readings.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No sensor readings yet"
            description="Readings appear here as devices report from the fields."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Field</th>
                  <th className="py-2 pr-4 font-medium">Crop</th>
                  <th className="py-2 pr-4 font-medium">Soil moisture</th>
                  <th className="py-2 pr-4 font-medium">Temp</th>
                  <th className="py-2 pr-4 font-medium">Humidity</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Reported</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => {
                  const field = fieldById.get(r.field_id);
                  return (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-4 font-medium">{field?.name ?? "—"}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{field?.crop ?? "—"}</td>
                      <td className="py-2.5 pr-4">{Number(r.soil_moisture).toFixed(1)}%</td>
                      <td className="py-2.5 pr-4">{Number(r.temperature).toFixed(1)}°C</td>
                      <td className="py-2.5 pr-4">{Number(r.humidity).toFixed(1)}%</td>
                      <td className="py-2.5 pr-4">
                        {field ? <StatusBadge status={field.status} /> : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                        {freshness(r.recorded_at)}
                      </td>
                      <td className="py-2.5 text-right">
                        {field && (
                          <Link
                            to="/portal/divisions/agritech/fields/$id"
                            params={{ id: field.id }}
                            className="inline-flex items-center gap-1 text-xs acc-text hover:underline"
                          >
                            Field <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          Device registration is managed per field — open a field and add readings/imagery there.
          Full device provisioning (register hardware, assign to field) ships with the IoT gateway
          integration.
        </p>
      </DataPanel>
    </div>
  );
}
