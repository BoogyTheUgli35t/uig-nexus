import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Lightbulb, CheckCircle2, ArrowLeft } from "lucide-react";
import { submitPublicIdea } from "@/lib/public-innovation.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section } from "@/components/site/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/divisions/innovation-lab_/submit")({
  head: () => ({
    meta: [
      { title: "Submit Your Idea — UIG Innovation Lab" },
      {
        name: "description",
        content:
          "Pitch your startup idea to UIG Innovation Lab — incubation, acceleration and seed investment for Nigerian founders.",
      },
    ],
  }),
  component: SubmitIdeaPage,
});

const CATEGORIES = [
  "Technology / SaaS",
  "AgriTech",
  "Real Estate / PropTech",
  "Logistics / Supply Chain",
  "Intelligence / AI",
  "Fintech",
  "Healthtech",
  "Other",
];

function SubmitIdeaPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [website, setWebsite] = useState(""); // honeypot — always left blank by real users
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      submitPublicIdea({
        data: {
          full_name: fullName,
          email,
          phone,
          idea_title: ideaTitle,
          idea_description: ideaDescription,
          category,
          website,
        },
      }),
    onSuccess: () => setSubmitted(true),
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="UIG Innovation Lab"
        title={
          <>
            Pitch us your <span className="text-gradient-gold">next big idea.</span>
          </>
        }
        subtitle="Every submission is reviewed by the Innovation Lab team. Strong ideas get a follow-up call about incubation, acceleration or seed funding."
      >
        <Link
          to="/divisions/innovation-lab"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Innovation Lab
        </Link>
      </PageHero>

      <Section className="!py-14">
        <div className="mx-auto max-w-xl">
          {submitted ? (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-gold" />
              <h2 className="mt-4 text-xl font-bold">Idea submitted.</h2>
              <p className="mt-2 text-muted-foreground">
                Thanks, {fullName.split(" ")[0] || "there"} — the Innovation Lab team will review
                "{ideaTitle}" and reach out at {email} if it's a fit.
              </p>
              <Link
                to="/divisions/innovation-lab"
                className="mt-6 inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Innovation Lab
              </Link>
            </div>
          ) : (
            <form
              className="space-y-5 rounded-xl border border-border bg-surface/60 p-6 sm:p-8"
              onSubmit={(e) => {
                e.preventDefault();
                if (fullName.trim() && email.trim() && ideaTitle.trim() && ideaDescription.trim()) {
                  mutation.mutate();
                }
              }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="h-4 w-4 text-gold" /> Tell us about your idea
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Full name</span>
                  <Input
                    className="mt-1.5"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Email</span>
                  <Input
                    type="email"
                    className="mt-1.5"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs text-muted-foreground">Phone (optional)</span>
                <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>

              {/* Honeypot — display:none hides it from real visitors while still
                  being present in the DOM for simple bots that fill every
                  input without checking computed style. */}
              <div className="hidden" aria-hidden="true">
                <label>
                  Website
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs text-muted-foreground">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">Idea title</span>
                <Input
                  className="mt-1.5"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  maxLength={180}
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">
                  Describe the problem, your solution, and why now
                </span>
                <Textarea
                  className="mt-1.5"
                  rows={6}
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  maxLength={3000}
                  required
                />
              </label>

              {mutation.isError && (
                <p className="text-sm text-destructive">
                  {mutation.error instanceof Error ? mutation.error.message : "Something went wrong — try again."}
                </p>
              )}

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {mutation.isPending ? "Submitting…" : "Submit idea"}
              </Button>
            </form>
          )}
        </div>
      </Section>
    </SiteLayout>
  );
}
