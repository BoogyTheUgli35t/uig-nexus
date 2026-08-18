import { createFileRoute } from "@tanstack/react-router";
import { DivisionTeam } from "@/components/portal/DivisionTeam";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/team")({
  head: () => ({
    meta: [{ title: "Real Estate team — UIG" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <DivisionTeam slug="real-estate" />,
});
