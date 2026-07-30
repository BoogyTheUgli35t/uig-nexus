import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  Sprout,
  Building2,
  Truck,
  BrainCircuit,
  FlaskConical,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { getDivisionDataCounts, ensureDivisionAccess } from "@/lib/admin-seed.functions";
import { seedTechnologyData } from "@/lib/technology.seed";
import { seedRealEstateData } from "@/lib/realestate.seed";
import { seedAgriTechData } from "@/lib/agritech.seed";
import { seedLogisticsData } from "@/lib/logistics.seed";
import { seedIntelligenceData } from "@/lib/intelligence.seed";
import { seedInnovationData } from "@/lib/innovation.seed";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, KpiStat } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_apex/portal/admin/data")({
  head: () => ({
    meta: [{ title: "Division data — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminDataPage,
});

const DIVISIONS = [
  {
    slug: "technology",
    label: "UIG Technology",
    icon: Cpu,
    to: "/portal/divisions/technology" as const,
    seed: seedTechnologyData,
    blurb: "Client projects, tasks, integrations and deployments.",
  },
  {
    slug: "real-estate",
    label: "UIG Real Estate",
    icon: Building2,
    to: "/portal/divisions/real-estate" as const,
    seed: seedRealEstateData,
    blurb: "Nigerian property portfolio with units, tenants, investors and a live CRM pipeline.",
  },
  {
    slug: "agritech",
    label: "UIG AgriTech",
    icon: Sprout,
    to: "/portal/divisions/agritech" as const,
    seed: seedAgriTechData,
    blurb: "Farmers, fields, sensor readings, yield forecasts and field alerts.",
  },
  {
    slug: "logistics",
    label: "UIG Logistics",
    icon: Truck,
    to: "/portal/divisions/logistics" as const,
    seed: seedLogisticsData,
    blurb: "Shipments, drivers, fleet vehicles and routed deliveries.",
  },
  {
    slug: "intelligence",
    label: "UIG Intelligence",
    icon: BrainCircuit,
    to: "/portal/divisions/intelligence" as const,
    seed: seedIntelligenceData,
    blurb: "Datasets, models across the lifecycle, and prediction history.",
  },
  {
    slug: "innovation-lab",
    label: "UIG Innovation Lab",
    icon: FlaskConical,
    to: "/portal/divisions/innovation-lab" as const,
    seed: seedInnovationData,
    blurb: "Ideas, prototypes, ecosystem partners and experiment logs.",
  },
] as const;

function AdminDataPage() {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-division-data"],
    queryFn: async () => getDivisionDataCounts({ headers: await authHeaders() }),
  });

  const seedMut = useMutation({
    mutationFn: async (division: (typeof DIVISIONS)[number]) => {
      const headers = await authHeaders();
      // Grant the acting admin access first, so seeded records land in a
      // workspace they can actually open afterwards.
      await ensureDivisionAccess({ data: { division_slug: division.slug }, headers });
      return division.seed({ headers: await authHeaders() });
    },
    onMutate: (division) => setSeeding(division.slug),
    onSuccess: (_r, division) => {
      toast.success(`${division.label} sample data seeded`);
      qc.invalidateQueries({ queryKey: ["admin-division-data"] });
      qc.invalidateQueries({ queryKey: ["my-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setSeeding(null),
  });

  if (error) return <div className="text-sm text-destructive">{(error as Error).message}</div>;

  const totals = data ? Object.values(data).reduce((s, d) => s + d.total, 0) : 0;
  const populated = data ? Object.values(data).filter((d) => d.total > 0).length : 0;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wider text-gold">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Division data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record counts across every division, and one-click sample data for workspaces that are
          still empty.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat
          icon={Database}
          label="Records platform-wide"
          value={isLoading ? "—" : totals.toLocaleString()}
        />
        <KpiStat
          icon={Building2}
          label="Divisions populated"
          value={isLoading ? "—" : `${populated}/6`}
        />
        <KpiStat
          icon={Sprout}
          label="Empty workspaces"
          value={isLoading ? "—" : 6 - populated}
          hint={populated < 6 ? "Seed below" : "All populated"}
        />
      </div>

      <div className="space-y-4">
        {DIVISIONS.map((d) => {
          const stats = data?.[d.slug];
          const isEmpty = (stats?.total ?? 0) === 0;
          return (
            <div key={d.slug} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <d.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      {d.label}
                      {!isLoading && (
                        <span
                          className={
                            isEmpty
                              ? "rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                              : "rounded-full bg-gold/10 px-2 py-0.5 text-[10px] text-gold"
                          }
                        >
                          {isEmpty ? "Empty" : `${stats?.total.toLocaleString()} records`}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{d.blurb}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={d.to}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={seedMut.isPending}
                    onClick={() => seedMut.mutate(d)}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    {seeding === d.slug ? "Seeding…" : "Seed"}
                  </Button>
                </div>
              </div>

              {stats && stats.total > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                  {Object.entries(stats.tables).map(([table, count]) => (
                    <span
                      key={table}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {table.replace(/_/g, " ")}:{" "}
                      <span className="font-medium text-foreground">{count.toLocaleString()}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <DataPanel title="How seeding behaves">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            · Seeders only insert into a division that is already empty, so pressing Seed twice
            never duplicates records.
          </li>
          <li>
            · Seeded records are owned by the admin who runs the seed; you're granted access to that
            division automatically so the workspace opens straight away.
          </li>
          <li>
            · Sample data is realistic Nigerian operating data — use it for demos and onboarding,
            and clear it before a division goes live with real customers.
          </li>
        </ul>
      </DataPanel>
    </div>
  );
}
