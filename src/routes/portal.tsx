import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "UIG Apex Portal — Secure Workspace for UIG Clients & Teams" },
      { name: "description", content: "Apex is the unified portal for UIG clients, partners and internal teams — projects, documents, tasks and intelligence in one place." },
      { property: "og:title", content: "UIG Apex Portal" },
      { property: "og:description", content: "Secure workspace for UIG clients and teams." },
    ],
  }),
  component: PortalLayout,
});

function PortalLayout() {
  return <Outlet />;
}
