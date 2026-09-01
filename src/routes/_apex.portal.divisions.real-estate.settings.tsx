import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, Palette, FileText, Building2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getRealEstateWorkspace } from "@/lib/realestate.functions";
import { seedRealEstateData } from "@/lib/realestate.seed";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, KpiStat } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/settings")({
  head: () => ({ meta: [{ title: "Settings — UIG Real Estate" }] }),
  component: SettingsPage,
});

const LEASE_TEMPLATES = [
  { name: "Residential lease (12 months)", note: "Standard annual tenancy, Lagos/Abuja clauses." },
  {
    name: "Commercial lease (24 months)",
    note: "Grade-A office space with service-charge schedule.",
  },
  { name: "Short-let agreement", note: "Furnished short-stay terms with caution deposit." },
] as const;

function SettingsPage() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["realestate-workspace"],
    queryFn: async () => getRealEstateWorkspace({ headers: await authHeaders() }),
  });

  const seedMut = useMutation({
    mutationFn: async () => seedRealEstateData({ headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Sample data seeded");
      qc.invalidateQueries({ queryKey: ["realestate-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const propertyCount = data?.properties?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiStat
          icon={Building2}
          label="Properties"
          value={propertyCount}
          hint="in the portfolio"
        />
        <KpiStat
          icon={Palette}
          label="Division accent"
          value="Real Estate"
          hint="acc-realestate token"
        />
        <KpiStat
          icon={FileText}
          label="Lease templates"
          value={LEASE_TEMPLATES.length}
          hint="available"
        />
      </div>

      <DataPanel title="Sample data">
        <p className="text-sm text-muted-foreground">
          Seed the workspace with a realistic Nigerian portfolio — properties across Lagos, Abuja
          and Port Harcourt with tenants, leads and pipeline activity. Seeding is idempotent:
          existing records are never duplicated.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => seedMut.mutate()}
          disabled={seedMut.isPending}
        >
          <Database className="mr-2 h-4 w-4" />
          {seedMut.isPending ? "Seeding…" : "Seed sample data"}
        </Button>
      </DataPanel>

      <DataPanel title="Listing gallery">
        <p className="text-sm text-muted-foreground">
          Property photography is managed per listing — covers, ordering and captions live on each
          property's detail page. Public listing pages label AI-generated imagery automatically
          until real photos replace it.
        </p>
        <Link
          to="/portal/divisions/real-estate/properties"
          className="mt-3 inline-flex items-center gap-1 text-sm acc-text hover:underline"
        >
          Manage properties & galleries <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </DataPanel>

      <DataPanel title="Lease templates">
        <div className="space-y-3">
          {LEASE_TEMPLATES.map((t) => (
            <div key={t.name} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{t.note}</div>
                </div>
                <span className="rounded-full acc-bg-soft acc-text px-2 py-0.5 text-[10px]">
                  Template
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          Templates attach to leases from a tenant's unit page. eSign (DocuSign) integration is
          stubbed via the lease signature flow and activates when the connector is configured.
        </p>
      </DataPanel>
    </div>
  );
}
