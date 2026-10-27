import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, Eyebrow, CTABand } from "@/components/site/sections";
import { subscribeNewsletter } from "@/lib/newsletter.functions";
import { insights } from "@/lib/insights";
import { canonical } from "@/lib/seo";

// `.index` on purpose. As `insights.tsx` this route was the PARENT of
// `insights.$slug.tsx`, and rendered a component with no <Outlet /> — so every
// article URL rendered this listing page instead of the article. Same trap that
// hid every property detail page.
export const Route = createFileRoute("/insights/")({
  head: () => ({
    links: [canonical("/insights")],
    meta: [
      { title: "News & Insights — UIG Editorial" },
      {
        name: "description",
        content:
          "Perspectives on AI in Africa, AgriTech, real estate trends and logistics innovation from the UIG editorial team.",
      },
      { property: "og:title", content: "UIG News & Insights" },
      {
        property: "og:description",
        content: "Stay Two Steps Ahead. Perspectives from across the UIG group.",
      },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  async function onNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubscribing(true);
    try {
      await subscribeNewsletter({ data: { email: newsletterEmail } });
      toast.success("You're subscribed to the UIG briefing.");
      setNewsletterEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe. Try again.");
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="News & Insights"
        title={
          <>
            Stay <span className="text-gradient-gold">Two Steps Ahead.</span>
          </>
        }
        subtitle="Perspectives, analysis and reporting from the minds across Unified Innovations Group."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {insights.map((p) => (
            <Link
              key={p.slug}
              to="/insights/$slug"
              params={{ slug: p.slug }}
              className="group rounded-2xl border border-border bg-surface/60 overflow-hidden hover:border-gold/40 transition"
            >
              <div className="aspect-[16/9] bg-gradient-to-br from-gold/20 via-surface-elevated to-surface relative">
                <div className="absolute inset-0 grid-bg opacity-30" />
                <div className="absolute bottom-3 left-3 inline-flex items-center rounded-full border border-gold/40 bg-background/80 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-wider text-gold">
                  {p.category}
                </div>
              </div>
              <div className="p-6">
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {p.date}
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{p.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                <div className="mt-4 inline-flex items-center text-sm text-gold">
                  Read more{" "}
                  <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>Newsletter</Eyebrow>
        <div className="mt-6 rounded-2xl border border-gold/20 bg-surface/60 p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl">
            Get UIG's monthly innovation briefing.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl">
            No fluff. Just what's actually moving in Nigerian tech, agriculture, real estate and AI.
          </p>
          <form
            className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg"
            onSubmit={onNewsletterSubmit}
          >
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 h-11 rounded-md border border-input bg-transparent px-4 text-sm"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="inline-flex h-11 items-center justify-center rounded-md bg-gold px-6 text-sm font-medium text-gold-foreground hover:bg-gold/90 disabled:opacity-60"
            >
              {subscribing ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        </div>
      </Section>

      <CTABand title="Want to feature in our reporting?" buttonText="Pitch UIG Editorial" />
    </SiteLayout>
  );
}
