import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/portal/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — UIG Apex Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    // Supabase's client picks up the recovery token from the URL fragment
    // automatically (detectSessionInUrl). We just wait for the resulting
    // PASSWORD_RECOVERY / SIGNED_IN event before showing the form.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const timer = setTimeout(() => {
      if (!readyRef.current) setInvalid(true);
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/portal/dashboard" }), 1500);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden bg-surface flex-col justify-between p-12 border-r border-border">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gold/15 blur-[100px]" />
        <Logo />
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">
            Choose a new <br />
            <span className="text-gradient-gold">password.</span>
          </h2>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          {invalid && !ready ? (
            <>
              <h1 className="text-3xl font-bold">Link expired</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This reset link is invalid or has expired. Request a new one from the sign-in page.
              </p>
              <Button
                className="mt-6 w-full bg-gold text-gold-foreground hover:bg-gold/90"
                onClick={() => navigate({ to: "/portal/forgot-password" })}
              >
                Request a new link
              </Button>
            </>
          ) : done ? (
            <>
              <h1 className="text-3xl font-bold">Password updated</h1>
              <p className="mt-2 text-sm text-muted-foreground">Taking you to your dashboard…</p>
            </>
          ) : !ready ? (
            <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
          ) : (
            <>
              <h1 className="text-3xl font-bold">Choose a new password</h1>
              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {loading ? "Updating…" : "Update password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
