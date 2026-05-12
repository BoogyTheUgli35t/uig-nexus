import { createFileRoute } from "@tanstack/react-router";
import { Sprout, Plane, Droplets, Store, BarChart3, CloudSun, Snowflake, Briefcase } from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/agritech")({
  head: () => ({
    meta: [
      { title: "UIG AgriTech — Feeding Africa Through Intelligence" },
      { name: "description", content: "AI crop monitoring, drones, smart irrigation and farm-to-market intelligence for Nigerian and African agriculture." },
      { property: "og:title", content: "UIG AgriTech — Feeding Africa Through Intelligence" },
      { property: "og:description", content: "We're not modernising agriculture. We're rebuilding it." },
    ],
  }),
  component: () => (
    <DivisionPage
      eyebrow="UIG AgriTech"
      title={<>Feeding Africa <span className="text-gradient-gold">Through Intelligence.</span></>}
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
        { title: "AI-Powered Crop Monitoring", description: "Satellite and sensor data feeds proprietary models that flag disease, drought and nutrient stress before losses hit.", icon: Sprout },
        { title: "Drone Surveillance & Spraying", description: "Aerial monitoring, precision spraying, field mapping and yield estimation for farms of any size.", icon: Plane },
        { title: "Smart Irrigation Systems", description: "Soil moisture sensors and weather APIs schedule irrigation automatically — less waste, more yield.", icon: Droplets },
        { title: "Farm-to-Market Platform", description: "Marketplace connecting farmers to processors, supermarkets, restaurants and exporters. No middlemen.", icon: Store },
        { title: "Agricultural Data Analytics", description: "Soil, weather, market and historical farm data in one dashboard. Predictive harvest and price forecasting.", icon: BarChart3 },
        { title: "Weather Intelligence", description: "Hyperlocal Nigerian-climate predictions in Yoruba, Igbo and Hausa via SMS — works on basic phones.", icon: CloudSun },
        { title: "Cold-Chain Logistics", description: "Temperature-controlled storage and transport for perishables — in partnership with UIG Logistics.", icon: Snowflake },
        { title: "Agribusiness Consulting", description: "Land assessment, crop selection, tech stack and market entry for serious investors.", icon: Briefcase },
      ]}
      realtime={[
        "Live crop health monitoring dashboards",
        "Real-time market price feeds for 20+ commodities",
        "Live weather overlays on farm maps",
        "SMS / WhatsApp alerts on basic phones, no smartphone required",
      ]}
      targetClients={["Smallholder farmers", "Commercial farm operators", "Agribusiness investors", "Food processors", "Supermarket chains", "Food security NGOs", "Federal & State Ministries of Agriculture"]}
      metrics={[
        { value: "200+", label: "Farms in network" },
        { value: "6", label: "Nigerian states" },
        { value: "35%", label: "Avg. yield uplift" },
        { value: "₦180M+", label: "F2M transactions" },
      ]}
      ctaTitle="Join the AgriTech network."
      ctaButton="Request a Farm Assessment"
    />
  ),
});
