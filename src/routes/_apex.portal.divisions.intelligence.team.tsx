import { createFileRoute } from "@tanstack/react-router";
import { DivisionTeam } from "@/components/portal/DivisionTeam";

export const Route = createFileRoute("/_apex/portal/divisions/intelligence/team")({
  head: () => ({
    meta: [{ title: "Intelligence team — UIG" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <DivisionTeam slug="intelligence" />,
});
