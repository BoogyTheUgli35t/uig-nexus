import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";
import { logPortalEvent, getMyAccessRequestStatus } from "@/lib/portal.functions";
import { authHeaders } from "@/lib/auth-headers";

export const Route = createFileRoute("/portal/login")({
  head: () => ({
    meta: [
      { title: "Sign in — UIG Apex Portal" },
      { name: "description", content: "Sign in to the UIG Apex Portal." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      if (roles && roles.length > 0) {
        throw redirect({ to: "/portal/dashboard" });
      }
      // No role yet — if they've already submitted an access request (e.g.
      // they picked a non-client role at signup), send them into the portal
      // so the pending/rejected status shows, instead of looping them back
      // through "choose your workspace" every time they log in.
      const existing = await getMyAccessRequestStatus({ headers: await authHeaders() }).catch(() => null);
      if (existing) {
        throw redirect({ to: "/portal/dashboard" });
      }
      throw redirect({ to: "/portal/signup/choose-division" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only handle redirects on initial load, not on auth changes
    // This prevents loops - auth state changes should NOT trigger navigation
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const refId = "UIG-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      logPortalEvent({
        data: {
          event_type: "access_denied",
          email,
          metadata: { reason: error.message, stage: "password_sign_in", ref_id: refId },
        },
      }).catch(() => {});
      const friendly = /invalid login credentials/i.test(error.message)
        ? "Email or password is incorrect."
        : /email not confirmed/i.test(error.message)
          ? "Please confirm your email before signing in."
          : "We couldn't sign you in. Please try again.";
      return toast.error(`${friendly} Reference: ${refId}`);
    }
    if (data.session) {
      toast.success("Welcome back.");
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      // Use setTimeout to ensure toast appears before redirect
      setTimeout(() => {
        if (roles && roles.length > 0) {
          window.location.href = "/portal/dashboard";
        } else {
          window.location.href = "/portal/signup/choose-division";
        }
      }, 1000);
    }
  }

  async function onGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/portal/signup",
    });
    if (result.error) {
      setLoading(false);
      toast.error(result.error.message ?? "Google sign-in failed");
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden bg-surface flex-col justify-between p-12 border-r border-border">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gold/15 blur-[100px]" />
        <Logo />
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">
            Welcome to <br />
            <span className="text-gradient-gold">UIG Apex.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-sm">
            The unified workspace for UIG clients, partners and teams.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Access your UIG workspace.</p>

          <Button onClick={onGoogle} disabled={loading} variant="outline" className="mt-8 w-full">
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/portal/forgot-password"
                  className="text-xs text-gold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            New to UIG?{" "}
            <Link to="/portal/signup" className="text-gold hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            <Link to="/" className="hover:text-foreground">
              ← Back to UIG
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
