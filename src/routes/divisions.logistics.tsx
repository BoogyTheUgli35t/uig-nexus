import { createFileRoute } from "@tanstack/react-router";
import {
  Truck,
  Map,
  PackageCheck,
  Warehouse,
  Workflow,
  Snowflake,
  Container,
  Plug,
} from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/logistics")({
  head: () => ({
    meta: [
      { title: "UIG Logistics — Moving Nigeria Forward" },
      {
        name: "description",
        content:
          "Last-mile delivery, fleet tracking, warehousing, cold-chain and supply chain intelligence across Nigeria.",
      },
      { property: "og:title", content: "UIG Logistics — Moving Nigeria Forward" },
      {
        property: "og:description",
        content: "Last mile to first class — supply chain intelligence for modern Africa.",
      },
    ],
  }),
  component: () => (
    <DivisionPage
      slug="logistics"
      eyebrow="UIG Logistics"
      title={
        <>
          Moving Nigeria <span className="text-gradient-gold">Forward.</span>
        </>
      }
      subtitle="Nigeria's logistics gap costs businesses billions annually. Failed deliveries, opaque supply chains, no cold chain, untracked fleets. UIG Logistics brings intelligence, reliability and technology to every link."
      problem={{
        title: "The Nigerian logistics tax is real — and avoidable.",
        points: [
          "Failed deliveries and opaque tracking erode customer trust",
          "Zero cold-chain infrastructure for pharma and perishables",
          "Untracked fleets bleed cost through fuel, theft and downtime",
          "Manufacturers move blind across multi-leg supply chains",
        ],
      }}
      solutions={[
        {
          title: "Last-Mile Delivery",
          description:
            "Fast, trackable delivery across Lagos, Abuja, PH, Kano and Ibadan — real-time tracking for senders and receivers.",
          icon: Truck,
        },
        {
          title: "Fleet Tracking & Management",
          description:
            "GPS fleet platform with driver behaviour, fuel analytics and predictive maintenance.",
          icon: Map,
        },
        {
          title: "E-Commerce Fulfillment",
          description:
            "Receive, store, pick-pack-ship and handle returns — so online businesses focus on selling.",
          icon: PackageCheck,
        },
        {
          title: "Warehouse Management",
          description:
            "Barcode/RFID inventory, automated stock alerts and integration with major e-commerce platforms.",
          icon: Warehouse,
        },
        {
          title: "Supply Chain Optimisation",
          description:
            "We map, analyse and redesign supply chains for manufacturers, FMCGs and retailers.",
          icon: Workflow,
        },
        {
          title: "Cold-Chain Logistics",
          description:
            "IoT temperature-monitored storage and transport for pharma, food and medical supplies.",
          icon: Snowflake,
        },
        {
          title: "Freight & Haulage",
          description:
            "Long-distance and interstate haulage plus port coordination for import/export.",
          icon: Container,
        },
        {
          title: "Logistics API for Platforms",
          description: "Booking, tracking and rate calculation API for any e-commerce platform.",
          icon: Plug,
        },
      ]}
      realtime={[
        "Live delivery tracking map (public link per shipment)",
        "Real-time driver location for fleet clients",
        "Live warehouse inventory dashboard",
        "Automated SMS and WhatsApp delivery updates",
      ]}
      targetClients={[
        "E-commerce",
        "FMCG brands",
        "Pharmaceuticals",
        "Manufacturers",
        "Food & beverage",
        "Government procurement",
        "Agricultural value chain",
      ]}
      metrics={[
        { value: "10K+/mo", label: "Deliveries" },
        { value: "5", label: "Warehouse locations" },
        { value: "98.2%", label: "On-time rate" },
        { value: "300+", label: "Active business clients" },
      ]}
      ctaTitle="Get a logistics quote."
      ctaButton="Integrate Our Delivery API"
    />
  ),
});
