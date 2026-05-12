import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, Eyebrow, CTABand } from "@/components/site/sections";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "News & Insights — UIG Editorial" },
      { name: "description", content: "Perspectives on AI in Africa, AgriTech, real estate trends and logistics innovation from the UIG editorial team." },
      { property: "og:title", content: "UIG News & Insights" },
      { property: "og:description", content: "Stay Two Steps Ahead. Perspectives from across the UIG group." },
    ],
  }),
  component: InsightsPage,
});

export const insights = [
  {
    slug: "nigeria-agriculture-tech-opportunity",
    category: "AgriTech",
    title: "Why Nigeria's Agricultural Crisis Is Africa's Biggest Tech Opportunity",
    excerpt: "Nigeria has 84 million hectares of arable land, 70 million people working agriculture, and 40% post-harvest loss. The math is brutal — and that's exactly why this is the most under-built tech market on the continent.",
    date: "May 12, 2026",
  },
  {
    slug: "case-for-native-african-ai",
    category: "Intelligence",
    title: "The Case for Native African AI: Why Training Models on Local Languages Changes Everything",
    excerpt: "Mainstream LLMs treat Yoruba, Igbo and Hausa as afterthoughts. We're building from the ground up — and the early results in customer support, healthcare triage and education are remarkable.",
    date: "May 5, 2026",
  },
  {
    slug: "lagos-real-estate-2025",
    category: "Real Estate",
    title: "Lagos Real Estate in 2025: Where the Smart Money Is Moving",
    excerpt: "Yields are compressing in Ikoyi and Victoria Island. The smart money has already moved to Lekki Phase 2, Sangotedo and the emerging Epe corridor. Here's the data behind the shift.",
    date: "April 28, 2026",
  },
];

function InsightsPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="News & Insights"
        title={<>Stay <span className="text-gradient-gold">Two Steps Ahead.</span></>}
        subtitle="Perspectives, analysis and reporting from the minds across Unified Innovations Group."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {insights.map((p) => (
            <Link key={p.slug} to="/insights/$slug" params={{ slug: p.slug }} className="group rounded-2xl border border-border bg-surface/60 overflow-hidden hover:border-gold/40 transition">
              <div className="aspect-[16/9] bg-gradient-to-br from-gold/20 via-surface-elevated to-surface relative">
                <div className="absolute inset-0 grid-bg opacity-30" />
                <div className="absolute bottom-3 left-3 inline-flex items-center rounded-full border border-gold/40 bg-background/80 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-wider text-gold">{p.category}</div>
              </div>
              <div className="p-6">
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {p.date}</div>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{p.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                <div className="mt-4 inline-flex items-center text-sm text-gold">Read more <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>Newsletter</Eyebrow>
        <div className="mt-6 rounded-2xl border border-gold/20 bg-surface/60 p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl">Get UIG's monthly innovation briefing.</h2>
          <p className="mt-3 text-muted-foreground max-w-xl">No fluff. Just what's actually moving in Nigerian tech, agriculture, real estate and AI.</p>
          <form className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg" onSubmit={(e) => e.preventDefault()}>
            <input type="email" required placeholder="you@company.com" className="flex-1 h-11 rounded-md border border-input bg-transparent px-4 text-sm" />
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-md bg-gold px-6 text-sm font-medium text-gold-foreground hover:bg-gold/90">Subscribe</button>
          </form>
        </div>
      </Section>

      <CTABand title="Want to feature in our reporting?" buttonText="Pitch UIG Editorial" />
    </SiteLayout>
  );
}
