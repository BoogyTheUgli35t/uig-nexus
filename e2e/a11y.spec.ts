import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * WCAG 2.1 A/AA audit of the public surface. Runs axe against each page and
 * fails on any violation, so accessibility regressions are caught in CI rather
 * than in a manual review months later.
 *
 * Scope note: this audits server-rendered markup. Interactive-only widgets
 * (dialogs, the cookie banner) need a hydrating environment — see e2e/helpers.
 */
const PAGES = [
  { path: "/", name: "home" },
  { path: "/divisions", name: "divisions index" },
  { path: "/divisions/technology", name: "technology division" },
  { path: "/divisions/real-estate", name: "real estate division" },
  { path: "/divisions/real-estate/listings", name: "listings hub" },
  { path: "/divisions/innovation-lab/submit", name: "idea submission" },
  { path: "/services", name: "services" },
  { path: "/about", name: "about" },
  { path: "/contact", name: "contact" },
  { path: "/status", name: "status" },
  { path: "/portal/login", name: "portal login" },
  { path: "/portal/signup", name: "portal signup" },
  { path: "/privacy", name: "privacy" },
];

// A full axe pass over an image-heavy page on a cold dev server regularly
// exceeds Playwright's 30s default, which surfaced as phantom failures.
test.describe.configure({ timeout: 120_000 });

for (const target of PAGES) {
  test(`${target.name} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(target.path);
    await page.waitForLoadState("domcontentloaded");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.help}`,
    );
    expect(summary, `${target.path}\n${summary.join("\n")}`).toEqual([]);
  });
}
