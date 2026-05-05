import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, LayoutDashboard, Users, FolderKanban } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, FeatureCard } from "@/components/site/sections";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "UIG Apex Portal — Secure Workspace for UIG Clients & Teams" },
      { name: "description", content: "Apex is the unified portal for UIG clients, partners and internal teams — projects, documents, tasks and intelligence in one place." },
      { property: "og:title", content: "UIG Apex Portal" },
      { property: "og:description", content: "Secure workspace for UIG clients and teams." },
    ],
  }),
  component: PortalEntry,
});

function PortalEntry() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Apex Portal"
        title={<>The UIG <span className="text-gradient-gold">Apex Portal.</span></>}
        subtitle="Apex is the unified workspace where UIG clients, partners and internal teams collaborate — projects, documents, tasks and intelligence, all in one secure place."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold">
            <Link to="/portal/login">Login to Portal</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/contact">Request Portal Access</Link>
          </Button>
        </div>
      </PageHero>

      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<LayoutDashboard className="h-5 w-5" />} title="Live dashboards" description="KPIs, project status and AI-powered insights at a glance." />
          <FeatureCard icon={<FolderKanban className="h-5 w-5" />} title="Universal projects" description="Tech builds, properties and shipments all in one project model." />
          <FeatureCard icon={<Users className="h-5 w-5" />} title="Roles & organizations" description="Admin, staff and client roles with strict, org-scoped access." />
          <FeatureCard icon={<Shield className="h-5 w-5" />} title="Enterprise-grade security" description="Row-level security, encrypted storage and full audit trails." />
        </div>
      </Section>
    </SiteLayout>
  );
}
