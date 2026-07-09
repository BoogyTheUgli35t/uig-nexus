import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";
import { logPortalEvent } from "@/lib/portal.functions";

export const Route = createFileRoute("/portal/signup")({
  head: () => ({
    meta: [
      { title: "Create account — UIG Apex Portal" },
      { name: "description", content: "Create your UIG Apex Portal account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      // Signed-in already: onboarded users go to the dashboard, otherwise
      // continue to workspace selection.
      const { data: divisions } = await supabase
        .from("user_divisions")
        .select("division_slug")
        .eq("user_id", data.session.user.id)
        .limit(1);
      throw redirect({
        to: (divisions?.length ?? 0) > 0 ? "/portal/dashboard" : "/portal/signup/choose-division",
      });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Only handle redirects on initial load, not on auth changes
    // This prevents loops - auth state changes should NOT trigger navigation
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/portal/signup/choose-division",
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      const refId = "UIG-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      logPortalEvent({ data: { event_type: "access_denied", email, metadata: { reason: error.message, stage: "sign_up", ref_id: refId } } }).catch(() => {});
      const friendly = /already registered|already exists/i.test(error.message)
        ? "An account with this email already exists. Try signing in."
        : /password/i.test(error.message)
        ? "Password doesn't meet requirements (min 8 characters)."
        : "We couldn't create your account. Please try again.";
      return toast.error(`${friendly} Reference: ${refId}`);
    }
    if (data.session) {
      toast.success("Account created. Welcome to Apex.");
      setTimeout(() => {
        window.location.href = "/portal/signup/choose-division";
      }, 1000);
    } else {
      setEmailSent(true);
      toast.success("Check your email to confirm your account.");
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

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <Logo />
          <h1 className="mt-8 text-2xl font-bold">Check your email</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            We've sent a confirmation link to <strong>{email}</strong>.
            <br />Click the link to verify your account, then you'll choose your workspace.
          </p>
          <div className="mt-8">
            <Link to="/portal/login" className="text-sm text-gold hover:underline">
              Already verified? Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-3xl font-bold">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Get access to your UIG workspace.</p>

        <Button onClick={onGoogle} disabled={loading} variant="outline" className="mt-8 w-full">
          Continue with Google
        </Button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Have an account? <Link to="/portal/login" className="text-gold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}