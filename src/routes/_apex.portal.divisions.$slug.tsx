import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { getDivision } from "@/lib/divisions";
import { getMyWorkspace } from "@/lib/divisions.functions";
import { authHeaders } from "@/lib/auth-headers";
import { HeroBanner, ModuleCard, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_apex/portal/divisions/$slug")({
  head: () => ({ meta: [{ title: "Division — UIG Apex" }, { name: "robots", content: "noindex" }] }),
  component: DivisionWorkspace,
});

function DivisionWorkspace() {
  const { slug } = Route.useParams();
  const division = getDivision(slug);
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const headers = await authHeaders();
        const ws = await getMyWorkspace({ headers });
        setHasAccess(ws.isAdmin || ws.divisionSlugs.includes(slug));
      } catch {
        setHasAccess(false);
      }
    })();
  }, [slug]);

  if (!division) throw notFound();

  if (hasAccess === null) {
    return <div className="text-muted-foreground">Loading workspace…</div>;
  }

  if (!hasAccess) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Lock}
          title={`No access to ${division.name}`}
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

  return (
    <div className={`space-y-8 ${division.accentClass}`}>
      <Link to="/portal/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <HeroBanner
        division={division}
        eyebrow={division.short}
        title={division.name}
        subtitle={division.description}
      />

      <div>
        <h2 className="text-lg font-semibold">Modules</h2>
        <p className="text-sm text-muted-foreground">Workspace tools for {division.short}.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {division.modules.map((m) => (
            <ModuleCard
              key={m.label}
              icon={division.icon}
              label={m.label}
              description={m.description}
              status={m.status}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
