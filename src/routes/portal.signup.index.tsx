import { createFileRoute, redirect } from "@tanstack/react-router";

// NOTE: This file previously duplicated the full signup page at the
// "/portal/signup/" (trailing-slash / index) path. That duplicate had gone
// stale — it pointed at a "/portal/signup/choose-division" route that no
// longer exists (the canonical signup flow now lives in portal.signup.tsx
// and redirects to "/portal/choose-division"). Rather than maintain two
// parallel signup implementations, this index route now simply forwards to
// the canonical one so no dead links remain reachable.
export const Route = createFileRoute("/portal/signup/")({
  beforeLoad: () => {
    throw redirect({ to: "/portal/signup" });
  },
});
