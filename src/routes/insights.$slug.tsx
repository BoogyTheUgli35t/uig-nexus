import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, Eyebrow, CTABand } from "@/components/site/sections";
import { JsonLd } from "@/components/site/JsonLd";
import { SITE_LOGO, SITE_NAME, SITE_URL, canonical } from "@/lib/seo";
import { insights, insightBodies } from "@/lib/insights";

export const Route = createFileRoute("/insights/$slug")({
  loader: ({ params }): { post: (typeof insights)[number]; body: string[] } => {
    const post = insights.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return { post, body: insightBodies[post.slug] ?? [] };
  },
  head: ({ loaderData, params }) => ({
    links: loaderData ? [canonical(`/insights/${params.slug}`)] : [],
    meta: loaderData
      ? [
          { title: `${loaderData.post.title} — UIG News & Insights` },
          { name: "description", content: loaderData.post.excerpt },
          { property: "og:title", content: loaderData.post.title },
          { property: "og:description", content: loaderData.post.excerpt },
          { property: "og:type", content: "article" },
          { property: "og:url", content: `${SITE_URL}/insights/${params.slug}` },
          { property: "article:published_time", content: isoDate(loaderData.post.date) },
          { property: "article:section", content: loaderData.post.category },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Insights — UIG" }],
  }),
  component: InsightArticle,
  notFoundComponent: () => (
    <SiteLayout>
      <Section>
        <h1 className="text-3xl font-bold">Article not found</h1>
        <Link to="/insights" className="mt-4 inline-flex items-center text-gold">
          ← Back to insights
        </Link>
      </Section>
    </SiteLayout>
  ),
});

/**
 * Turn the human-written date on a post ("May 12, 2026") into an ISO date for
 * `article:published_time` and `datePublished`. Falls back to the raw string,
 * which is better than dropping the field: a malformed date is a warning in
 * Search Console, a missing one loses the article's freshness signal entirely.
 */
function isoDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toISOString();
}

function InsightArticle() {
  const { post, body } = Route.useLoaderData();
  const related = insights.filter((p) => p.slug !== post.slug).slice(0, 2);

  // Property listings have had a full schema.org graph since they shipped;
  // articles emitted `og:type: article` and nothing else, so none of them were
  // eligible for the article treatment in search results.
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    articleSection: post.category,
    datePublished: isoDate(post.date),
    url: `${SITE_URL}/insights/${post.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/insights/${post.slug}`,
    },
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: SITE_LOGO },
    },
    ...(body.length > 0 ? { articleBody: body.join("\n\n") } : {}),
  };

  return (
    <SiteLayout>
      <JsonLd data={articleJsonLd} />
      <article>
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[800px] rounded-full bg-gold/10 blur-[120px]" />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-16 pb-16">
            <Link
              to="/insights"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold"
            >
              <ArrowLeft className="h-3 w-3" /> All insights
            </Link>
            <Eyebrow>{post.category}</Eyebrow>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold leading-tight">{post.title}</h1>
            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> {post.date}
              </span>
              <span>UIG Editorial Team</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p className="text-xl text-foreground">{post.excerpt}</p>
          {body.map((p: string, i: number) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <Section>
          <h2 className="text-2xl font-bold">Related</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                to="/insights/$slug"
                params={{ slug: r.slug }}
                className="rounded-xl border border-border bg-surface/60 p-5 hover:border-gold/40 transition"
              >
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
