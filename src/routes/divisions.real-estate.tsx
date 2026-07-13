import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Home,
  Building,
  TrendingUp,
  FileCheck,
  ClipboardList,
  HeartHandshake,
  BarChart3,
} from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/real-estate")({
  head: () => ({
    meta: [
      { title: "UIG Real Estate — Property Intelligence for a New Nigeria" },
      {
        name: "description",
        content:
          "Property sourcing, smart developments, investment advisory and PropTech across Lagos, Abuja, Port Harcourt and Enugu.",
      },
      {
        property: "og:title",
        content: "UIG Real Estate — Property Intelligence for a New Nigeria",
      },
      {
        property: "og:description",
        content: "Where data meets land. Where vision meets investment.",
      },
    ],
  }),
  component: () => (
    <DivisionPage
      slug="real-estate"
      eyebrow="UIG Real Estate"
      title={
        <>
          Property Intelligence for a <span className="text-gradient-gold">New Nigeria.</span>
        </>
      }
      subtitle="UIG Real Estate combines property expertise with technology to give investors, developers and homebuyers an edge in Nigeria's complex but lucrative real estate market."
      solutions={[
        {
          title: "Property Sourcing & Acquisition",
          description:
            "High-value land and property opportunities across Lagos, Abuja, PH and emerging cities — data-driven, title-verified.",
          icon: Building2,
        },
        {
          title: "Smart Residential Development",
          description:
            "Homes built with security automation, energy management and connectivity infrastructure from day one.",
          icon: Home,
        },
        {
          title: "Commercial Development",
          description:
            "Office, retail and mixed-use developments designed for Nigeria's growing business class and multinationals.",
          icon: Building,
        },
        {
          title: "Investment Advisory",
          description:
            "Diaspora and HNI structuring, due diligence and performance reporting for Nigerian real estate exposure.",
          icon: TrendingUp,
        },
        {
          title: "Land Documentation & Verification",
          description:
            "C of O, excision and title integrity verification — protecting buyers from fraud.",
          icon: FileCheck,
        },
        {
          title: "Property Management Tech",
          description:
            "Tenant management, rent automation, maintenance tracking and occupancy optimisation for landlords.",
          icon: ClipboardList,
        },
        {
          title: "Affordable Housing Initiative",
          description:
            "Dignified, affordable urban housing in partnership with state governments and DFIs.",
          icon: HeartHandshake,
        },
        {
          title: "Market Intelligence Reports",
          description:
            "Quarterly data on prices, yields and trends across major Nigerian cities — for serious investors.",
          icon: BarChart3,
        },
      ]}
      realtime={[
        "Live property listings database (land and built)",
        "Real-time price index for Lagos, Abuja and Port Harcourt",
        "Online investment enquiry and documentation portal",
        "Virtual property tours",
      ]}
      targetClients={[
        "Diaspora Nigerians",
        "Local HNIs & investors",
        "Developers",
        "Corporate office seekers",
        "Government housing agencies",
        "First-time homebuyers",
      ]}
      metrics={[
        { value: "₦2B+", label: "Transactions facilitated" },
        { value: "500+", label: "Properties verified" },
        { value: "12", label: "Projects in pipeline" },
        { value: "4 cities", label: "Active markets" },
      ]}
      ctaTitle="Browse available properties."
      ctaButton="Speak to an Investment Advisor"
    />
  ),
});
