import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Lock,
  Plus,
  Users,
  MapPinned,
  Sprout,
  Activity,
  Droplets,
  Thermometer,
  CloudSun,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { getDivision } from "@/lib/divisions";
import { getMyWorkspace } from "@/lib/divisions.functions";
import {
  getAgriWorkspace,
  onboardFarmer,
  updateFieldStatus,
  FIELD_STATUSES,
} from "@/lib/agritech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { HeroBanner, KpiStat, DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_apex/portal/divisions/agritech")({
  head: () => ({ meta: [{ title: "UIG AgriTech — Workspace" }, { name: "robots", content: "noindex" }] }),
  component: AgriTechWorkspace,
});

const STATUS_BADGE: Record<string, string> = {
  healthy: "healthy",
  at_risk: "at_risk",
  critical: "critical",
};

function AgriTechWorkspace() {
  const division = getDivision("agritech")!;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [crop, setCrop] = useState("");
  const [hectares, setHectares] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const ws = await getMyWorkspace({ headers: await authHeaders() });
        setHasAccess(ws.isAdmin || ws.divisionSlugs.includes("agritech"));
      } catch {
        setHasAccess(false);
      }
    })();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["agri-workspace"],
    enabled: hasAccess === true,
    queryFn: async () => getAgriWorkspace({ headers: await authHeaders() }),
  });

  const onboardMut = useMutation({
    mutationFn: async () =>
      onboardFarmer({
        data: { full_name: name, location, primary_crop: crop, hectares: Number(hectares) || 0 },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Farmer onboarded");
      setName("");
      setLocation("");
      setCrop("");
      setHectares("");
      qc.invalidateQueries({ queryKey: ["agri-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fieldMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof FIELD_STATUSES)[number] }) =>
      updateFieldStatus({ data: v, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agri-workspace"] }),
    onError: (e: Error) => toast.error(e.message),
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

  const yieldBySeason = useMemo(() => {
    const m = new Map<string, number>();
    (data?.predictions ?? []).forEach((p) => {
      m.set(p.season, (m.get(p.season) ?? 0) + Number(p.predicted_yield_tons));
    });
    return Array.from(m.entries()).map(([season, tons]) => ({
      season,
      tons: Math.round(tons * 10) / 10,
    }));
  }, [data]);

  if (hasAccess === null) return <div className="text-muted-foreground">Loading workspace…</div>;

  if (!hasAccess) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Lock}
          title="No access to UIG AgriTech"
          description="You don't have access to this division workspace yet. Request access from an administrator."
        />
        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate({ to: "/portal/dashboard" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className={`space-y-8 ${division.accentClass}`}>
      <Link to="/portal/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <HeroBanner
        division={division}
        eyebrow={division.short}
        title={division.name}
        subtitle="Onboard farmers, monitor fields with live sensor data and forecast yields across the network."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Users} label="Farmers" value={stats?.farmers ?? "—"} />
        <KpiStat icon={MapPinned} label="Fields monitored" value={stats?.fields ?? "—"} />
        <KpiStat icon={Sprout} label="Hectares" value={stats?.totalHectares ?? "—"} />
        <KpiStat icon={Activity} label="Avg. field health" value={stats ? `${stats.avgHealth}%` : "—"} hint={`${stats?.atRiskFields ?? 0} need attention`} />
      </div>

      {/* Farmer onboarding */}
      <DataPanel title="Farmer onboarding">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onboardMut.mutate();
          }}
        >
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
          <Input placeholder="Location (state)" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={150} />
          <Input placeholder="Primary crop" value={crop} onChange={(e) => setCrop(e.target.value)} maxLength={100} />
          <Input type="number" min={0} placeholder="Hectares" value={hectares} onChange={(e) => setHectares(e.target.value)} />
          <Button type="submit" disabled={!name.trim() || onboardMut.isPending} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Onboard
          </Button>
        </form>
      </DataPanel>

      {/* Yield forecast chart */}
      <DataPanel title="AI yield forecast (tonnes by season)">
        {yieldBySeason.length === 0 ? (
          <EmptyState icon={CloudSun} title="No predictions yet" />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldBySeason} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="season" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="tons" radius={[6, 6, 0, 0]} fill="var(--acc, hsl(var(--gold)))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DataPanel>

      {/* Field dashboard */}
      <div>
        <h2 className="text-lg font-semibold">Field dashboard</h2>
        <p className="text-sm text-muted-foreground">Live sensor readings and crop health per field.</p>
        {isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading fields…</div>
        ) : (data?.fields.length ?? 0) === 0 ? (
          <div className="mt-4">
            <EmptyState icon={MapPinned} title="No fields yet" description="Onboard a farmer to begin monitoring." />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.fields ?? []).map((f) => {
              const r = readingByField.get(f.id);
              return (
                <div key={f.id} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium leading-snug">{f.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {farmerName.get(f.farmer_id) ?? "—"} · {f.hectares} ha
                      </div>
                    </div>
                    <StatusBadge status={STATUS_BADGE[f.status] ?? f.status} />
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

                  <div className="mt-4 flex flex-wrap gap-1">
                    {FIELD_STATUSES.filter((s) => s !== f.status).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => fieldMut.mutate({ id: f.id, status: s })}
                        className="rounded border border-border px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground transition hover:acc-border-soft hover:text-foreground"
                      >
                        {s.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
