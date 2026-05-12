import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, Eyebrow, CTABand } from "@/components/site/sections";
import { insights } from "./insights";

const bodies: Record<string, string[]> = {
  "nigeria-agriculture-tech-opportunity": [
    "Nigeria has 84 million hectares of arable land. We farm only a fraction of it productively. We import billions of dollars of food we could grow at home. Smallholders — over 70% of our agricultural producers — operate without weather data, without market price visibility, and without access to the buyers who actually pay fair prices.",
    "Every one of those problems is a software problem wearing an agricultural costume. UIG AgriTech is built on that thesis. Crop monitoring is a computer vision problem. Yield prediction is a time-series problem. Weather guidance for a Yoruba-speaking farmer in Oyo is a localisation problem. Farm-to-market is a marketplace problem.",
    "What's missing isn't insight. It's execution: drones that fly Nigerian skies, sensors that survive Nigerian humidity, SMS alerts that work on Nigerian feature phones, and a marketplace that pays Nigerian farmers in Naira within 24 hours. That's what we're building.",
    "The opportunity is generational. Whoever solves this for Nigeria solves it for West Africa. Whoever solves it for West Africa solves it for the continent. We intend to be that team.",
  ],
  "case-for-native-african-ai": [
    "When a Yoruba-speaking trader asks GPT-4 a question in her language, the model often answers in English, in Pidgin, or in a stilted approximation of Yoruba that no actual speaker would write. That's not a bug — it's the math. Models are trained on the data they can find, and the open web is overwhelmingly Western, English, and contextually foreign to most of Africa.",
    "UIG Intelligence is building from the other direction. Native datasets, native idioms, native cultural context. Our Yoruba intent recognition rate has crossed 94% on the use cases that matter — customer support, banking enquiries, healthcare triage. Our Hausa corpus is past 500K training tokens and growing weekly.",
    "This isn't a research exercise. The applications are immediate and large. A Nigerian bank that can serve customers in Hausa via WhatsApp. A telco that can triage support in Igbo. A clinic that can assist patients in Yoruba. These are real businesses with real margins waiting on real models.",
    "The bigger point: AI built for Africa, by Africans, on African data is no longer optional. It's the only path to inclusion at the scale the next decade demands.",
  ],
  "lagos-real-estate-2025": [
    "The Ikoyi/VI compression is real. Yields that hit 8–10% in 2018 are now closer to 4–5%, and that's before you account for ground rent, service charges and the increasingly aggressive maintenance economics of luxury Lagos.",
    "The smart money has already moved. Lekki Phase 2, Sangotedo, the Epe corridor and parts of Ibeju are showing the kind of appreciation Lekki Phase 1 saw a decade ago — combined with a much better risk profile if your title work is clean.",
    "UIG Real Estate's quarterly index tracks 12 sub-markets across Lagos, Abuja and Port Harcourt. The two-year story is consistent: secondary corridors with infrastructure trajectories beat prime markets on total return, even after factoring in liquidity discounts.",
    "If you're a diaspora investor or a local HNI building a portfolio for the next ten years, the question isn't whether to enter Lagos real estate. It's where, with what title verification, and through what structure. We can help with all three.",
  ],
};

export const Route = createFileRoute("/insights/$slug")({
  loader: ({ params }) => {
    const post = insights.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return { post, body: bodies[post.slug] ?? [] };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.post.title} — UIG News & Insights` },
          { name: "description", content: loaderData.post.excerpt },
          { property: "og:title", content: loaderData.post.title },
          { property: "og:description", content: loaderData.post.excerpt },
          { property: "og:type", content: "article" },
        ]
      : [{ title: "Insights — UIG" }],
  }),
  component: InsightArticle,
  notFoundComponent: () => (
    <SiteLayout>
      <Section>
        <h1 className="text-3xl font-bold">Article not found</h1>
        <Link to="/insights" className="mt-4 inline-flex items-center text-gold">← Back to insights</Link>
      </Section>
    </SiteLayout>
  ),
});

function InsightArticle() {
  const { post, body } = Route.useLoaderData();
  const related = insights.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <SiteLayout>
      <article>
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[800px] rounded-full bg-gold/10 blur-[120px]" />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-16 pb-16">
            <Link to="/insights" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold"><ArrowLeft className="h-3 w-3" /> All insights</Link>
            <Eyebrow>{post.category}</Eyebrow>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold leading-tight">{post.title}</h1>
            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {post.date}</span>
              <span>UIG Editorial Team</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p className="text-xl text-foreground">{post.excerpt}</p>
          {body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <Section>
          <h2 className="text-2xl font-bold">Related</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.slug} to="/insights/$slug" params={{ slug: r.slug }} className="rounded-xl border border-border bg-surface/60 p-5 hover:border-gold/40 transition">
                <div className="text-xs text-gold uppercase tracking-wider">{r.category}</div>
                <h3 className="mt-2 font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </Section>
      </article>

      <CTABand title="Want to be featured in UIG Editorial?" buttonText="Pitch UIG" />
    </SiteLayout>
  );
}
