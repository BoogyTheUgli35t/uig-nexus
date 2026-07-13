import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDashboard, getCrossDivisionPulse, getDashboardInsight } from "@/lib/portal.functions";
import { getMyWorkspace } from "@/lib/divisions.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DIVISIONS } from "@/lib/divisions";
import { FolderKanban, CheckSquare, FileText, Sparkles, ArrowRight } from "lucide-react";

type Pulse = Awaited<ReturnType<typeof getCrossDivisionPulse>>;

export const Route = createFileRoute("/_apex/portal/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: DashboardPage,
});

type Data = Awaited<ReturnType<typeof getDashboard>>;

function DashboardPage() {
  const [data, setData] = useState<Data | null>(null);
  const [divisionSlugs, setDivisionSlugs] = useState<string[]>([]);
  const [pulse, setPulse] = useState<Pulse>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async (session: any) => {
      if (!session) return;
      try {
        const headers = { authorization: `Bearer ${session.access_token}` };
        const [res, ws, pulseRes] = await Promise.all([
          getDashboard({ headers }),
          getMyWorkspace({ headers: await authHeaders() }),
          getCrossDivisionPulse({ headers }).catch(() => []),
        ]);
        if (active) {
          setData(res);
          setDivisionSlugs(ws.divisionSlugs);
          setPulse(pulseRes);
          setError(null);
        }
        getDashboardInsight({ headers })
          .then((r) => {
            if (active) setInsight(r.insight);
          })
          .catch(() => {});
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    // Try to load session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchData(session);
      } else {
        // If no session is found yet, keep loading true
        if (active) setLoading(true);
      }
    });

    // Listen for auth state changes to handle async initialization
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchData(session);
      } else if (event === "SIGNED_OUT") {
        if (active) {
          setData(null);
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!data) return null;

  const greeting = data.profile?.full_name?.split(" ")[0] ?? "there";
  const myDivisions = DIVISIONS.filter((d) => divisionSlugs.includes(d.slug));

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Apex Dashboard</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold">Welcome back, {greeting}.</h1>
        <p className="mt-2 text-muted-foreground">Here's what's happening across your workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<FolderKanban className="h-4 w-4" />}
          label="Active projects"
          value={data.stats.projects}
        />
        <Stat
          icon={<CheckSquare className="h-4 w-4" />}
          label="Open tasks"
          value={data.stats.openTasks}
        />
        <Stat
          icon={<FileText className="h-4 w-4" />}
          label="Documents"
          value={data.stats.documents}
        />
      </div>

      <div className="rounded-xl border border-gold/20 bg-gold/5 p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-gold mt-0.5" />
          <div>
            <h3 className="font-semibold">AI insight</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {insight ?? "Thinking…"}
            </p>
          </div>
        </div>
      </div>

      {myDivisions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Your divisions</h2>
          <p className="text-sm text-muted-foreground">
            Jump into the workspaces you have access to.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myDivisions.map((d) => {
              const p = pulse.find((x) => x.slug === d.slug);
              return (
                <Link
                  key={d.slug}
                  to="/portal/divisions/$slug"
                  params={{ slug: d.slug }}
                  className={`${d.accentClass} group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition hover:acc-border-soft`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg acc-bg-soft acc-text">
                      <d.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold">{d.short}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p ? `${p.count} ${p.label}` : d.tagline}
                      </div>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition group-hover:acc-text" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent projects" link={{ to: "/portal/projects", label: "View all" }}>
          {data.recentProjects.length === 0 ? (
            <Empty msg="No projects yet." />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/portal/projects/$id"
                    params={{ id: p.id }}
                    className="flex items-center justify-between py-3 hover:text-gold"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {p.type.replace("_", " ")} · {p.status}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent tasks">
          {data.recentTasks.length === 0 ? (
            <Empty msg="No tasks yet." />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentTasks.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.status} {t.due_date ? `· due ${t.due_date}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-3xl font-display font-bold">{value}</div>
    </div>
  );
}

function Panel({
  title,
  link,
  children,
}: {
  title: string;
  link?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {link && (
          <Link to={link.to} className="text-sm text-gold hover:underline">
            {link.label}
          </Link>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{msg}</p>;
}
