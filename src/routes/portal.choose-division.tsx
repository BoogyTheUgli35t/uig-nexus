import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { chooseDivisions } from "@/lib/onboarding.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DIVISIONS } from "@/lib/divisions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/choose-division")({
  head: () => ({
    meta: [
      { title: "Choose your workspace — UIG" },
      { name: "description", content: "Select which UIG division workspaces you want access to." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: sessionData } = await supabase.auth.getSession();
    // If user is not signed in, send them back to signup
    if (!sessionData.session) throw redirect({ to: "/portal/signup" });
  },
  component: ChooseDivisionPage,
});

function ChooseDivisionPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [primaryDivision, setPrimaryDivision] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  const handleDivisionToggle = (slug: string) => {
    setSelectedDivisions((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const onSubmit = async () => {
    if (selectedDivisions.length === 0) {
      toast.error("Please select at least one division");
      return;
    }
    setLoading(true);
    try {
      const headers = await authHeaders();
      await chooseDivisions({
        data: {
          divisions: selectedDivisions as never,
          primary: (primaryDivision || undefined) as never,
        },
        headers,
      });
      setDone(true);
      toast.success("Workspaces created! Welcome to UIG.");
    } catch (err) {
      // Access rows may still have been written; surface the error but let the
      // user continue to their dashboard rather than getting stuck here.
      toast.error(
        err instanceof Error ? err.message : "We couldn't finish setup, taking you to your dashboard.",
      );
    } finally {
      setLoading(false);
      // Always advance — routing must never depend on a background call succeeding.
      setTimeout(() => navigate({ to: "/portal/dashboard" }), 600);
    }
  };

  if (done) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <main className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
            <Check className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Workspaces created!</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your selected UIG division workspaces are now ready.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              onClick={() => navigate({ to: "/portal/dashboard" })}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              Go to dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <main className="w-full max-w-2xl">
        <Logo />
        <h1 className="mt-8 text-3xl font-bold">Choose your workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hello {email || "there"}! Select which UIG division workspaces you want access to.
          You can choose one or more — each gives you access to its full dashboard, tools, and data.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIVISIONS.map((division) => (
            <label
              key={division.slug}
              className={`group relative flex flex-col items-center rounded-xl border border-border bg-surface p-6 cursor-pointer hover:bg-surface-elevated transition-colors focus-within:ring-2 focus-within:ring-gold ${
                selectedDivisions.includes(division.slug) ? "border-gold bg-gold/5" : ""
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedDivisions.includes(division.slug)}
                onChange={() => handleDivisionToggle(division.slug)}
              />
              <div className="mt-4 flex h-36 w-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                <img
                  src={division.hero}
                  alt={`${division.name}`}
                  loading="lazy"
                  className="object-cover h-full w-full"
                />
              </div>
              <div className="mt-4 text-center">
                <h2 className="font-medium">{division.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{division.short}</p>
                <p className="mt-1 text-xs text-muted-foreground">{division.tagline}</p>
              </div>
            </label>
          ))}
        </div>

        {selectedDivisions.length > 1 && (
          <div className="mt-6 space-y-2">
            <Label htmlFor="primary-workspace">Primary Workspace</Label>
            <Select value={primaryDivision} onValueChange={setPrimaryDivision}>
              <SelectTrigger id="primary-workspace">
                <SelectValue placeholder="Select your primary workspace" />
              </SelectTrigger>
              <SelectContent>
                {selectedDivisions.map((slug) => {
                  const division = DIVISIONS.find((d) => d.slug === slug);
                  return (
                    <SelectItem key={slug} value={slug}>
                      {division?.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/portal/signup" })}
            disabled={loading}
          >
            Back to account setup
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading || selectedDivisions.length === 0}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {loading ? "Saving…" : "Create my workspaces"}
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to UIG</Link>
        </p>
      </main>
    </div>
  );
}
