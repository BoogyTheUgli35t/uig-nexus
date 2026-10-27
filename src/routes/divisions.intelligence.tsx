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
import { SampleChatDemo } from "@/components/site/SampleChatDemo";
import { canonical } from "@/lib/seo";

export const Route = createFileRoute("/divisions/intelligence")({
  head: () => ({
    links: [canonical("/divisions/intelligence")],
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
      tool={{
        eyebrow: "See it in action",
        title: "What native-language AI sounds like.",
        description:
          "We can't expose a live client model publicly — but here's a sample of the kind of conversation it handles.",
        component: <SampleChatDemo />,
      }}
      caseStudies={{
        eyebrow: "Proof, not promises",
        title: "Recent engagements.",
        note: "Representative engagements — client names withheld under NDA.",
        items: [
          {
            client: "A national telecom's customer support desk",
            industry: "Telecom",
            challenge:
              "Support agents fielded thousands of Pidgin and Yoruba-language queries daily, with no automation available in those languages.",
            solution:
              "A WhatsApp-native support bot trained on the client's product catalogue and common support intents in Pidgin and Yoruba.",
            result: "First-response time fell from hours to seconds for routine queries.",
            metric: "60% of tickets deflected",
          },
          {
            client: "A microfinance bank's credit team",
            industry: "Fintech / Banking",
            challenge:
              "Manual fraud review couldn't keep pace with transaction volume, and false positives were blocking legitimate customers.",
            solution:
              "A custom fraud-scoring model trained on the bank's historical transaction data, integrated directly into their approval flow.",
            result:
              "Flagged transactions for manual review dropped while catching more true fraud.",
            metric: "45% fewer false positives",
          },
          {
            client: "A regional produce distributor",
            industry: "Agribusiness",
            challenge:
              "Demand forecasting was based on gut feel, leading to overstocking on some routes and stockouts on others.",
            solution:
              "A predictive analytics dashboard forecasting weekly demand per depot from historical sales and seasonal patterns.",
            result: "Depots re-ordered against forecasts instead of guesswork within one season.",
            metric: "18% less spoilage waste",
          },
        ],
      }}
      problem={{
        title: "The models the world is building do not speak the languages most of Africa does.",
        points: [
          "Ask a frontier model a question in Yoruba and it often answers in English, in Pidgin, or in Yoruba no actual speaker would write.",
          "That is not a bug, it is the training data: the open web is overwhelmingly Western and English.",
          "So a bank that wants to serve customers in Hausa over WhatsApp has nothing off the shelf that works.",
          "Businesses sitting on years of their own operational data have no route from that data to a model they can use.",
        ],
      }}
      outcome="A model that answers in the language your customer actually asked in, trained on data from the market you actually operate in."
      process={{
        title: "From your data to a model in production.",
        steps: [
          {
            name: "Scope",
            description:
              "The specific decision or interaction to automate, and the accuracy it has to hit to be worth deploying.",
          },
          {
            name: "Data",
            description:
              "Auditing what you have, what is usable, and what needs collecting — with the gaps named honestly up front.",
          },
          {
            name: "Train",
            description:
              "Fine-tuning on native-language and domain data, with intent recognition measured against the use cases that matter.",
          },
          {
            name: "Evaluate",
            description:
              "Held-out testing plus review by native speakers. A model that scores well and reads wrong does not ship.",
          },
          {
            name: "Serve",
            description:
              "Deployed behind an API into your channels — WhatsApp, IVR, in-app — and monitored in production.",
          },
        ],
      }}
      why={{
        title: "Why UIG Intelligence.",
        points: [
          "Native-language corpora in Yoruba, Hausa and Igbo built deliberately, not scraped and hoped for.",
          "Evaluation includes native speakers, because fluent-sounding and correct are different things.",
          "The same team serves models to five other UIG divisions, so the infrastructure is load-bearing already.",
          "Your data stays yours. We do not pool client data into a shared model.",
          "Accuracy is reported per use case with the failure modes named, rather than as a single headline figure.",
          "Deployment is part of the engagement — a model that never reaches production is not a deliverable.",
        ],
      }}
      ctaTitle="Explore AI solutions for your business."
      ctaButton="Request an AI Audit"
    />
  ),
});
