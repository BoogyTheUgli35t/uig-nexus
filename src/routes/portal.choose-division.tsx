import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { chooseDivisions } from "@/lib/onboarding.functions";
import { submitAccessRequest } from "@/lib/portal.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DIVISIONS } from "@/lib/divisions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";

type Intent = "client" | "investor" | "farmer" | "driver" | "staff";

const INTENT_OPTIONS: { value: Intent; label: string; hint: string }[] = [
  { value: "client", label: "Company / Client", hint: "Browse division workspaces and manage your projects." },
  { value: "investor", label: "Investor", hint: "Track holdings and returns across UIG Real Estate & ventures." },
  { value: "farmer", label: "Farmer / Cooperative", hint: "Manage produce, land, and AgriTech program participation." },
  { value: "driver", label: "Driver / Fleet partner", hint: "Accept and manage UIG Logistics delivery jobs." },
  { value: "staff", label: "UIG team member", hint: "Internal staff needing division tooling access." },
];

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
  const [name, setName] = useState("");
  const [intent, setIntent] = useState<Intent>("client");
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [primaryDivision, setPrimaryDivision] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
      const meta = data.user?.user_metadata as { full_name?: string; name?: string } | undefined;
      if (meta?.full_name) setName(meta.full_name);
      else if (meta?.name) setName(meta.name);
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

  const onSubmitAccessRequest = async () => {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      await submitAccessRequest({
        data: {
          name,
          email,
          requested_role: intent,
          reason,
          user_id: u.user?.id ?? null,
        },
      });
      setRequestSubmitted(true);
      toast.success("Request sent to UIG administrators.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit request");
    } finally {
      setLoading(false);
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

  if (requestSubmitted) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <main className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
            <Check className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Request submitted</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your request for {INTENT_OPTIONS.find((o) => o.value === intent)?.label} access has been
            sent to a UIG administrator for review. In the meantime you can explore your workspace
            with standard client access.
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
        <h1 className="mt-8 text-3xl font-bold">Set up your workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hello {email || "there"}! Tell us how you'll be using UIG Apex so we can get you to the right place.
        </p>

        <div className="mt-6 space-y-2">
          <Label>How will you use UIG Apex?</Label>
          <RadioGroup value={intent} onValueChange={(v) => setIntent(v as Intent)} className="grid gap-3 sm:grid-cols-2">
            {INTENT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 rounded-lg border border-border bg-surface p-4 cursor-pointer hover:bg-surface-elevated transition-colors ${
                  intent === opt.value ? "border-gold bg-gold/5" : ""
                }`}
              >
                <RadioGroupItem value={opt.value} id={`intent-${opt.value}`} className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.hint}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        {intent === "client" ? (
          <>
            <p className="mt-8 text-sm text-muted-foreground">
              Select which UIG division workspaces you want access to. You can choose one or more —
              each gives you access to its full dashboard, tools, and data.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </>
        ) : (
          <div className="mt-8 rounded-lg border border-border bg-surface p-6 space-y-4 text-left">
            <div>
              <h2 className="text-base font-semibold">
                Request {INTENT_OPTIONS.find((o) => o.value === intent)?.label} access
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                A UIG administrator will review and approve your request. You'll keep standard client
                access to browse divisions in the meantime.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-name">Full name</Label>
              <input
                id="req-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-email">Email</Label>
              <input
                id="req-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-reason">Tell us more (optional)</Label>
              <Textarea
                id="req-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. properties you've invested in, farm/cooperative name, fleet size…"
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setIntent("client")} disabled={loading}>
                Back
              </Button>
              <Button
                onClick={onSubmitAccessRequest}
                disabled={loading || !name || !email}
                className="bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {loading ? "Submitting…" : "Submit request"}
              </Button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to UIG</Link>
        </p>
      </main>
    </div>
  );
}
