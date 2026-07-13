import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Rocket } from "lucide-react";
import { getClientProjects } from "@/lib/tech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_apex/portal/divisions/technology/clients/$name")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: ClientView,
});

/**
 * Read-only, aggregated project status for a given client. Still requires a portal
 * login (there's no public magic-link / token-based client portal wired up — that
 * would need real auth infrastructure this build doesn't have) but shows only the
 * client-safe fields: no internal notes, no budget, no invoices.
 */
function ClientView() {
  const { name } = Route.useParams();
  const clientName = name;

  const { data, isLoading } = useQuery({
    queryKey: ["tech-client-projects", clientName],
    queryFn: async () =>
      getClientProjects({ headers: await authHeaders(), data: { client_name: clientName } }),
  });

  return (
    <div className="space-y-8">
      <Link
        to="/portal/divisions/technology/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{clientName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Client project status (read-only).</p>
      </div>

      <DataPanel title="Projects">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.projects.length === 0 ? (
          <EmptyState icon={Building2} title="No projects found for this client" />
        ) : (
          <div className="space-y-4">
            {data.projects.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-sm">{p.title}</div>
                  <StatusBadge status={p.status} />
                </div>
                <Progress value={p.progress} className="mt-3 h-1.5" />
                {p.due_date && (
                  <div className="mt-2 text-xs text-muted-foreground">Target date: {p.due_date}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      <DataPanel title="Latest production releases">
        {!data || data.deployments.length === 0 ? (
          <EmptyState icon={Rocket} title="No production releases yet" />
        ) : (
          <div className="divide-y divide-border">
            {data.deployments.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-mono">{d.version}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
