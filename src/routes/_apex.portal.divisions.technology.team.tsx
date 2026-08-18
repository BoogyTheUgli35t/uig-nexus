import { createFileRoute } from "@tanstack/react-router";
import { DivisionTeam } from "@/components/portal/DivisionTeam";

export const Route = createFileRoute("/_apex/portal/divisions/technology/team")({
  head: () => ({
    meta: [{ title: "Technology team — UIG" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <DivisionTeam slug="technology" />,
});
