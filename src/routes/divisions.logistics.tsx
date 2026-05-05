import { createFileRoute } from "@tanstack/react-router";
import { Truck, MapPin, Route as RouteIcon, Eye } from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/logistics")({
  head: () => ({
    meta: [
      { title: "UIG Logistics — Fleet Intelligence & Route Optimization" },
      { name: "description", content: "UIG Logistics builds the digital backbone for modern logistics: tracking, fleet management and AI route optimization." },
      { property: "og:title", content: "UIG Logistics" },
      { property: "og:description", content: "Fleet intelligence, tracking systems and route optimization." },
    ],
  }),
  component: () => (
    <DivisionPage
      eyebrow="UIG Logistics"
      title={<>Intelligent Logistics <span className="text-gradient-gold">& Fleet Optimization.</span></>}
      subtitle="UIG Logistics creates systems that track shipments, manage fleets and optimize routes using real-time data and AI."
      problem={{
        title: "Poor visibility, manual dispatch, no tracking.",
        points: [
          "Customers calling to ask where their shipment is",
          "Dispatchers running on phone calls and gut feel",
          "Fuel and time wasted on suboptimal routes",
          "No data to negotiate better rates or contracts",
        ],
      }}
      solutions={[
        { title: "Shipment tracking dashboards", description: "End-to-end visibility for ops teams and customer-facing portals.", icon: Eye },
        { title: "Driver & fleet management tools", description: "Manage drivers, vehicles, assignments and compliance from one place.", icon: Truck },
        { title: "Route optimization & dispatch intelligence", description: "AI-assisted routing that cuts time, fuel and overtime.", icon: RouteIcon },
        { title: "Customer tracking portals", description: "White-label customer experiences with live ETAs and notifications.", icon: MapPin },
      ]}
      outcome="Lower fuel costs, faster deliveries, and complete operational visibility."
      ctaTitle="Ready to optimize your logistics?"
      ctaButton="Optimize My Logistics"
    />
  ),
});
