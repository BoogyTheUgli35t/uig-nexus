import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { Mail, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/portal/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — UIG Apex Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/reset-password`,
    });
    setLoading(false);
    // Always show success, even on error — don't reveal whether an email exists.
    if (error) console.error("[forgot-password]", error.message);
    setSent(true);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden bg-surface flex-col justify-between p-12 border-r border-border">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gold/15 blur-[100px]" />
        <Logo />
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">
            Reset your <br />
            <span className="text-gradient-gold">password.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-sm">
            We'll email you a secure link to choose a new one.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          {sent ? (
            <>
              <h1 className="text-3xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for <strong>{email}</strong>, we've sent a link to reset your
                password. It expires shortly, so use it soon.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold">Forgot your password?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-sm text-muted-foreground text-center">
            <Link
              to="/portal/login"
              className="inline-flex items-center gap-1 text-gold hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
