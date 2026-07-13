import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { DIVISIONS } from "@/lib/divisions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { logPortalEvent, registerUserDivisions, submitAccessRequest } from "@/lib/portal.functions";
import { seedRealEstateData } from "@/lib/realestate.seed";
import { seedTechnologyData } from "@/lib/technology.seed";
import { seedAgriTechData } from "@/lib/agritech.seed";
import { seedLogisticsData } from "@/lib/logistics.seed";
import { seedIntelligenceData } from "@/lib/intelligence.seed";
import { seedInnovationData } from "@/lib/innovation.seed";
import { authHeaders } from "@/lib/auth-headers";

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
  },
  component: ChooseDivisionPage,
});

const INTENTS = [
  {
    value: "client" as const,
    label: "Company / Client",
    description: "Browse and use division workspaces right away.",
  },
  {
    value: "investor" as const,
    label: "Investor",
    description: "Track my portfolio in Real Estate.",
  },
  {
    value: "farmer" as const,
    label: "Farmer / Cooperative",
    description: "Manage my fields and farm data in AgriTech.",
  },
  {
    value: "driver" as const,
    label: "Driver / Fleet partner",
    description: "See my delivery tasks in Logistics.",
  },
  {
    value: "staff" as const,
    label: "UIG team member",
    description: "I work at UIG and need staff access.",
  },
];

function ChooseDivisionPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [intent, setIntent] = useState<(typeof INTENTS)[number]["value"]>("client");
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [primaryDivision, setPrimaryDivision] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"select" | "submit" | "requested">("select");

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
        const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
        setFullName(meta?.full_name || meta?.name || "");
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user session");

      if (intent !== "client") {
        // Elevated/self-service roles go through admin review instead of an
        // instant grant — an admin approves from /portal/admin/access-requests
        // and, for investor/farmer/driver, links the specific record to this
        // account afterwards.
        const divisionNames = selectedDivisions
          .map((slug) => DIVISIONS.find((d) => d.slug === slug)?.name ?? slug)
          .join(", ");
        await submitAccessRequest({
          data: {
            name: fullName || email,
            email,
            requested_role: intent,
            reason: `Signed up via choose-division. Interested in: ${divisionNames}.`,
            user_id: user.id,
          },
        });
        setStep("requested");
        return;
      }

      setStep("submit");

      // Call the server function to record division selection and assign role using service role (bypasses RLS)
      await registerUserDivisions({
        data: {
          selected_divisions: selectedDivisions,
          primary_division: primaryDivision,
          role_preference: "client",
        },
        headers: await authHeaders(),
      });

      // Seed default sample data for each division using their respective server functions
      const seedPromises = selectedDivisions.map(async (division) => {
        try {
          const headers = await authHeaders();
          switch (division) {
            case "real-estate":
              await seedRealEstateData({ headers });
              break;
            case "technology":
              await seedTechnologyData({ headers });
              break;
            case "agritech":
              await seedAgriTechData({ headers });
              break;
            case "logistics":
              await seedLogisticsData({ headers });
              break;
            case "intelligence":
              await seedIntelligenceData({ headers });
              break;
            case "innovation-lab":
              await seedInnovationData({ headers });
              break;
          }
        } catch (err) {
          console.error(`Seeding failed for division ${division}:`, err);
        }
      });
      await Promise.all(seedPromises);

      toast.success("Workspaces created! Welcome to UIG.");

      // Force redirect to dashboard
      setTimeout(() => {
        window.location.href = "/portal/dashboard";
      }, 500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save your selection");
      setStep("select");
    } finally {
      setLoading(false);
    }
  };

  if (step === "requested") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Request sent</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A UIG administrator will review your {intent} access request and get back to you. You'll
            get a notification once it's approved.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              onClick={() => navigate({ to: "/portal/dashboard" })}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <Button
              onClick={() => navigate({ to: "/portal/dashboard" })}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
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
          Hello {email || "there"}! Tell us what brings you to UIG, then pick which division
          workspaces you're interested in.
        </p>

        <div className="mt-6">
          <Label>What best describes you?</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {INTENTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIntent(opt.value)}
                className={`rounded-lg border p-3 text-left transition ${
                  intent === opt.value
                    ? "border-gold bg-gold/5"
                    : "border-border hover:bg-surface-elevated"
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{opt.description}</div>
              </button>
            ))}
          </div>
          {intent !== "client" && (
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="full-name" className="text-xs">
                Full name
              </Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
          )}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {intent === "client"
            ? "Select one or more divisions to get instant access to their dashboards, tools, and data."
            : "Select the division(s) relevant to your request — a UIG administrator will review and grant access."}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIVISIONS.map((division) => (
            <label
              key={division.slug}
              className={`group relative flex flex-col items-center rounded-xl border border-border bg-surface p-6 cursor-pointer hover:bg-surface-elevated transition-colors ${
                selectedDivisions.includes(division.slug) ? "border-gold bg-gold/5" : ""
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
            disabled={loading || selectedDivisions.length === 0 || (intent !== "client" && !fullName.trim())}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {loading
              ? "Saving…"
              : intent === "client"
                ? "Create my workspaces"
                : "Request access"}
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Back to UIG
          </Link>
        </p>
      </div>
    </div>
  );
}

// Import Check icon (lucide-react)
import { Check } from "lucide-react";
