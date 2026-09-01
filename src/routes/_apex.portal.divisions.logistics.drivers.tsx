import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Star, PackageCheck, Link2, AlertTriangle } from "lucide-react";
import { getLogisticsWorkspace, linkDriverAccount } from "@/lib/logistics.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/logistics/drivers")({
  component: DriversPage,
});

const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

function DriversPage() {
  const qc = useQueryClient();
  const [linking, setLinking] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["logistics-workspace"],
    queryFn: async () => getLogisticsWorkspace({ headers: await authHeaders() }),
  });

  const linkMut = useMutation({
    mutationFn: async (driverId: string) =>
      linkDriverAccount({ data: { driver_id: driverId, email }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Driver linked to portal account");
      setLinking(null);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["logistics-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Driver directory</h2>
        <p className="text-sm text-muted-foreground">
          Link a driver record to a portal login (by email) to unlock their "My deliveries" mobile
          task view.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (data?.drivers.length ?? 0) === 0 ? (
        <EmptyState icon={Users} title="No drivers yet" />
      ) : (
        <DataPanel title="Drivers">
          <div className="divide-y divide-border">
            {(data?.drivers ?? []).map((d) => {
              const licenseSoon = d.license_expiry && new Date(d.license_expiry) <= in30;
              return (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{d.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {d.phone ?? "—"} · {d.deliveries_completed.toLocaleString()} deliveries
                    </div>
                    {licenseSoon && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-destructive">
                        <AlertTriangle className="h-3 w-3" /> License expires {d.license_expiry}
                      </div>
                    )}
                    {!d.user_id && linking === d.id && (
                      <form
                        className="mt-2 flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (email.trim()) linkMut.mutate(d.id);
                        }}
                      >
                        <Input
                          type="email"
                          placeholder="driver@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-8 max-w-[220px] text-xs"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8"
                          disabled={linkMut.isPending}
                        >
                          Link
                        </Button>
                      </form>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="inline-flex items-center gap-1 text-sm font-medium acc-text">
                      <Star className="h-3.5 w-3.5" /> {Number(d.rating).toFixed(1)}
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={d.status} />
                    </div>
                    {d.user_id ? (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <PackageCheck className="h-3 w-3" /> Portal linked
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1.5 h-7 text-[11px]"
                        onClick={() => {
                          setLinking(d.id);
                          setEmail("");
                        }}
                      >
                        <Link2 className="mr-1 h-3 w-3" /> Link account
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DataPanel>
      )}
    </div>
  );
}
