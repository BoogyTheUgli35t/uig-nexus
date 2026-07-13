import { createFileRoute } from "@tanstack/react-router";
import {
  Brain,
  MessageSquare,
  BarChart3,
  LineChart,
  Zap,
  Compass,
  Landmark,
  FlaskConical,
} from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/intelligence")({
  head: () => ({
    meta: [
      { title: "UIG Intelligence — AI Built for Africa" },
      {
        name: "description",
        content:
          "Native African language LLMs, business AI, predictive analytics and machine learning solutions for Nigerian and African enterprises.",
      },
      { property: "og:title", content: "UIG Intelligence — AI Built for Africa" },
      {
        property: "og:description",
        content: "AI that understands Nigeria. Models that speak your language.",
      },
    ],
  }),
  component: () => (
    <DivisionPage
      slug="intelligence"
      eyebrow="UIG Intelligence"
      title={
        <>
          Intelligence, Built for <span className="text-gradient-gold">Africa.</span>
        </>
      }
      subtitle="Global AI is built on Western data, Western languages and Western contexts. When a Yoruba farmer, an Igbo trader or a Hausa student interacts with mainstream AI, they're an afterthought. UIG Intelligence exists to fix that — permanently."
      solutions={[
        {
          title: "Native African Language AI Models",
          description:
            "Proprietary LLMs trained on Yoruba, Igbo, Hausa, Pidgin and other African languages — local context, idiom, culture.",
          icon: Brain,
        },
        {
          title: "AI Chatbots for Nigerian Businesses",
          description:
            "Customer service, sales and support bots trained on your products and language. WhatsApp, web and mobile.",
          icon: MessageSquare,
        },
        {
          title: "Machine Learning Solutions",
          description:
            "Custom ML for fraud, demand forecasting, crop disease prediction and patient triage assistance.",
          icon: BarChart3,
        },
        {
          title: "Predictive Analytics Dashboards",
          description:
            "Sales forecasting, churn, inventory and financial anomaly detection — surfaced from your operational data.",
          icon: LineChart,
        },
        {
          title: "Business Process Automation",
          description:
            "Document processing, data entry, invoice matching, report generation and email triage at scale.",
          icon: Zap,
        },
        {
          title: "AI Integration Consulting",
          description:
            "From vendor selection to custom models — we guide the entire AI integration journey.",
          icon: Compass,
        },
        {
          title: "AI for Government & Public Sector",
          description:
            "AI tax filing, smart procurement, predictive infrastructure maintenance and population analytics.",
          icon: Landmark,
        },
        {
          title: "AI Research & Development",
          description:
            "Open contributions to African datasets and ongoing R&D pushing the field forward.",
          icon: FlaskConical,
        },
      ]}
      realtime={[
        "Live AI model API endpoints for enterprise clients",
        "Real-time analytics dashboard updates",
        "Live chatbot performance monitoring",
        "Model retraining pipelines on new data",
      ]}
      targetClients={[
        "Banks & fintechs",
        "Telecoms",
        "Government agencies",
        "Media companies",
        "Healthcare providers",
        "Retail & e-commerce",
        "Education platforms",
      ]}
      metrics={[
        { value: "3", label: "Native NG-language models in dev" },
        { value: "8", label: "Enterprise AI integrations live" },
        { value: "94%", label: "Yoruba intent recognition" },
        { value: "500K+", label: "Hausa training tokens" },
      ]}
      ctaTitle="Explore AI solutions for your business."
      ctaButton="Request an AI Audit"
    />
  ),
});
