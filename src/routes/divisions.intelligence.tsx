import { createFileRoute } from "@tanstack/react-router";
import { Brain, BarChart3, Database, Bot } from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/intelligence")({
  head: () => ({
    meta: [
      { title: "UIG Intelligence — AI Models & Data Products for African Realities" },
      { name: "description", content: "UIG Intelligence develops AI models and data products built for African realities: automation, analytics and predictive systems." },
      { property: "og:title", content: "UIG Intelligence" },
      { property: "og:description", content: "Custom AI models, predictive analytics and intelligent automation." },
    ],
  }),
  component: () => (
    <DivisionPage
      eyebrow="UIG Intelligence"
      title={<>AI Models & Data Products <span className="text-gradient-gold">for African Realities.</span></>}
      subtitle="UIG Intelligence helps organizations automate decisions, analyze data and deploy intelligent systems that create real impact."
      solutions={[
        { title: "Custom AI models", description: "Models trained on local data, languages and use cases — not generic GPT calls.", icon: Brain },
        { title: "Predictive analytics", description: "Forecasting and risk scoring across logistics, real estate and agriculture.", icon: BarChart3 },
        { title: "Data engineering & dashboards", description: "Pipelines, warehouses and live dashboards that make data usable.", icon: Database },
        { title: "AI assistants & automation tools", description: "Internal copilots and customer-facing assistants that actually work.", icon: Bot },
      ]}
      outcome="Smarter operations powered by AI that understands your market, your data and your customers."
      why={{
        title: "Africa-rooted, multilingual, local data focus.",
        points: [
          "Models tuned to African languages, names and addresses",
          "Trained on local market data — not Silicon Valley defaults",
          "Built for low-bandwidth, mobile-first environments",
          "Engineered to comply with local data and privacy norms",
        ],
      }}
      ctaTitle="Ready to put AI to work?"
      ctaButton="Explore AI Opportunities"
    />
  ),
});
