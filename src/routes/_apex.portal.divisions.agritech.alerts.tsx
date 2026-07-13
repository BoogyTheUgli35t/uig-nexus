import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getAgriWorkspace, acknowledgeAlert } from "@/lib/agritech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_apex/portal/divisions/agritech/alerts")({
  component: AlertsPage,
});

const SEVERITY_STYLE: Record<string, string> = {
  high: "border-destructive/30 bg-destructive/5 text-destructive",
  medium: "border-gold/30 bg-gold/5 text-gold",
  low: "border-border bg-background text-muted-foreground",
};

function AlertsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["agri-workspace"],
    queryFn: async () => getAgriWorkspace({ headers: await authHeaders() }),
  });

  const ackMut = useMutation({
    mutationFn: async (id: string) => acknowledgeAlert({ data: { id }, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agri-workspace"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const fieldName = new Map((data?.fields ?? []).map((f) => [f.id, f.name]));
  const open = (data?.alerts ?? []).filter((a) => !a.acknowledged);
  const resolved = (data?.alerts ?? []).filter((a) => a.acknowledged);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Field alerts</h2>
        <p className="text-sm text-muted-foreground">
          Raised automatically whenever a field is marked at-risk or critical.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <DataPanel title={`Open (${open.length})`}>
            {open.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No open alerts" description="All fields are healthy." />
            ) : (
              <div className="space-y-2">
                {open.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${SEVERITY_STYLE[a.severity] ?? ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <div>{a.message}</div>
                        <Link
                          to="/portal/divisions/agritech/fields/$id"
                          params={{ id: a.field_id }}
                          className="text-[11px] underline opacity-80"
                        >
                          {fieldName.get(a.field_id) ?? "View field"}
                        </Link>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => ackMut.mutate(a.id)} disabled={ackMut.isPending}>
                      Acknowledge
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </DataPanel>

          {resolved.length > 0 && (
            <DataPanel title={`Resolved (${resolved.length})`}>
              <div className="divide-y divide-border">
                {resolved.slice(0, 10).map((a) => (
                  <div key={a.id} className="py-2 text-sm text-muted-foreground">
                    {a.message}
                  </div>
                ))}
              </div>
            </DataPanel>
          )}
        </>
      )}
    </div>
  );
}
