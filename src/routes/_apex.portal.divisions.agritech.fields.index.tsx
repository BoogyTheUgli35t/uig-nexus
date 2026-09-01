import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPinned, Droplets, Thermometer, CloudSun } from "lucide-react";
import { getAgriWorkspace } from "@/lib/agritech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_apex/portal/divisions/agritech/fields/")({
  component: FieldsPage,
});

function FieldsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["agri-workspace"],
    queryFn: async () => getAgriWorkspace({ headers: await authHeaders() }),
  });

  const farmerName = useMemo(() => {
    const m = new Map<string, string>();
    (data?.farmers ?? []).forEach((f) => m.set(f.id, f.full_name));
    return m;
  }, [data]);

  const readingByField = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>["latestReadings"][number]>();
    (data?.latestReadings ?? []).forEach((r) => m.set(r.field_id, r));
    return m;
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Field dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Live sensor readings and crop health per field.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading fields…</div>
      ) : (data?.fields.length ?? 0) === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No fields yet"
          description="Onboard a farmer to begin monitoring."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.fields ?? []).map((f) => {
            const r = readingByField.get(f.id);
            return (
              <Link
                key={f.id}
                to="/portal/divisions/agritech/fields/$id"
                params={{ id: f.id }}
                className="block rounded-xl border border-border bg-surface p-5 transition hover:acc-border-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium leading-snug">{f.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {farmerName.get(f.farmer_id) ?? "—"} · {f.hectares} ha
                    </div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Crop health</span>
                    <span>{f.health}%</span>
                  </div>
                  <Progress value={f.health} className="mt-1.5 h-1.5" />
                </div>

                {r ? (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-border bg-background p-2">
                      <Droplets className="mx-auto h-4 w-4 acc-text" />
                      <div className="mt-1 text-sm font-medium">{r.soil_moisture}%</div>
                      <div className="text-[10px] text-muted-foreground">Moisture</div>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-2">
                      <Thermometer className="mx-auto h-4 w-4 acc-text" />
                      <div className="mt-1 text-sm font-medium">{r.temperature}°</div>
                      <div className="text-[10px] text-muted-foreground">Temp</div>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-2">
                      <CloudSun className="mx-auto h-4 w-4 acc-text" />
                      <div className="mt-1 text-sm font-medium">{r.humidity}%</div>
                      <div className="text-[10px] text-muted-foreground">Humidity</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-xs text-muted-foreground">No sensor data yet.</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
