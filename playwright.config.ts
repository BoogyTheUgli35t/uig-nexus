import { defineConfig, devices } from "@playwright/test";

// The Lovable vite config pins the dev server to 8080 (sandbox detection).
// Defaulting to 3000 made Playwright wait on a port nothing ever listened on,
// so the entire suite timed out before a single test ran.
//
// Set E2E_BASE_URL to test an already-running server (staging, or a local dev
// server you've already started) and Playwright skips spawning its own.
const PORT = process.env.PORT ?? "8080";
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        // Cold vite startup on this dependency graph regularly exceeds two
        // minutes on CI hardware.
        timeout: 300_000,
      },
});
