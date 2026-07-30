import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Wallet, PieChart, Percent } from "lucide-react";
import { getMyInvestorProfile } from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { KpiStat, DataPanel, EmptyState } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/my-investments")({
  head: () => ({
    meta: [{ title: "My investments — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: MyInvestmentsPage,
});

const naira = (n: number) => {
  const v = Number(n ?? 0);
  if (v >= 1_000_000_000) return `₦${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  return `₦${v.toLocaleString()}`;
};

function MyInvestmentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-investor-profile"],
    queryFn: async () => getMyInvestorProfile({ headers: await authHeaders() }),
  });

  if (error) return <div className="text-sm text-destructive">{(error as Error).message}</div>;
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading your portfolio…</div>;

  if (!data) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={TrendingUp}
          title="No investor profile linked to your account"
          description="If you invest with UIG Real Estate, ask your relationship manager to link this email address to your investor record. Your portfolio will appear here once they do."
        />
      </div>
    );
  }

  const invested = Number(data.amount_invested ?? 0);
  const value = Number(data.portfolio_value ?? 0);
  const gain = value - invested;
  const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

  const chartData = [
    { label: "Invested", amount: invested },
    { label: "Current value", amount: value },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wider text-gold">My investments</p>
        <h1 className="mt-2 text-3xl font-bold">{data.full_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your position with UIG Real Estate, as recorded by your relationship manager.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Wallet} label="Total invested" value={naira(invested)} />
        <KpiStat icon={PieChart} label="Portfolio value" value={naira(value)} />
        <KpiStat
          icon={TrendingUp}
          label="Gain / loss"
          value={`${gain >= 0 ? "+" : ""}${naira(Math.abs(gain)).replace("₦", gain < 0 ? "-₦" : "₦")}`}
          hint={invested > 0 ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%` : undefined}
        />
        <KpiStat
          icon={Percent}
          label="Expected ROI"
          value={data.expected_roi ? `${Number(data.expected_roi).toFixed(1)}%` : "—"}
          hint="as agreed"
        />
      </div>

      <DataPanel title="Invested vs current value">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="var(--muted-foreground)"
                tickFormatter={(v) => naira(Number(v))}
                width={70}
              />
              <Tooltip
                formatter={(v) => naira(Number(v))}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="amount" fill="var(--acc)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataPanel>

      <DataPanel title="Your details">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="mt-0.5 font-medium">{data.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Phone</dt>
            <dd className="mt-0.5 font-medium">{data.phone ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-4 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          Figures are maintained by your UIG relationship manager and reflect the last recorded
          valuation — they are not a live market price, and nothing here is investment advice.
          Raise any discrepancy with your manager.
        </p>
      </DataPanel>
    </div>
  );
}
