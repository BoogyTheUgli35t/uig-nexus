import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { DIVISIONS } from "@/lib/divisions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";
import { logPortalEvent } from "@/lib/portal.functions";

export const Route = createFileRoute("/portal/signup/choose-division")({
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
    // If they already completed division selection, send them to dashboard
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("division_selection_completed")
      .eq("user_id", sessionData.session.user.id)
      .maybeSingle();
    if (prefs?.division_selection_completed) {
      throw redirect({ to: "/portal/dashboard" });
    }
  },
  component: ChooseDivisionPage,
});

function ChooseDivisionPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [primaryDivision, setPrimaryDivision] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"select" | "submit">("select");

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
      } catch {
        // fallback: try to get email from URL state (if passed from verify email page)
        const urlParams = new URLSearchParams(window.location.search);
        const emailFromUrl = urlParams.get("email");
        if (emailFromUrl) setEmail(emailFromUrl);
      }
    })();
  }, []);

  const handleDivisionToggle = (slug: string) => {
    setSelectedDivisions((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const onSubmit = async () => {
    if (selectedDivisions.length === 0) {
      toast.error("Please select at least one division");
      return;
    }
    setStep("submit");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user session");

      // Call a server function to record division selection and seed sample data
      // This assumes you have an Edge Function or server function: `signup_choose_division`
      const { error } = await supabase.functions.invoke("signup_choose_division", {
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          selected_divisions: selectedDivisions,
        }),
      });

      if (error) throw error;

      // Mark selection as completed
      await supabase
        .from("user_preferences")
        .upsert(
          { user_id: user.id, division_selection_completed: true, updated_at: new Date().toISOString() },
          { onConflict: ["user_id"] }
        );

      logPortalEvent({
        data: {
          event_type: "division_selection_completed",
          user_id: user.id,
          email: user.email,
          metadata: { selected_divisions: selectedDivisions },
        }
      }).catch(() => {});

      toast.success("Workspaces created! Welcome to UIG.");
      
      // Redirect: if one division, go to its dashboard; if multiple, go to portal dashboard (we'll enhance later)
      if (selectedDivisions.length === 1) {
        navigate({ to: `/portal/divisions/${selectedDivisions[0]}` });
      } else {
        navigate({ to: "/portal/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save your selection");
    } finally {
      setLoading(false);
      setStep("select");
    }
  };

  if (step === "submit") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Workspaces created!</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your selected UIG division workspaces are now ready.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button onClick={() => navigate({ to: "/portal/dashboard" })} className="bg-gold text-gold-foreground hover:bg-gold/90">
              Go to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
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
              className={`group relative flex flex-col items-center rounded-xl border border-border bg-surface p-6 cursor-pointer hover:bg-surface-elevated transition-colors ${
                selectedDivisions.includes(division.slug)
                  ? "border-gold bg-gold/5"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                hidden
                checked={selectedDivisions.includes(division.slug)}
                onChange={() => handleDivisionToggle(division.slug)}
              />
              <div className="mt-4 flex h-36 w-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                <img
                  src={division.hero}
                  alt={`${division.name} hero`}
                  className="object-cover h-full w-full"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="font-medium">{division.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{division.short}</p>
                <p className="mt-1 text-xs text-muted-foreground">{division.tagline}</p>
              </div>
            </label>
          ))}
        </div>

        {selectedDivisions.length > 1 && (
          <div className="mt-6">
            <Label>Primary Workspace</Label>
            <Select value={primaryDivision} onValueChange={setPrimaryDivision}>
              <SelectTrigger>
                <SelectValue placeholder="Select your primary workspace" />
              </SelectTrigger>
              <SelectContent>
                {selectedDivisions.map(slug => {
                  const division = DIVISIONS.find(d => d.slug === slug);
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
      </div>
    </div>
  );
}

// Import Check icon (lucide-react)
import { Check } from "lucide-react";