// Plain, import-safe division catalog for MCP tools.
// Mirrors src/lib/divisions.ts but without icon/image imports so the module
// stays safe to evaluate at build time and on the Worker cold start.

export type McpDivisionModule = {
  label: string;
  description: string;
  status: "live" | "soon";
};

export type McpDivision = {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  description: string;
  modules: McpDivisionModule[];
};

export const MCP_DIVISIONS: McpDivision[] = [
  {
    slug: "technology",
    name: "UIG Technology",
    short: "Technology",
    tagline: "AI-powered software, portals & automation",
    description:
      "We build the digital infrastructure Africa deserves — custom software, SaaS platforms, automation engines and the integrations that connect them.",
    modules: [
      { label: "Project board", description: "Kanban + timeline across every client engagement.", status: "live" },
      { label: "Client portal", description: "Live project status, invoices and documents.", status: "live" },
      { label: "Automation engine", description: "Trigger-based workflow rules and run history.", status: "soon" },
      { label: "Integration hub", description: "Connect and monitor third-party APIs and services.", status: "live" },
    ],
  },
  {
    slug: "agritech",
    name: "UIG AgriTech",
    short: "AgriTech",
    tagline: "Smart agriculture, IoT & yield intelligence",
    description:
      "Sensors, drones and AI working the land — onboarding farmers and cooperatives, monitoring fields and forecasting yields across Nigeria.",
    modules: [
      { label: "Farmer onboarding", description: "Register farmers and cooperatives in minutes.", status: "live" },
      { label: "Field dashboard", description: "Map view with live sensor and drone data.", status: "live" },
      { label: "Yield prediction", description: "AI-forecasted yields by field and season.", status: "live" },
      { label: "Cooperative management", description: "Group farmers, share inputs, track output.", status: "soon" },
    ],
  },
  {
    slug: "real-estate",
    name: "UIG Real Estate",
    short: "Real Estate",
    tagline: "Property systems, CRM & investor dashboards",
    description:
      "Smart buildings and smarter operations — property management, tenant portals, investor ROI dashboards and a full sales CRM.",
    modules: [
      { label: "Property listings", description: "Manage the full portfolio with rich detail.", status: "live" },
      { label: "Tenant portal", description: "Payments, documents and maintenance requests.", status: "live" },
      { label: "Investor dashboard", description: "Portfolio value, ROI and distributions.", status: "live" },
      { label: "CRM pipeline", description: "Track leads from enquiry to close.", status: "live" },
    ],
  },
  {
    slug: "logistics",
    name: "UIG Logistics",
    short: "Logistics",
    tagline: "Fleet intelligence, shipments & routing",
    description:
      "Moving goods across Africa with precision — shipment tracking, fleet and driver management, and AI-assisted route optimization.",
    modules: [
      { label: "Shipment tracking", description: "Live status board and map view.", status: "live" },
      { label: "Driver tasks", description: "Mobile-friendly assignments and proof of delivery.", status: "live" },
      { label: "Fleet management", description: "Vehicles, capacity and maintenance records.", status: "live" },
      { label: "Route optimization", description: "Smart routing across multiple waypoints.", status: "live" },
    ],
  },
  {
    slug: "intelligence",
    name: "UIG Intelligence",
    short: "Intelligence",
    tagline: "AI models, predictive analytics & automation",
    description:
      "The brain of the group — predictive analytics, an AI assistant, and the UIG Model Trainer where our proprietary AI is built and deployed across every division.",
    modules: [
      { label: "AI assistant", description: "Chat with UIG's models for insight on demand.", status: "live" },
      { label: "Predictive analytics", description: "Forecasts and trends across the group.", status: "live" },
      { label: "Model Trainer", description: "Upload datasets, train and deploy models.", status: "live" },
      { label: "Datasets", description: "Secure dataset library for every division.", status: "live" },
    ],
  },
  {
    slug: "innovation-lab",
    name: "UIG Innovation Lab",
    short: "Innovation Lab",
    tagline: "Venture studio, prototyping & incubation",
    description:
      "Where the next ventures are born — idea submission, prototype tracking, partner collaboration and an experiment log, wired into Intelligence for AI experiments.",
    modules: [
      { label: "Idea submission", description: "Capture ideas from every division.", status: "soon" },
      { label: "Prototype tracker", description: "Status board from concept to demo.", status: "soon" },
      { label: "Partner collaboration", description: "Co-build with partners and investors.", status: "soon" },
      { label: "Experiment log", description: "Run AI experiments via the Model Trainer.", status: "soon" },
    ],
  },
];
