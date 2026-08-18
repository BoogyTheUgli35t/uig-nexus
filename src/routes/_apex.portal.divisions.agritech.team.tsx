import { createFileRoute } from "@tanstack/react-router";
import { DivisionTeam } from "@/components/portal/DivisionTeam";

export const Route = createFileRoute("/_apex/portal/divisions/agritech/team")({
  head: () => ({
    meta: [{ title: "AgriTech team — UIG" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <DivisionTeam slug="agritech" />,
});
