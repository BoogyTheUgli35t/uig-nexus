import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Lock,
  Plus,
  Building2,
  Home,
  Wallet,
  TrendingUp,
  BedDouble,
  Bath,
  Ruler,
  Users,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { getDivision } from "@/lib/divisions";
import { getMyWorkspace } from "@/lib/divisions.functions";
import {
  getRealEstateWorkspace,
  addProperty,
  updatePropertyStatus,
  updateLeadStage,
  addLead,
  PROPERTY_STATUSES,
  LEAD_STAGES,
} from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { HeroBanner, KpiStat, DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate")({
  head: () => ({ meta: [{ title: "UIG Real Estate — Workspace" }, { name: "robots", content: "noindex" }] }),
  component: RealEstateWorkspace,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

const LEAD_COLUMNS: { key: (typeof LEAD_STAGES)[number]; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "viewing", label: "Viewing" },
  { key: "negotiation", label: "Negotiation" },
  { key: "closed", label: "Closed" },
];

const PAYMENT_BADGE: Record<string, string> = { current: "active", due: "planning", overdue: "error" };

function RealEstateWorkspace() {
  const division = getDivision("real-estate")!;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");

  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const ws = await getMyWorkspace({ headers: await authHeaders() });
        setHasAccess(ws.isAdmin || ws.divisionSlugs.includes("real-estate"));
      } catch {
        setHasAccess(false);
      }
    })();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-workspace"],
    enabled: hasAccess === true,
    queryFn: async () => getRealEstateWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["realestate-workspace"] });

  const propertyMut = useMutation({
    mutationFn: async () =>
      addProperty({
        data: { title, city, price: Number(price) || 0 },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Property listed");
      setTitle("");
      setCity("");
      setPrice("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof PROPERTY_STATUSES)[number] }) =>
      updatePropertyStatus({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const stageMut = useMutation({
    mutationFn: async (v: { id: string; stage: (typeof LEAD_STAGES)[number] }) =>
      updateLeadStage({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const leadMut = useMutation({
    mutationFn: async () =>
      addLead({ data: { full_name: leadName, phone: leadPhone }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Lead added");
      setLeadName("");
      setLeadPhone("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const propertyTitle = useMemo(() => {
    const m = new Map<string, string>();
    (data?.properties ?? []).forEach((p) => m.set(p.id, p.title));
    return m;
  }, [data]);

  const leadsByStage = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>["leads"]>();
    LEAD_COLUMNS.forEach((c) => m.set(c.key, []));
    (data?.leads ?? []).forEach((l) => {
      if (!m.has(l.stage)) m.set(l.stage, []);
      m.get(l.stage)!.push(l);
    });
    return m;
  }, [data]);

  if (hasAccess === null) return <div className="text-muted-foreground">Loading workspace…</div>;

  if (!hasAccess) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Lock}
          title="No access to UIG Real Estate"
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
        subtitle="Manage the property portfolio, tenants, investor returns and the sales pipeline in one place."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Building2} label="Properties" value={stats?.properties ?? "—"} hint={`${stats?.available ?? 0} available`} />
        <KpiStat icon={Wallet} label="Portfolio value" value={stats ? naira(stats.portfolioValue) : "—"} />
        <KpiStat icon={Home} label="Monthly rent roll" value={stats ? naira(stats.monthlyRent) : "—"} hint={`${stats?.tenants ?? 0} tenants`} />
        <KpiStat icon={TrendingUp} label="Avg. investor ROI" value={stats ? `${stats.avgRoi}%` : "—"} hint={stats ? `${naira(stats.investorGain)} gains` : undefined} />
      </div>

      {/* New listing */}
      <DataPanel title="List a new property">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) propertyMut.mutate();
          }}
        >
          <Input placeholder="Property title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={180} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} />
          <Input type="number" min={0} placeholder="Price (₦)" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Button type="submit" disabled={!title.trim() || propertyMut.isPending}>
            <Plus className="mr-2 h-4 w-4" /> List property
          </Button>
        </form>
      </DataPanel>

      {/* Property listings */}
      <div>
        <h2 className="text-lg font-semibold">Property listings</h2>
        <p className="text-sm text-muted-foreground">The full portfolio with status and smart-building detail.</p>
        {isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading properties…</div>
        ) : (data?.properties.length ?? 0) === 0 ? (
          <div className="mt-4">
            <EmptyState icon={Building2} title="No properties yet" description="List a property to get started." />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.properties ?? []).map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium leading-snug">{p.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground capitalize">
                      {p.property_type.replace(/_/g, " ")}{p.city ? ` · ${p.city}` : ""}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="mt-3 text-xl font-display font-bold acc-text">{naira(Number(p.price))}</div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {p.bedrooms > 0 && (
                    <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {p.bedrooms}</span>
                  )}
                  {p.bathrooms > 0 && (
                    <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {p.bathrooms}</span>
                  )}
                  {p.area_sqm > 0 && (
                    <span className="inline-flex items-center gap-1"><Ruler className="h-3.5 w-3.5" /> {Number(p.area_sqm)} m²</span>
                  )}
                </div>

                {p.description && (
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-1">
                  {PROPERTY_STATUSES.filter((s) => s !== p.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => statusMut.mutate({ id: p.id, status: s })}
                      className="rounded border border-border px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground transition hover:acc-border-soft hover:text-foreground"
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tenant portal + Investor ROI */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataPanel title="Tenant portal">
          {(data?.tenants.length ?? 0) === 0 ? (
            <EmptyState icon={Users} title="No tenants yet" />
          ) : (
            <div className="space-y-3">
              {(data?.tenants ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{t.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {t.property_id ? propertyTitle.get(t.property_id) ?? "—" : "—"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-medium">{naira(Number(t.rent_amount))}/yr</div>
                    <div className="mt-1">
                      <StatusBadge status={PAYMENT_BADGE[t.payment_status] ?? t.payment_status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataPanel>

        <DataPanel title="Investor ROI dashboard">
          {(data?.investors.length ?? 0) === 0 ? (
            <EmptyState icon={TrendingUp} title="No investors yet" />
          ) : (
            <div className="space-y-3">
              {(data?.investors ?? []).map((i) => {
                const gain = Number(i.portfolio_value) - Number(i.amount_invested);
                return (
                  <div key={i.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{i.full_name}</div>
                        <div className="text-xs text-muted-foreground">Invested {naira(Number(i.amount_invested))}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-medium acc-text">{Number(i.expected_roi)}% ROI</div>
                        <div className="text-xs text-emerald-400">+{naira(gain)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DataPanel>
      </div>

      {/* CRM pipeline */}
      <div>
        <h2 className="text-lg font-semibold">CRM pipeline</h2>
        <p className="text-sm text-muted-foreground">Track leads from enquiry to close. {stats?.openLeads ?? 0} open.</p>

        <form
          className="mt-4 flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (leadName.trim()) leadMut.mutate();
          }}
        >
          <Input className="max-w-xs" placeholder="Lead name" value={leadName} onChange={(e) => setLeadName(e.target.value)} maxLength={150} />
          <Input className="max-w-xs" placeholder="Phone" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} maxLength={40} />
          <Button type="submit" disabled={!leadName.trim() || leadMut.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Add lead
          </Button>
        </form>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LEAD_COLUMNS.map((col) => {
            const items = leadsByStage.get(col.key) ?? [];
            return (
              <div key={col.key} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center justify-between px-1 pb-2 text-xs font-medium text-muted-foreground">
                  <span>{col.label}</span>
                  <span>{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border py-4 text-center text-[11px] text-muted-foreground">
                      Empty
                    </div>
                  ) : (
                    items.map((l) => {
                      const nextIdx = LEAD_STAGES.indexOf(l.stage) + 1;
                      const next = nextIdx < LEAD_STAGES.length ? LEAD_STAGES[nextIdx] : null;
                      return (
                        <div key={l.id} className="rounded-lg border border-border bg-background p-3">
                          <div className="text-sm font-medium leading-snug">{l.full_name}</div>
                          {l.property_id && (
                            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                              {propertyTitle.get(l.property_id) ?? "—"}
                            </div>
                          )}
                          <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            {l.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {l.phone}</span>}
                            {l.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {l.email}</span>}
                          </div>
                          {next && next !== "lost" && (
                            <button
                              type="button"
                              onClick={() => stageMut.mutate({ id: l.id, stage: next })}
                              className="mt-2 w-full rounded border border-border px-1.5 py-1 text-[10px] capitalize text-muted-foreground transition hover:acc-border-soft hover:text-foreground"
                            >
                              Move to {next.replace(/_/g, " ")}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
