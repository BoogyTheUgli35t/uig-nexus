import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section } from "@/components/site/sections";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — UIG" },
      {
        name: "description",
        content: "How UIG uses cookies across our websites and the Apex Portal.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: CookiesPage,
});

const LAST_UPDATED = "July 2026";

const COOKIE_TABLE = [
  {
    name: "Session / auth",
    purpose: "Keeps you signed in to the Apex Portal and remembers your session.",
    duration: "Session, refreshed while active",
  },
  {
    name: "Preferences",
    purpose: "Remembers UI preferences such as sidebar and filter state.",
    duration: "Up to 1 year",
  },
  {
    name: "Analytics",
    purpose: "Helps us understand aggregate usage of our public site (if enabled).",
    duration: "Up to 1 year",
  },
];

function CookiesPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Legal" title="Cookie Policy" subtitle={`Last updated: ${LAST_UPDATED}`} />
      <Section>
        <div className="mx-auto max-w-3xl space-y-8 text-muted-foreground leading-relaxed">
          <p>
            This policy explains how Unified Innovations Group uses cookies and similar technologies
            on our websites and in the Apex Portal.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-foreground">What are cookies?</h2>
            <p className="mt-3">
              Cookies are small text files stored on your device that let us recognize your browser,
              keep you signed in, and remember your preferences between visits.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Cookies we use</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Purpose</th>
                    <th className="px-4 py-3 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {COOKIE_TABLE.map((c) => (
                    <tr key={c.name}>
                      <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                      <td className="px-4 py-3">{c.purpose}</td>
                      <td className="px-4 py-3">{c.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Managing cookies</h2>
            <p className="mt-3">
              Session and preference cookies are essential to sign in and use the Apex Portal —
              disabling them will prevent you from using the portal. You can control or delete
              cookies through your browser settings at any time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">More information</h2>
            <p className="mt-3">
              See our{" "}
              <a href="/privacy" className="text-gold hover:underline">
                Privacy Policy
              </a>{" "}
              for how we handle personal data more broadly, or reach us via our{" "}
              <a href="/contact" className="text-gold hover:underline">
                contact page
              </a>
              .
            </p>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
