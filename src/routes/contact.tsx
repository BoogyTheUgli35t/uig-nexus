import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section } from "@/components/site/sections";
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

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact UIG — Partner with Unified Innovations Group" },
      {
        name: "description",
        content:
          "Tell us about your project, idea or partnership opportunity. The UIG team responds within 1 business day.",
      },
      { property: "og:title", content: "Partner with UIG" },
      { property: "og:description", content: "Reach out to Unified Innovations Group." },
    ],
  }),
  component: ContactPage,
});

const divisions = [
  "UIG Technology",
  "UIG AgriTech",
  "UIG Real Estate",
  "UIG Logistics",
  "UIG Intelligence",
  "UIG Innovation Lab",
  "Not sure",
];

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", division: "", message: "" });

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
        subtitle="Tell us about your project, idea or partnership opportunity. We respond within 1 business day."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-border bg-surface p-6">
              <Mail className="h-5 w-5 text-gold" />
              <h3 className="mt-3 font-semibold">Email us</h3>
              <a
                href="mailto:hello@uig.africa"
                className="mt-1 text-sm text-muted-foreground hover:text-gold"
              >
                hello@uig.africa
              </a>
            </div>
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
                Lagos, Nigeria · operating across Africa
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
                <Button
                  className="mt-6"
                  onClick={() => {
                    setDone(false);
                    setForm({ name: "", email: "", company: "", division: "", message: "" });
                  }}
                >
                  Send another message
                </Button>
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
    </SiteLayout>
  );
}
