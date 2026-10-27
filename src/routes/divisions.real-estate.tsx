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
import { MortgageCalculator } from "@/components/site/MortgageCalculator";
import { canonical } from "@/lib/seo";

export const Route = createFileRoute("/divisions/real-estate")({
  head: () => ({
    links: [canonical("/divisions/real-estate")],
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
        { value: "5 cities", label: "Active markets" },
      ]}
      browseCta={{
        title: "Browse live listings by location.",
        description:
          "Houses, apartments, commercial space and land for sale or rent across Lagos, Abuja, Port Harcourt, Enugu and Kano — with full photo galleries for every listing.",
        buttonText: "Browse listings",
        to: "/divisions/real-estate/listings",
      }}
      tool={{
        eyebrow: "Work the numbers first",
        title: "What would the monthly repayment be?",
        description:
          "Set a price, a deposit and a tenure to see the monthly figure and the total interest. Indicative only — your bank's terms decide the real number — but it is the calculation worth doing before you fall in love with a property.",
        component: <MortgageCalculator price={120_000_000} />,
      }}
      problem={{
        title: "Nigerian property is a good asset class wrapped in a bad process.",
        points: [
          "Title verification is slow, manual and opaque — most buyers commit before they truly know what they are buying.",
          "Prime Ikoyi and Victoria Island yields have compressed to a fraction of what they were, and most buyers have not adjusted.",
          "Listings are marketed with photos of somewhere else, so a viewing is the first honest data point.",
          "Diaspora investors have no way to inspect, manage or collect rent without trusting someone on the ground.",
          "Landlords track tenants, leases and rent in a notebook, so arrears are discovered months late.",
        ],
      }}
      outcome="Verified title, real photography of the actual unit, and a portal where you can see your rent, your lease and your maintenance requests without phoning anyone."
      process={{
        title: "From enquiry to keys, with the paperwork done properly.",
        steps: [
          {
            name: "Brief",
            description:
              "Budget, corridor, horizon and structure. We will tell you when the corridor you named is the wrong one for your horizon.",
          },
          {
            name: "Shortlist",
            description:
              "Three to five properties that actually fit, each with real photography of the unit — exterior, interior and surroundings.",
          },
          {
            name: "Due diligence",
            description:
              "Title search, survey, encumbrance and governor's consent status — documented before you transfer anything.",
          },
          {
            name: "Close",
            description:
              "Structuring, payment schedule and registration, with every document filed against the property in the Apex Portal.",
          },
          {
            name: "Manage",
            description:
              "Tenanting, rent collection, maintenance and reporting — visible to you in the portal, wherever you are.",
          },
        ],
      }}
      why={{
        title: "Why buy through UIG Real Estate.",
        points: [
          "Title verification happens before you see a payment schedule, not after.",
          "Every photograph on a listing is of that unit. Where we are showing an illustrative render, we label it.",
          "A quarterly index across sub-markets in Lagos, Abuja and Port Harcourt informs what we recommend, and we share the data.",
          "Diaspora clients get the same portal view as local ones: documents, rent status, maintenance, all live.",
          "Property management and acquisition sit in the same team, so the yield we project is the yield we then have to deliver.",
          "We will talk you out of a bad buy. A single closed deal is worth less to us than a client who comes back.",
        ],
      }}
      ctaTitle="Looking for something specific?"
      ctaButton="Speak to an Investment Advisor"
    />
  ),
});
