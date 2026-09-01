import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TrendingUp, Wallet, Link2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getRealEstateWorkspace, linkInvestorAccount } from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, KpiStat } from "@/components/portal/blocks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/investors")({
  component: InvestorsPage,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

function InvestorsPage() {
  const qc = useQueryClient();
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-workspace"],
    queryFn: async () => getRealEstateWorkspace({ headers: await authHeaders() }),
  });

  const linkMut = useMutation({
    mutationFn: async (v: { investor_id: string; email: string }) =>
      linkInvestorAccount({ data: v, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Portal account linked — they'll see their portfolio on next sign-in.");
      setLinkingId(null);
      setLinkEmail("");
      qc.invalidateQueries({ queryKey: ["realestate-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const investors = data?.investors ?? [];
  const chartData = investors.map((i) => ({
    name: i.full_name.split(" ")[0],
    invested: Number(i.amount_invested),
    value: Number(i.portfolio_value),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Investor ROI dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Portfolio value, gains and expected returns.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat
          icon={Wallet}
          label="Total invested"
          value={data ? naira(data.stats.invested) : "—"}
        />
        <KpiStat
          icon={TrendingUp}
          label="Portfolio value"
          value={data ? naira(data.stats.investorValue) : "—"}
          hint={data ? `+${naira(data.stats.investorGain)} gains` : undefined}
        />
        <KpiStat
          icon={TrendingUp}
          label="Avg. expected ROI"
          value={data ? `${data.stats.avgRoi}%` : "—"}
        />
      </div>

      <DataPanel title="Invested vs. current value">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : investors.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No investors yet" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => naira(Number(v))}
                />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--muted) 30%, transparent)" }}
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => naira(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="invested"
                  name="Invested"
                  radius={[6, 6, 0, 0]}
                  fill="var(--muted-foreground)"
                />
                <Bar
                  dataKey="value"
                  name="Current value"
                  radius={[6, 6, 0, 0]}
                  fill="var(--acc, var(--gold))"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DataPanel>

      <DataPanel title="Investors">
        {investors.length === 0 ? (
          <EmptyState icon={Wallet} title="No investors yet" />
        ) : (
          <div className="space-y-3">
            {investors.map((i) => {
              const gain = Number(i.portfolio_value) - Number(i.amount_invested);
              return (
                <div key={i.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{i.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Invested {naira(Number(i.amount_invested))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-medium acc-text">
                        {Number(i.expected_roi)}% ROI
                      </div>
                      <div className="text-xs text-emerald-400">+{naira(gain)}</div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
                    {i.user_id ? (
                      <span className="text-[11px] text-muted-foreground">
                        Portal account linked
                      </span>
                    ) : linkingId === i.id ? (
                      <div className="flex flex-1 items-center gap-1.5">
                        <Input
                          autoFocus
                          type="email"
                          value={linkEmail}
                          onChange={(e) => setLinkEmail(e.target.value)}
                          placeholder="their portal email"
                          className="h-7 text-xs"
                        />
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={!linkEmail.trim() || linkMut.isPending}
                          onClick={() =>
                            linkMut.mutate({ investor_id: i.id, email: linkEmail.trim() })
                          }
                        >
                          Link
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setLinkingId(i.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <Link2 className="h-3 w-3" /> Link to a portal account
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
