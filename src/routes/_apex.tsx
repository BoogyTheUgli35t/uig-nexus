import {
  Outlet,
  createFileRoute,
  redirect,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  LogOut,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ScrollText,
  Truck,
  UserCheck,
  Users as Users2,
  FileText,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { NotificationBell } from "@/components/portal/NotificationBell";
import { GlobalSearch } from "@/components/portal/GlobalSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logPortalEvent, submitAccessRequest, getMyAccessRequestStatus } from "@/lib/portal.functions";
import { getMyWorkspace } from "@/lib/divisions.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DIVISIONS } from "@/lib/divisions";
import { toast } from "sonner";

type AppRole = "admin" | "staff" | "client" | "investor" | "farmer" | "driver";
const ALLOWED_ROLES: readonly AppRole[] = [
  "admin",
  "staff",
  "client",
  "investor",
  "farmer",
  "driver",
];

const ACCESS_DENIED_MSG =
  "Your account does not yet have access to the Apex Portal. Request access below and a UIG administrator will review it.";

export const Route = createFileRoute("/_apex")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return { roles: [] as AppRole[] };
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      logPortalEvent({ data: { event_type: "session_expired" } }).catch(() => {});
      throw redirect({ to: "/portal/login" });
    }

    const userId = sessionData.session.user.id;
    const email = sessionData.session.user.email ?? null;
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      throw new Error("Could not verify your portal access. Please try again.");
    }
    const userRoles = (roles ?? [])
      .map((r) => r.role as AppRole)
      .filter((r) => ALLOWED_ROLES.includes(r));
    if (userRoles.length === 0) {
      logPortalEvent({
        data: {
          event_type: "access_denied",
          user_id: userId,
          email,
          metadata: { stage: "portal_load" },
        },
      }).catch(() => {});
      throw new Error(ACCESS_DENIED_MSG);
    }
    return { roles: userRoles, userId, email };
  },
  component: PortalShell,
  errorComponent: PortalErrorBoundary,
  notFoundComponent: PortalNotFound,
});

function PortalErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const navigate = useNavigate();
  const isAccessIssue = error.message?.includes("access");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-lg w-full">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Portal access issue</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {error.message || "Something went wrong while loading the portal."}
          </p>
        </div>

        {isAccessIssue && <AccessRequestForm />}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const { data } = await supabase.auth.getUser();
              if (data.user)
                logPortalEvent({
                  data: {
                    event_type: "sign_out",
                    user_id: data.user.id,
                    email: data.user.email ?? null,
                  },
                }).catch(() => {});
              await supabase.auth.signOut();
              navigate({ to: "/portal/login" });
            }}
          >
            Sign out
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/">Back to UIG</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccessRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState<{ status: string; requested_role: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requestedRole, setRequestedRole] = useState<AppRole>("client");
  const [reason, setReason] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
      const meta = data.user?.user_metadata as { full_name?: string; name?: string } | undefined;
      if (meta?.full_name) setName(meta.full_name);
      else if (meta?.name) setName(meta.name);
    });
    (async () => {
      try {
        const res = await getMyAccessRequestStatus({ headers: await authHeaders() });
        if (res) setExisting({ status: res.status, requested_role: res.requested_role });
      } catch {
        // no existing request or not yet resolvable — fall through to the form
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      await submitAccessRequest({
        data: {
          name,
          email,
          requested_role: requestedRole,
          reason,
          user_id: u.user?.id ?? null,
        },
      });
      setSubmitted(true);
      toast.success("Access request sent to UIG administrators.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit request");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
        Checking your request status…
      </div>
    );
  }

  if (submitted || (existing && existing.status === "pending")) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-6 text-center">
        <ShieldCheck className="h-6 w-6 text-gold mx-auto" />
        <p className="mt-3 text-sm">
          {submitted
            ? "Your access request has been submitted. You'll be notified once it is reviewed."
            : `Your request for ${existing?.requested_role} access is pending review. You'll be notified once it's reviewed.`}
        </p>
      </div>
    );
  }

  if (existing && existing.status === "rejected") {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-6 text-center">
        <ShieldAlert className="h-6 w-6 text-destructive mx-auto" />
        <p className="mt-3 text-sm">
          Your previous access request was declined. Contact a UIG administrator if you believe this
          was a mistake, or submit a new request below.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 rounded-lg border border-border bg-surface p-6 space-y-4 text-left"
    >
      <div>
        <h2 className="text-base font-semibold">Request portal access</h2>
        <p className="text-xs text-muted-foreground mt-1">
          A UIG administrator will review your request.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ar-name">Full name</Label>
        <Input id="ar-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ar-email">Email</Label>
        <Input
          id="ar-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ar-role">Requested role</Label>
        <select
          id="ar-role"
          value={requestedRole}
          onChange={(e) => setRequestedRole(e.target.value as AppRole)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="client">Client</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ar-reason">Reason (optional)</Label>
        <Textarea
          id="ar-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Tell us why you need access…"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
      >
        {loading ? "Submitting…" : "Submit access request"}
      </Button>
    </form>
  );
}

function PortalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-surface-elevated text-muted-foreground flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The portal page you are looking for does not exist.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Link to="/portal/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Back to UIG</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles: AppRole[] };

