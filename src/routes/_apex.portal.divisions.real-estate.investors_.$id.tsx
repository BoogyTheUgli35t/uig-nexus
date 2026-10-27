import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Banknote,
  Mail,
  Pencil,
  Percent,
  Phone,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";
import { getInvestorDetail, updateInvestor } from "@/lib/realestate-crud.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, KpiStat, QueryError } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/investors_/$id")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: InvestorDetailPage,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

const exact = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;

/**
 * One investor's page.
 *
 * Real Estate had four detail routes — properties, units, tenants, leads —
 * and investors was the only core entity without one, so the figures that
 * matter most to a relationship manager could only be changed in the database
 * by hand.
 */
function InvestorDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["realestate-investor", id],
    queryFn: async () => getInvestorDetail({ headers: await authHeaders(), data: { id } }),
  });

  const onSaved = () => {
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["realestate-investor", id] });
    // The investor list and the division KPIs both read these figures.
    qc.invalidateQueries({ queryKey: ["realestate-workspace"] });
  };

  if (error) return <QueryError error={error} onRetry={() => refetch()} label="this investor" />;
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading investor…</div>;
  if (!data) return <EmptyState icon={Wallet} title="Investor not found" />;

  const { investor } = data;
  const invested = Number(investor.amount_invested ?? 0);
  const value = Number(investor.portfolio_value ?? 0);
  const gain = value - invested;
  const gainPct = invested > 0 ? (gain / invested) * 100 : null;

  return (
    <div className="space-y-8">
      <Link
        to="/portal/divisions/real-estate/investors"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Investors
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{investor.full_name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {investor.email && (
              <a
                href={`mailto:${investor.email}`}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" /> {investor.email}
              </a>
            )}
            {investor.phone && (
              <a
                href={`tel:${investor.phone}`}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" /> {investor.phone}
              </a>
            )}
            <span className="inline-flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5" />
              {investor.user_id ? "Portal account linked" : "No portal account linked"}
            </span>
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> {editing ? "Cancel" : "Edit investor"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          icon={Banknote}
          label="Amount invested"
          value={naira(invested)}
          hint={exact(invested)}
        />
        <KpiStat icon={Wallet} label="Portfolio value" value={naira(value)} hint={exact(value)} />
        <KpiStat
          icon={TrendingUp}
          label={gain >= 0 ? "Unrealised gain" : "Unrealised loss"}
          value={
            <span className={cn(gain >= 0 ? "text-emerald-400" : "text-destructive")}>
              {gain >= 0 ? "+" : "−"}
              {naira(Math.abs(gain))}
            </span>
          }
          hint={
            gainPct !== null
              ? `${gainPct >= 0 ? "+" : "−"}${Math.abs(gainPct).toFixed(1)}%`
              : undefined
          }
        />
        <KpiStat
          icon={Percent}
          label="Expected ROI"
          value={`${Number(investor.expected_roi ?? 0)}%`}
          hint="target, per annum"
        />
      </div>

      {editing && <InvestorEditForm investor={investor} onDone={onSaved} />}

      {!investor.user_id && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-5">
          <h3 className="font-semibold">This investor can&rsquo;t see their own portfolio yet.</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Link a UIG portal account to this record and they get the My investments view — their
            figures, live, without asking their relationship manager for a statement.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link to="/portal/divisions/real-estate/investors">Link an account</Link>
          </Button>
        </div>
      )}

      <DataPanel title="Record">
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
            <dt className="text-muted-foreground">Added</dt>
            <dd>{new Date(investor.created_at).toLocaleDateString()}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
            <dt className="text-muted-foreground">Last updated</dt>
            <dd>{new Date(investor.updated_at).toLocaleDateString()}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Portfolio value is entered by the relationship manager — there is no automatic valuation
          feed in this build, so it is as current as the last person who updated it.
        </p>
      </DataPanel>
    </div>
  );
}

function InvestorEditForm({
  investor,
  onDone,
}: {
  investor: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    amount_invested: number;
    portfolio_value: number;
    expected_roi: number;
  };
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    full_name: investor.full_name,
    email: investor.email ?? "",
    phone: investor.phone ?? "",
    amount_invested: Number(investor.amount_invested ?? 0),
    portfolio_value: Number(investor.portfolio_value ?? 0),
    expected_roi: Number(investor.expected_roi ?? 0),
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const saveMut = useMutation({
    mutationFn: async () =>
      updateInvestor({
        data: { id: investor.id, ...form, full_name: form.full_name.trim() },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Investor updated");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <form
      className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (form.full_name.trim()) saveMut.mutate();
      }}
    >
      <div className="space-y-1.5 sm:col-span-3">
        <Label htmlFor="inv-name">Full name</Label>
        <Input
          id="inv-name"
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          maxLength={150}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-email">Email</Label>
        <Input
          id="inv-email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          maxLength={180}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-phone">Phone</Label>
        <Input
          id="inv-phone"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          maxLength={40}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-roi">Expected ROI (%)</Label>
        <Input
          id="inv-roi"
          type="number"
          step="0.1"
          value={form.expected_roi}
          onChange={(e) => set("expected_roi", num(e.target.value))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-invested">Amount invested (₦)</Label>
        <Input
          id="inv-invested"
          type="number"
          min={0}
          value={form.amount_invested}
          onChange={(e) => set("amount_invested", num(e.target.value))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-value">Portfolio value (₦)</Label>
        <Input
          id="inv-value"
          type="number"
          min={0}
          value={form.portfolio_value}
          onChange={(e) => set("portfolio_value", num(e.target.value))}
        />
      </div>
      <div className="flex items-end justify-end">
        <Button type="submit" disabled={!form.full_name.trim() || saveMut.isPending}>
          {saveMut.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
