import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, MessageCircle, MessageSquare, Clock } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, CTABand } from "@/components/site/sections";
import { CONTACT_EMAIL, HQ, canonical, whatsappHref } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { submitContact } from "@/lib/contact.functions";

const divisions = [
  "UIG Technology",
  "UIG AgriTech",
  "UIG Real Estate",
  "UIG Logistics",
  "UIG Intelligence",
  "UIG Innovation Lab",
  "Not sure",
];

/** Division slug → the label the form's dropdown uses. */
const DIVISION_BY_SLUG: Record<string, string> = {
  technology: "UIG Technology",
  agritech: "UIG AgriTech",
  "real-estate": "UIG Real Estate",
  logistics: "UIG Logistics",
  intelligence: "UIG Intelligence",
  "innovation-lab": "UIG Innovation Lab",
};

const str = (v: unknown, max: number) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

export const Route = createFileRoute("/contact")({
  /**
   * Intent carried in from wherever the visitor clicked.
   *
   * Seven distinct job listings, six division CTAs and every property enquiry
   * all funnelled into this one form with no way to say what they were about,
   * so the team received untagged messages and the visitor had to re-type
   * context the site already knew.
   *
   * - `interest` — a division slug, preselects the dropdown
   * - `role` — a job title from /careers, opens the message with the application
   * - `ref` — what they were looking at, e.g. a property title
   */
  validateSearch: (
    s: Record<string, unknown>,
  ): { interest?: string; role?: string; ref?: string } => ({
    interest: str(s["interest"], 40),
    role: str(s["role"], 120),
    ref: str(s["ref"], 160),
  }),

  head: ({ match }) => ({
    links: [canonical("/contact")],
    meta: [
      { title: "Contact UIG — Partner with Unified Innovations Group" },
      {
        name: "description",
        content:
          "Tell us about your project, idea or partnership opportunity. The UIG team responds within 1 business day.",
      },
      { property: "og:title", content: "Partner with UIG" },
      { property: "og:description", content: "Reach out to Unified Innovations Group." },
      // A prefilled variant of the form isn't its own page.
      ...(match.search.interest || match.search.role || match.search.ref
        ? [{ name: "robots", content: "noindex,follow" }]
        : []),
    ],
  }),

  component: ContactPage,
});

function ContactPage() {
  const { interest, role, ref } = Route.useSearch();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const blank = () => ({
    name: "",
    email: "",
    company: "",
    division: (interest && DIVISION_BY_SLUG[interest]) || "",
    message: role
      ? `I'd like to apply for the ${role} role.\n\n`
      : ref
        ? `I'm enquiring about ${ref}.\n\n`
        : "",
  });

  const [form, setForm] = useState(blank);
  const waHref = whatsappHref(
    role
      ? `Hi UIG — I'd like to apply for the ${role} role.`
      : ref
        ? `Hi UIG — I'm enquiring about ${ref}.`
        : "Hi UIG — I'd like to talk to someone about working with you.",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContact({ data: form });
      setDone(true);
      toast.success("Message sent. We'll be in touch shortly.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Let's build <span className="text-gradient-gold">something real.</span>
          </>
        }
        subtitle={
          role
            ? `Applying for ${role}. Fill in the form and we'll come back to you within 1 business day.`
            : ref
              ? `Enquiring about ${ref}. Fill in the form and we'll come back to you within 1 business day.`
              : "Tell us about your project, idea or partnership opportunity. We respond within 1 business day."
        }
      />

      <Section>
        <h2 className="sr-only">Ways to reach UIG</h2>
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-border bg-surface p-6">
              <Mail className="h-5 w-5 text-gold" />
              <h3 className="mt-3 font-semibold">Email us</h3>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-1 break-all text-sm text-muted-foreground hover:text-gold"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
            {waHref && (
              <div className="rounded-xl border border-border bg-surface p-6">
                <MessageCircle className="h-5 w-5 text-gold" />
                <h3 className="mt-3 font-semibold">WhatsApp</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fastest route during Lagos business hours.
                </p>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                  Start a chat
                </a>
              </div>
            )}
            <div className="rounded-xl border border-border bg-surface p-6">
              <MessageSquare className="h-5 w-5 text-gold" />
              <h3 className="mt-3 font-semibold">For partners</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Founders, corporates and investors — let's talk through the form or via email.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <MapPin className="h-5 w-5 text-gold" />
              <h3 className="mt-3 font-semibold">Headquarters</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {HQ.locality}, {HQ.countryName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Operating across Africa.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <Clock className="h-5 w-5 text-gold" />
              <h3 className="mt-3 font-semibold">Response time</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Within 1 business day, Monday to Friday, West Africa Time.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            {done ? (
              <div className="rounded-2xl border border-gold/30 bg-gold/5 p-10 text-center">
                <h3 className="text-2xl font-bold">Thank you.</h3>
                <p className="mt-3 text-muted-foreground">
                  Your message has reached the UIG team. We'll respond within 1 business day.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button
                    onClick={() => {
                      setDone(false);
                      setForm(blank());
                    }}
                  >
                    Send another message
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/divisions">Explore the divisions</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                className="rounded-2xl border border-border bg-surface p-8 space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      required
                      maxLength={100}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      maxLength={255}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      maxLength={150}
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="division">Interested in</Label>
                    <Select
                      value={form.division}
                      onValueChange={(v) => setForm({ ...form, division: v })}
                    >
                      <SelectTrigger id="division">
                        <SelectValue placeholder="Select a division" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold w-full sm:w-auto"
                >
                  {submitting ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </Section>

      <CTABand
        title="Not sure which division you need?"
        subtitle="Six divisions, one operating system. Start with the overview and we'll route you from there."
        buttonText="See all six divisions"
        buttonTo="/divisions"
      />
    </SiteLayout>
  );
}
