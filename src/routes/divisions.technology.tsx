import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Workflow, Plug, Rocket, Cloud, Shield, ShoppingCart, Wrench } from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";
import { canonical } from "@/lib/seo";
import { FLAGS } from "@/lib/flags";

export const Route = createFileRoute("/divisions/technology")({
  head: () => ({
    links: [canonical("/divisions/technology")],
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
      {...(FLAGS.statusPage
        ? {
            browseCta: {
              title: "Uptime guarantees, verifiable.",
              description:
                "Live status for the web platform, portal, listings, payments and logistics API — updated by the team that runs them.",
              buttonText: "View system status",
              to: "/status",
            },
          }
        : {})}
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
      problem={{
        title: "Most Nigerian businesses are running on software that was never built for them.",
        points: [
          "Off-the-shelf tools assume reliable power, reliable bandwidth and a card-first customer — three assumptions that fail here.",
          "Operations run on WhatsApp threads and spreadsheets that nobody owns, so nothing is auditable and nothing scales.",
          "Integrations between Paystack, Flutterwave, a POS and a bank are rebuilt from scratch by every company that needs them.",
          "Agencies deliver a build, invoice, and leave — so the second release never happens and the system rots.",
        ],
      }}
      outcome="A system your team actually uses on Monday morning, that we still operate with you a year later — not a handover document."
      process={{
        title: "Six weeks from brief to production, then we stay.",
        steps: [
          {
            name: "Discovery",
            description:
              "One week on site or on calls with the people who do the work, mapping what actually happens versus what the process document says.",
          },
          {
            name: "Architecture",
            description:
              "A written plan you approve before a line is shipped: data model, integrations, rollout order, what we are deliberately not building.",
          },
          {
            name: "Build",
            description:
              "Two-week increments, each one deployed to a staging environment you can open and click through yourself.",
          },
          {
            name: "Rollout",
            description:
              "We train the operators, migrate the data, and run the old and new systems side by side until the new one is trusted.",
          },
          {
            name: "Operate",
            description:
              "Monitoring, incidents and a release cadence. Uptime is published on our own status page, not asserted in a deck.",
          },
        ],
      }}
      why={{
        title: "Why UIG Technology rather than an agency or an in-house hire.",
        points: [
          "We run six of our own businesses on this stack — the platform is proven by us before it is sold to you.",
          "One team owns discovery, build and operations, so nobody can hand a problem sideways.",
          "Integrations with Nigerian payment rails, POS hardware and banks are already written and in production.",
          "A senior engineer is accountable by name for your system, not a rotating pool.",
          "You get the code. No lock-in clause, no per-seat trap on your own data.",
          "Our AI capability comes from UIG Intelligence in-house, not a reseller agreement.",
        ],
      }}
      ctaTitle="Start your digital transformation."
      ctaButton="Talk to UIG Technology"
    />
  ),
});
