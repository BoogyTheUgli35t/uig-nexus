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
      ctaTitle="Start your digital transformation."
      ctaButton="Talk to UIG Technology"
    />
  ),
});
