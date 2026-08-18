import { createFileRoute } from "@tanstack/react-router";
import { DivisionTeam } from "@/components/portal/DivisionTeam";

export const Route = createFileRoute("/_apex/portal/divisions/logistics/team")({
  head: () => ({
    meta: [{ title: "Logistics team — UIG" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <DivisionTeam slug="logistics" />,
});
