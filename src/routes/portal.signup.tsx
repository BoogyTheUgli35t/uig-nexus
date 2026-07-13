import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/signup")({
  component: () => <Outlet />,
});
