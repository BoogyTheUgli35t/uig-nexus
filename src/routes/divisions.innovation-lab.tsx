import { createFileRoute } from "@tanstack/react-router";
import { Beaker, Rocket, FlaskConical, Handshake } from "lucide-react";
import { DivisionPage } from "@/components/site/DivisionPage";

export const Route = createFileRoute("/divisions/innovation-lab")({
  head: () => ({
    meta: [
      { title: "UIG Innovation Lab — Venture Studio & R&D Partnerships" },
      { name: "description", content: "The UIG Innovation Lab partners with founders, corporates and investors to build prototypes, test concepts and launch new ventures." },
      { property: "og:title", content: "UIG Innovation Lab" },
      { property: "og:description", content: "Venture studio, R&D and future projects." },
    ],
  }),
  component: () => (
    <DivisionPage
      eyebrow="UIG Innovation Lab"
      title={<>Venture Studio, R&D <span className="text-gradient-gold">& Future Projects.</span></>}
      subtitle="The UIG Innovation Lab is where new ideas become real products. We partner with founders, corporates and investors to build prototypes, test concepts and launch new ventures."
      solutions={[
        { title: "Rapid prototyping", description: "From idea to working prototype in weeks, not quarters.", icon: Beaker },
        { title: "MVP development", description: "Production-grade MVPs designed to learn and iterate fast.", icon: Rocket },
        { title: "Pilot programs & experiments", description: "Structured pilots that prove or kill an idea on a clear timeline.", icon: FlaskConical },
        { title: "Startup incubation & partnerships", description: "Hands-on co-build relationships with founders and corporate partners.", icon: Handshake },
      ]}
      outcome="A pipeline of future-ready products and ventures that keep UIG two steps ahead."
      extra={{
        title: "Who we work with",
        items: [
          { name: "For startups", description: "Founders who need senior product, design and AI capacity to ship faster." },
          { name: "For corporates", description: "Enterprises looking to spin up new ventures or modernize existing ones." },
          { name: "For investors", description: "Funds wanting an execution partner for portfolio companies and theses." },
        ],
      }}
      ctaTitle="Have an idea worth building?"
      ctaButton="Propose a Collaboration"
    />
  ),
});
