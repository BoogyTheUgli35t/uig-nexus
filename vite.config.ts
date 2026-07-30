// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

export default defineConfig({
  vite: {
    // @tanstack/start-client-core reads process.env.NODE_ENV inside
    // createClientRpc. The production build replaces it, but the dev server
    // does not — so every page hydrated with a server-function import threw
    // "process is not defined", leaving client-fetched views (e.g. /status)
    // stuck on their loading state. Defining it here fixes dev without
    // affecting the build.
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
    },
    plugins: [
      // MCP plugin runs for production builds only, and never on Windows.
      // @lovable.dev/mcp-js asserts that routesDir resolves under a
      // forward-slash root; since vite 7.3.6 the root arrives as a Windows
      // path ("C:\UIG\nexus"), so the assertion throws and the local build
      // dies. Deploys build on Linux, where the plugin still runs — so this
      // costs nothing in production and unblocks local `npm run build`
      // (which is what E2E and the pre-flight checklist depend on).
      process.env.NODE_ENV === "production" && process.platform !== "win32"
        ? mcpPlugin()
        : [],
    ],
  },
});
