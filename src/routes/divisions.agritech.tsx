import { createFileRoute } from "@tanstack/react-router";
import { Sprout, Activity, TrendingUp, Users } from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/agritech")({
  head: () => ({
    meta: [
      { title: "UIG AgriTech — Smart Agriculture & Predictive Insights" },
      { name: "description", content: "UIG AgriTech brings precision agriculture to Africa: real-time monitoring, analytics and AI-powered predictions for farms." },
      { property: "og:title", content: "UIG AgriTech" },
      { property: "og:description", content: "Smart agriculture, data intelligence, predictive insights." },
    ],
  }),
  component: () => (
    <DivisionPage
      eyebrow="UIG AgriTech"
      title={<>Smart Agriculture, <span className="text-gradient-gold">Data-Driven Decisions.</span></>}
      subtitle="UIG AgriTech turns farms into data-driven operations with real-time monitoring, analytics and AI-powered predictions."
      problem={{
        title: "Low yield visibility, manual tracking, no predictive insights.",
        points: [
          "Field data captured on paper or lost in WhatsApp",
          "No early warning system for risk, disease or weather",
          "Cooperatives can't see what's happening across members",
          "Agri-finance flying blind on credit risk",
        ],
      }}
      solutions={[
        { title: "Farm dashboards & field data systems", description: "Live operational visibility across plots, crops and inputs.", icon: Sprout },
        { title: "IoT & sensor integration", description: "Soil, weather and equipment sensors feeding a single intelligence layer.", icon: Activity },
        { title: "Yield prediction & risk scoring", description: "AI models tuned to local crops, climates and historical performance.", icon: TrendingUp },
        { title: "Cooperative & farmer onboarding", description: "Tools to enroll, score and support thousands of farmers at scale.", icon: Users },
      ]}
      outcome="Higher yields, lower losses, and smarter decision-making for farms and agri-enterprises."
      extra={{
        title: "Use cases",
        items: [
          { name: "Cooperatives", description: "Manage members, inputs, harvest and payouts in one system." },
          { name: "Large farms", description: "Operational dashboards and predictive analytics across operations." },
          { name: "Agri-finance", description: "Risk scoring and monitoring for loans, insurance and grants." },
        ],
      }}
      ctaTitle="Ready to digitize your farm operations?"
      ctaButton="Discuss an AgriTech Project"
    />
  ),
});
