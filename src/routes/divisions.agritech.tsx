import { createFileRoute } from "@tanstack/react-router";
import {
  Sprout,
  Plane,
  Droplets,
  Store,
  BarChart3,
  CloudSun,
  Snowflake,
  Briefcase,
} from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";
import { YieldCalculator } from "@/components/site/YieldCalculator";
import { canonical } from "@/lib/seo";

export const Route = createFileRoute("/divisions/agritech")({
  head: () => ({
    links: [canonical("/divisions/agritech")],
    meta: [
      { title: "UIG AgriTech — Feeding Africa Through Intelligence" },
      {
        name: "description",
        content:
          "AI crop monitoring, drones, smart irrigation and farm-to-market intelligence for Nigerian and African agriculture.",
      },
      { property: "og:title", content: "UIG AgriTech — Feeding Africa Through Intelligence" },
      {
        property: "og:description",
        content: "We're not modernising agriculture. We're rebuilding it.",
      },
    ],
  }),
  component: () => (
    <DivisionPage
      slug="agritech"
      eyebrow="UIG AgriTech"
      title={
        <>
          Feeding Africa <span className="text-gradient-gold">Through Intelligence.</span>
        </>
      }
      subtitle="Nigeria has 84 million hectares of arable land. Only a fraction is productively farmed. Farmers lose 40% of produce post-harvest. UIG AgriTech exists to change every one of these numbers."
      problem={{
        title: "African agriculture is held back by infrastructure, not effort.",
        points: [
          "40% post-harvest loss across the value chain",
          "Price volatility destroys farmer margins",
          "Climate unpredictability wipes out entire seasons",
          "Smallholders cut off from real markets and real data",
        ],
      }}
      solutions={[
        {
          title: "AI-Powered Crop Monitoring",
          description:
            "Satellite and sensor data feeds proprietary models that flag disease, drought and nutrient stress before losses hit.",
          icon: Sprout,
        },
        {
          title: "Drone Surveillance & Spraying",
          description:
            "Aerial monitoring, precision spraying, field mapping and yield estimation for farms of any size.",
          icon: Plane,
        },
        {
          title: "Smart Irrigation Systems",
          description:
            "Soil moisture sensors and weather APIs schedule irrigation automatically — less waste, more yield.",
          icon: Droplets,
        },
        {
          title: "Farm-to-Market Platform",
          description:
            "Marketplace connecting farmers to processors, supermarkets, restaurants and exporters. No middlemen.",
          icon: Store,
        },
        {
          title: "Agricultural Data Analytics",
          description:
            "Soil, weather, market and historical farm data in one dashboard. Predictive harvest and price forecasting.",
          icon: BarChart3,
        },
        {
          title: "Weather Intelligence",
          description:
            "Hyperlocal Nigerian-climate predictions in Yoruba, Igbo and Hausa via SMS — works on basic phones.",
          icon: CloudSun,
        },
        {
          title: "Cold-Chain Logistics",
          description:
            "Temperature-controlled storage and transport for perishables — in partnership with UIG Logistics.",
          icon: Snowflake,
        },
        {
          title: "Agribusiness Consulting",
          description:
            "Land assessment, crop selection, tech stack and market entry for serious investors.",
          icon: Briefcase,
        },
      ]}
      realtime={[
        "Live crop health monitoring dashboards",
        "Real-time market price feeds for 20+ commodities",
        "Live weather overlays on farm maps",
        "SMS / WhatsApp alerts on basic phones, no smartphone required",
      ]}
      targetClients={[
        "Smallholder farmers",
        "Commercial farm operators",
        "Agribusiness investors",
        "Food processors",
        "Supermarket chains",
        "Food security NGOs",
        "Federal & State Ministries of Agriculture",
      ]}
      metrics={[
        { value: "200+", label: "Farms in network" },
        { value: "6", label: "Nigerian states" },
        { value: "35%", label: "Avg. yield uplift" },
        { value: "₦180M+", label: "F2M transactions" },
      ]}
      tool={{
        eyebrow: "Try it yourself",
        title: "Estimate your yield and ROI.",
        description:
          "A quick, editable model for prospective farmers and agribusiness investors — pick a crop, set your farm size, and adjust the numbers to your local market.",
        component: <YieldCalculator />,
      }}
      outcome="A farmer who knows what their field will yield before harvest, and a buyer who knows the produce exists before they pay for it."
      process={{
        title: "How a farm joins the network.",
        steps: [
          {
            name: "Register",
            description:
              "A field officer visits, records the plot boundaries, crop and hectarage, and links the farmer to their own portal account.",
          },
          {
            name: "Instrument",
            description:
              "Soil moisture and temperature sensors go in, and the plot enters the drone survey rotation.",
          },
          {
            name: "Monitor",
            description:
              "Field health is scored continuously. Anything trending toward at-risk raises an alert to the farmer and the field officer at once.",
          },
          {
            name: "Forecast",
            description:
              "Once there is a season of readings, yield prediction runs per field with a stated confidence — not a single optimistic number.",
          },
          {
            name: "Sell",
            description:
              "Forecast volume is matched to buyers ahead of harvest, and the farmer is paid in Naira within 24 hours of delivery.",
          },
        ],
      }}
      why={{
        title: "Why UIG AgriTech works where agritech pilots usually stall.",
        points: [
          "Alerts reach the farmer by SMS, because assuming a smartphone excludes most of the people who need them.",
          "Hardware is chosen for Nigerian humidity and dust, not for a demo in a temperate climate.",
          "Every farmer gets their own portal login — their fields, their forecasts, their alerts, not a report about them.",
          "Field officers are ours. The data is collected by people we train and are accountable for.",
          "Yield forecasts carry a confidence figure, so a low-confidence number can be treated as one.",
          "Farm-to-market is part of the same system, so a good forecast turns into a sale rather than a spreadsheet.",
        ],
      }}
      ctaTitle="Join the AgriTech network."
      ctaButton="Request a Farm Assessment"
    />
  ),
});
