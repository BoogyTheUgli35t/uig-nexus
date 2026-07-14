import { createFileRoute } from "@tanstack/react-router";
import {
  Beaker,
  Rocket,
  Building2,
  Lightbulb,
  FlaskConical,
  GraduationCap,
  Users,
  Coins,
} from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/innovation-lab")({
  head: () => ({
    meta: [
      { title: "UIG Innovation Lab — Where Nigeria's Next Big Ideas Are Born" },
      {
        name: "description",
        content:
          "Incubation, acceleration, R&D, talent development and venture investing for Nigerian founders and corporates.",
      },
      { property: "og:title", content: "UIG Innovation Lab" },
      {
        property: "og:description",
        content: "We don't wait for the future. We fund it, build it and ship it.",
      },
    ],
  }),
  component: () => (
    <DivisionPage
      slug="innovation-lab"
      eyebrow="UIG Innovation Lab"
      title={
        <>
          Where Nigeria's Next Big Ideas <span className="text-gradient-gold">Are Born.</span>
        </>
      }
      subtitle="UIG Innovation Lab is the incubation, acceleration and R&D engine of the group. We find the most talented, hungry minds in Nigeria, back them with resources, and help them build category-defining companies."
      solutions={[
        {
          title: "Startup Incubation Programme",
          description:
            "6-month cohort with office space, mentorship, infrastructure access, investor intros and a seed funding pathway.",
          icon: Beaker,
        },
        {
          title: "Startup Acceleration",
          description:
            "Growth capital, operational support and customer introductions through the UIG Group network.",
          icon: Rocket,
        },
        {
          title: "UIG Innovation Hub",
          description:
            "Premium Lagos co-working: meeting rooms, podcast studio, prototyping lab and event space.",
          icon: Building2,
        },
        {
          title: "Corporate Innovation Consulting",
          description:
            "Internal innovation programmes, hackathons, intrapreneur identification and new product line builds.",
          icon: Lightbulb,
        },
        {
          title: "R&D for Emerging Tech",
          description:
            "Blockchain land registry, AI healthcare diagnostics, rural drone delivery, renewable energy management.",
          icon: FlaskConical,
        },
        {
          title: "Tech Talent Development",
          description:
            "Software, data, AI and product training in partnership with universities and vocational institutions.",
          icon: GraduationCap,
        },
        {
          title: "Investor-Startup Matchmaking",
          description:
            "Curated deal flow and quarterly showcase events for angels and VCs interested in Nigerian tech.",
          icon: Users,
        },
        {
          title: "UIG Ventures (Investment Arm)",
          description:
            "Pre-seed and seed equity into startups aligned with UIG's multi-sector vision.",
          icon: Coins,
        },
      ]}
      realtime={[
        "Live application portal for startup incubation",
        "Real-time cohort progress tracking dashboard",
        "Online event booking for Innovation Hub",
        "Public innovation challenge submission portal",
      ]}
      targetClients={[
        "Early-stage founders",
        "Student entrepreneurs",
        "Post-revenue startups",
        "Corporate innovation teams",
        "Angel investors & VCs",
        "Government innovation agencies",
        "University partners",
      ]}
      metrics={[
        { value: "15", label: "Startups in 2025 pipeline" },
        { value: "3", label: "Cohorts planned Year 1" },
        { value: "₦50M", label: "Seed fund committed" },
        { value: "200", label: "Innovation Hub seats" },
      ]}
      browseCta={{
        title: "Got an idea? We want to hear it.",
        description:
          "Submit your startup idea directly — every submission is reviewed by the Innovation Lab team, and strong ideas get a follow-up call.",
        buttonText: "Submit your idea",
        to: "/divisions/innovation-lab/submit",
      }}
      ctaTitle="Apply to the incubation programme."
      ctaButton="Visit the Innovation Hub"
    />
  ),
});
