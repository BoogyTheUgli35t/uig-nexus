import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";
import { logPortalEvent } from "@/lib/portal.functions";

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
      // Check if they completed division selection
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("division_selection_completed")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (!prefs?.division_selection_completed) {
        throw redirect({ to: "/portal/signup/choose-division" });
      }
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
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        logPortalEvent({ data: { event_type: "sign_in", user_id: session.user.id, email: session.user.email ?? null } }).catch(() => {});
        // Check division selection
        const { data: prefs } = await supabase.from("user_preferences").select("division_selection_completed").eq("user_id", session.user.id).maybeSingle();
        navigate({ to: prefs?.division_selection_completed ? "/portal/dashboard" : "/portal/signup/choose-division" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const refId = "UIG-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      logPortalEvent({ data: { event_type: "access_denied", email, metadata: { reason: error.message, stage: "password_sign_in", ref_id: refId } } }).catch(() => {});
      const friendly = /invalid login credentials/i.test(error.message)
        ? "Email or password is incorrect."
        : /email not confirmed/i.test(error.message)
        ? "Please confirm your email before signing in."
        : "We couldn't sign you in. Please try again.";
      return toast.error(`${friendly} Reference: ${refId}`);
    }
    if (data.session) {
      toast.success("Welcome back.");
      // Check division selection before navigating
      const { data: prefs } = await supabase.from("user_preferences").select("division_selection_completed").eq("user_id", data.session.user.id).maybeSingle();
      navigate({ to: prefs?.division_selection_completed ? "/portal/dashboard" : "/portal/signup/choose-division" });
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
          <div className="lg:hidden mb-8"><Logo /></div>
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
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            New to UIG? <Link to="/portal/signup" className="text-gold hover:underline">Create an account</Link>
          </p>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            <Link to="/" className="hover:text-foreground">← Back to UIG</Link>
          </p>
        </div>
      </div>
    </div>
  );
}