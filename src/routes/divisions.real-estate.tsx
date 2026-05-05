import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users, BarChart3, Globe } from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/real-estate")({
  head: () => ({
    meta: [
      { title: "UIG Real Estate — Property Systems, CRM & Investor Intelligence" },
      { name: "description", content: "UIG Real Estate modernizes property operations with digital tools, automation and analytics for developers, agents and investors." },
      { property: "og:title", content: "UIG Real Estate" },
      { property: "og:description", content: "Property systems, real estate CRM and investor intelligence." },
    ],
  }),
  component: () => (
    <DivisionPage
      eyebrow="UIG Real Estate"
      title={<>Data-Driven Real Estate <span className="text-gradient-gold">& Smart Property Systems.</span></>}
      subtitle="UIG Real Estate helps developers, agents and investors manage properties, leads and portfolios with clarity and speed."
      problem={{
        title: "Manual lead management, no central system, no analytics.",
        points: [
          "Leads lost to slow follow-up and scattered channels",
          "No single view of properties, status and pipeline",
          "Investors waiting on PDFs and spreadsheets for performance",
          "Marketing sites that don't convert and can't be measured",
        ],
      }}
      solutions={[
        { title: "Property management systems", description: "Central operating system for listings, units, tenants and deals.", icon: Building2 },
        { title: "Real estate CRM & automated follow-ups", description: "Capture every lead, qualify automatically, and never let one go cold.", icon: Users },
        { title: "Investor dashboards & ROI analytics", description: "Real-time portfolio performance for investors and partners.", icon: BarChart3 },
        { title: "Smart real estate websites & portals", description: "High-converting marketing sites and client portals tied to your CRM.", icon: Globe },
      ]}
      outcome="A streamlined, data-driven real estate operation that closes deals faster and manages assets intelligently."
      ctaTitle="Ready to upgrade your real estate operation?"
      ctaButton="Request a Real Estate Blueprint"
    />
  ),
});
