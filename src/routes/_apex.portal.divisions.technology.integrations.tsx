import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plug, Cpu, RefreshCw } from "lucide-react";
import { getTechWorkspace } from "@/lib/tech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_apex/portal/divisions/technology/integrations")({
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tech-workspace"],
    queryFn: async () => getTechWorkspace({ headers: await authHeaders() }),
  });
  const [testing, setTesting] = useState<string | null>(null);

  async function onTestConnection(name: string) {
    setTesting(name);
    // No real connector credentials are configured for any of these providers — this is a
    // clearly-labelled stub rather than a fake "success" response.
    await new Promise((r) => setTimeout(r, 600));
    setTesting(null);
    toast(
      `${name}: no live credentials configured — this is a UI stub, not a real connection test.`,
    );
  }

  const integrations = data?.integrations ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Integration hub</h2>
        <p className="text-sm text-muted-foreground">
          {integrations.length} connector{integrations.length === 1 ? "" : "s"} on file.
        </p>
      </div>

      <DataPanel title="Connectors">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : integrations.length === 0 ? (
          <EmptyState icon={Plug} title="No integrations" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg acc-bg-soft acc-text">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.last_sync
                        ? `Synced ${new Date(i.last_sync).toLocaleString()}`
                        : "Never synced"}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={i.status} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-auto px-2 py-1 text-[10px]"
                    disabled={testing === i.name}
                    onClick={() => onTestConnection(i.name)}
                  >
                    <RefreshCw
                      className={`mr-1 h-3 w-3 ${testing === i.name ? "animate-spin" : ""}`}
                    />
                    Test connection
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
