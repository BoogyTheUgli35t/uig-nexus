import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Workflow, Plug, Rocket } from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/technology")({
  head: () => ({
    meta: [
      { title: "UIG Technology — AI-Powered Software, Portals & Automation" },
      { name: "description", content: "UIG Technology builds intelligent systems that help businesses operate faster, smarter and with less overhead." },
      { property: "og:title", content: "UIG Technology" },
      { property: "og:description", content: "AI-driven portals, dashboards and automations that unify your operation." },
    ],
  }),
  component: () => (
    <DivisionPage
      eyebrow="UIG Technology"
      title={<>AI-Powered Software, <span className="text-gradient-gold">Portals & Automation.</span></>}
      subtitle="UIG Technology designs AI-driven portals, dashboards and automations that replace manual work and unify your entire operation."
      problem={{
        title: "Manual processes, scattered tools, no visibility.",
        points: [
          "Operations spread across disconnected spreadsheets and SaaS tools",
          "Repetitive manual work eating up your team's hours",
          "No single source of truth for projects, clients or data",
          "Founders forced to hire a tech team before they're ready",
        ],
      }}
      solutions={[
        { title: "Custom portals & internal tools", description: "Tailor-made client and operations portals that match how your business actually works.", icon: Cpu },
        { title: "AI workflow automation", description: "Replace manual handoffs with intelligent agents and automated pipelines.", icon: Workflow },
        { title: "API integrations & system unification", description: "Connect every tool you use into one coherent system with real-time data flow.", icon: Plug },
        { title: "SaaS & product development", description: "Take founders from idea to shipped product with senior engineering and design.", icon: Rocket },
      ]}
      outcome="A modern, automated business that scales without hiring a full tech team."
      process={{
        title: "Five steps. From idea to live system.",
        steps: [
          { name: "Discovery", description: "We map your operation, surface the bottlenecks and define success metrics." },
          { name: "Blueprint", description: "Architecture, UX flows and a clear delivery plan — signed off before we build." },
          { name: "Build", description: "Senior engineering teams ship fast, with weekly demos and tight feedback loops." },
          { name: "Launch", description: "Go-live, training and rollout to your team and clients." },
          { name: "Optimize", description: "Continuous improvement with analytics, AI tuning and feature iteration." },
        ],
      }}
      why={{
        title: "Why UIG Technology.",
        points: [
          "AI-first by design — every system ships with intelligence baked in",
          "Business-focused — we measure ROI, not lines of code",
          "Multi-division insight — patterns from real estate, agri and logistics inform your build",
          "Senior team, no offshoring — you talk to the people building",
        ],
      }}
      ctaTitle="Ready to automate your business?"
      ctaButton="Book a Strategy Call"
    />
  ),
});
