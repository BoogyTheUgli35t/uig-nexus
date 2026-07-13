// Standalone Vitest config — deliberately not layered on top of vite.config.ts, since that
// file goes through @lovable.dev/vite-tanstack-config (which injects TanStack Start/SSR
// plugins that Vitest's Node test environment doesn't need and isn't set up to run).
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsConfigPaths(), react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