const NAV_ITEMS: NavItem[] = [
  {
    to: "/portal/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "staff", "client", "investor", "farmer", "driver"],
  },
  {
    to: "/portal/projects",
    label: "Projects",
    icon: FolderKanban,
    roles: ["admin", "staff", "client"],
  },
  {
    to: "/portal/documents",
    label: "Documents",
    icon: FileText,
    roles: ["admin", "staff", "client", "investor", "farmer", "driver"],
  },
  {
    to: "/portal/messages",
    label: "Messages",
    icon: MessageSquare,
    roles: ["admin", "staff", "client", "investor", "farmer", "driver"],
  },
  {
    to: "/portal/billing",
    label: "Billing",
    icon: CreditCard,
    roles: ["admin", "staff", "client", "investor", "farmer", "driver"],
  },
  { to: "/portal/admin", label: "Admin", icon: ShieldCheck, roles: ["admin"] },
  { to: "/portal/audit", label: "Audit log", icon: ScrollText, roles: ["admin"] },
  { to: "/portal/admin/access-requests", label: "Access requests", icon: UserCheck, roles: ["admin"] },
  { to: "/portal/admin/users", label: "Users", icon: Users2, roles: ["admin"] },
  {
    to: "/portal/driver-tasks",
    label: "My deliveries",
    icon: Truck,
    roles: ["driver", "admin", "staff"],
  },
  {
    to: "/portal/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "staff", "client", "investor", "farmer", "driver"],
  },
];

function PortalShell() {
  const navigate = useNavigate();
  const {
    roles,
    email: ctxEmail,
    userId,
  } = Route.useRouteContext() as { roles: AppRole[]; email?: string | null; userId?: string };
  const [email, setEmail] = useState<string>(ctxEmail ?? "");

  useEffect(() => {
    if (!email) supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        if (event === "SIGNED_OUT") {
          // sign-out is logged by the button handler
        } else {
          logPortalEvent({
            data: {
              event_type: "session_expired",
              user_id: userId ?? null,
              email: ctxEmail ?? null,
            },
          }).catch(() => {});
        }
        navigate({ to: "/portal/login" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, ctxEmail, userId, email]);

  const visibleNav = useMemo(
    () => NAV_ITEMS.filter((n) => n.roles.some((r) => roles.includes(r))),
    [roles],
  );
  const primaryRole = roles.includes("admin")
    ? "Admin"
    : roles.includes("staff")
      ? "Staff"
      : roles.includes("investor")
        ? "Investor"
        : roles.includes("farmer")
          ? "Farmer"
          : roles.includes("driver")
            ? "Driver"
            : "Client";

  const [divisionSlugs, setDivisionSlugs] = useState<string[]>([]);
  useEffect(() => {
    let active = true;

    const fetchWorkspace = async (session: any) => {
      if (!session) return;
      try {
        const headers = { authorization: `Bearer ${session.access_token}` };
        const ws = await getMyWorkspace({ headers });
        if (active) {
          setDivisionSlugs(ws.divisionSlugs);
        }
      } catch {
        if (active) {
          setDivisionSlugs([]);
        }
      }
    };

    // Try immediate session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchWorkspace(session);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchWorkspace(session);
      } else if (event === "SIGNED_OUT") {
        if (active) {
          setDivisionSlugs([]);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const myDivisions = useMemo(
    () => DIVISIONS.filter((d) => divisionSlugs.includes(d.slug)),
    [divisionSlugs],
  );

  async function handleSignOut() {
    if (userId)
      await logPortalEvent({
        data: { event_type: "sign_out", user_id: userId, email: ctxEmail ?? null },
      }).catch(() => {});
    await supabase.auth.signOut();
    navigate({ to: "/portal/login" });
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-surface/60 p-4">
        <div className="px-2 py-2">
          <Logo />
        </div>
        <div className="mt-2 px-2 text-xs uppercase tracking-wider text-muted-foreground">
          Apex Portal
        </div>
        <div className="mt-4 px-2">
          <GlobalSearch />
        </div>
        <nav className="mt-6 flex-1 space-y-1">
          {visibleNav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition"
              activeProps={{ className: "bg-surface-elevated text-foreground" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
              <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />
            </Link>
          ))}
          {myDivisions.length > 0 && (
            <div className="pt-4">
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Divisions
              </div>
              {myDivisions.map((d) => (
                <Link
                  key={d.slug}
                  to="/portal/divisions/$slug"
                  params={{ slug: d.slug }}
                  className={`${d.accentClass} flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition`}
                  activeProps={{ className: "bg-surface-elevated text-foreground" }}
                >
                  <d.icon className="h-4 w-4 acc-text" /> {d.short}
                  <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col min-w-0">
              <div className="text-xs text-muted-foreground truncate">{email}</div>
              <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gold">
                <ShieldCheck className="h-3 w-3 shrink-0" /> {primaryRole}
              </div>
            </div>
            <NotificationBell />
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden border-b border-border bg-surface/80 backdrop-blur px-4 h-14 flex items-center justify-between gap-4">
          <Logo />
          <div className="flex-1 max-w-sm mx-auto">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell />
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="lg:hidden border-b border-border bg-surface/40 px-4 py-2 flex gap-1 overflow-x-auto">
          {visibleNav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
              activeProps={{ className: "bg-surface-elevated text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
          {myDivisions.map((d) => (
            <Link
              key={d.slug}
              to="/portal/divisions/$slug"
              params={{ slug: d.slug }}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
              activeProps={{ className: "bg-surface-elevated text-foreground" }}
            >
              {d.short}
            </Link>
          ))}
        </div>

        <main className="flex-1 p-6 sm:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
