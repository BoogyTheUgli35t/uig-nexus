import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Workflow, Plug, Rocket, Cloud, Shield, ShoppingCart, Wrench } from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/technology")({
  head: () => ({
    meta: [
      { title: "UIG Technology — Engineering Nigeria's Digital Future" },
      {
        name: "description",
        content:
          "Custom software, SaaS, cloud, cybersecurity and digital transformation for Nigerian and African businesses.",
      },
      { property: "og:title", content: "UIG Technology — Engineering Nigeria's Digital Future" },
      { property: "og:description", content: "We build the software that runs modern Africa." },
    ],
  }),
  component: () => (
    <DivisionPage
      slug="technology"
      eyebrow="UIG Technology"
      title={
        <>
          Engineering Nigeria's <span className="text-gradient-gold">Digital Future.</span>
        </>
      }
      subtitle="UIG Technology is the digital transformation arm of the group. We design, build and deploy the software systems that help Nigerian and African businesses compete in a technology-driven world."
      solutions={[
        {
          title: "Custom Software Development",
          description:
            "Web, iOS and Android apps and enterprise platforms — stack-agnostic, scalable, built to last.",
          icon: Cpu,
        },
        {
          title: "SaaS Product Design & Build",
          description:
            "Full product lifecycle from wireframe to paying customers for clients entering new digital markets.",
          icon: Rocket,
        },
        {
          title: "Digital Transformation Consulting",
          description:
            "We audit legacy systems, design transformation roadmaps and execute them — retail, manufacturing, finance, healthcare.",
          icon: Workflow,
        },
        {
          title: "Cloud Infrastructure & DevOps",
          description:
            "AWS, GCP and Azure setup, CI/CD, containerisation and monitoring — fast, secure, cost-efficient.",
          icon: Cloud,
        },
        {
          title: "API Development & Systems Integration",
          description:
            "Robust APIs that connect ERPs, CRMs, payment gateways and third-party tools — no more data silos.",
          icon: Plug,
        },
        {
          title: "Cybersecurity Advisory",
          description:
            "Vulnerability assessments, security architecture review and staff awareness — built for Nigerian compliance.",
          icon: Shield,
        },
        {
          title: "IT Consulting for SMEs",
          description:
            "Practical, affordable strategy: stack recommendations, vendor selection and implementation support.",
          icon: Wrench,
        },
        {
          title: "E-Commerce Development",
          description:
            "Online stores with Paystack, Flutterwave and Stripe, inventory and delivery API integration.",
          icon: ShoppingCart,
        },
      ]}
      realtime={[
        "Live project dashboards for clients",
        "Real-time deployment monitoring",
        "Uptime guarantees and SLA management",
        "24/7 technical support tier for enterprise clients",
      ]}
      targetClients={[
        "Nigerian SMEs",
        "Banks & Fintechs",
        "Government Agencies",
        "Healthcare Providers",
        "Retail Chains",
        "Startups",
        "International market entrants",
      ]}
      metrics={[
        { value: "40+", label: "Products delivered" },
        { value: "12", label: "Industries served" },
        { value: "98%", label: "Client retention" },
        { value: "6 wks", label: "Avg. deployment" },
      ]}
      browseCta={{
        title: "Uptime guarantees, verifiable.",
        description:
          "Live status for the web platform, portal, listings, payments and logistics API — updated by the team that runs them.",
        buttonText: "View system status",
        to: "/status",
      }}
      caseStudies={{
        eyebrow: "Proof, not promises",
        title: "Recent engagements.",
        note: "Representative engagements — client names withheld under NDA.",
        items: [
          {
            client: "A Lagos-based payments fintech",
            industry: "Fintech",
            challenge:
              "Finance ops spent ~20 hours a week manually reconciling transactions across three payment processors.",
            solution:
              "A unified reconciliation dashboard integrating Paystack, Flutterwave and Stripe via their settlement APIs, with automated mismatch flagging.",
            result: "Manual reconciliation work dropped from 20 hours/week to under 2.",
            metric: "90% less reconciliation time",
          },
          {
            client: "A 12-store regional retail chain",
            industry: "Retail",
            challenge:
              "No real-time inventory visibility across locations — frequent stockouts on fast-moving items.",
            solution:
              "A cloud inventory platform integrated with existing POS terminals, with predictive restock alerts per store.",
            result: "Stockouts on top-selling SKUs dropped sharply within the first quarter.",
            metric: "32% fewer stockouts",
          },
          {
            client: "A multi-clinic healthcare network",
            industry: "Healthcare",
            challenge:
              "Patient records fragmented across paper files and two incompatible legacy systems.",
            solution:
              "A unified, role-based patient records platform with a phased migration plan to avoid clinic downtime.",
            result: "40,000+ patient records migrated with zero data loss.",
            metric: "6-week full migration",
          },
        ],
      }}
      ctaTitle="Start your digital transformation."
      ctaButton="Talk to UIG Technology"
    />
  ),
});
