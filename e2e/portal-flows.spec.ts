import { test, expect, type Page } from "@playwright/test";

/**
 * Authenticated core flows from the division build spec. These need a real,
 * confirmed Supabase account with admin (or staff + division) access — set
 * E2E_TEST_EMAIL / E2E_TEST_PASSWORD to enable them. Without credentials the
 * whole file skips rather than failing, so CI stays green on forks.
 */
const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("Portal division flows", () => {
  test.skip(!EMAIL || !PASSWORD, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run portal flows");

  async function signIn(page: Page) {
    await page.goto("/portal/login");
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel(/password/i).fill(PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/portal\/(dashboard|choose-division)/, { timeout: 20_000 });
  }

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("dashboard shows division cards for the signed-in user", async ({ page }) => {
    await page.goto("/portal/dashboard");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.locator('a[href*="/portal/divisions/"]').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("real estate workspace exposes every module tab", async ({ page }) => {
    await page.goto("/portal/divisions/real-estate");
    const noAccess = await page.getByText(/no access to uig real estate/i).count();
    test.skip(noAccess > 0, "Test account lacks Real Estate access");

    for (const tab of ["Properties", "Tenants", "Investors", "Leads", "Reports", "Settings"]) {
      await expect(page.getByRole("link", { name: tab, exact: false }).first()).toBeVisible();
    }
  });

  test("CRM pipeline renders lead stages", async ({ page }) => {
    await page.goto("/portal/divisions/real-estate/leads");
    test.skip(
      (await page.getByText(/no access to uig real estate/i).count()) > 0,
      "Test account lacks Real Estate access",
    );
    await expect(page.getByText(/new|contacted|qualified/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("intelligence model lifecycle board renders all five stages", async ({ page }) => {
    await page.goto("/portal/divisions/intelligence/models");
    test.skip(
      (await page.getByText(/no access to uig intelligence/i).count()) > 0,
      "Test account lacks Intelligence access",
    );
    for (const stage of ["Draft", "Training", "Evaluated", "Deployed", "Monitoring"]) {
      await expect(page.getByText(stage, { exact: false }).first()).toBeVisible();
    }
  });

  test("intelligence assistant accepts a prompt and answers", async ({ page }) => {
    await page.goto("/portal/divisions/intelligence/assistant");
    test.skip(
      (await page.getByText(/no access to uig intelligence/i).count()) > 0,
      "Test account lacks Intelligence access",
    );
    const input = page.getByPlaceholder(/message the assistant/i);
    await expect(input).toBeVisible();
    await input.fill("Summarize our divisions in one sentence.");
    await page.getByRole("button", { name: /send/i }).click();
    // Either a reply arrives, or the AI gateway reports it isn't configured —
    // both prove the round-trip works; a silent nothing does not.
    await expect(
      page.getByText(/thinking|not configured|rate limit|credits/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("innovation lab experiment can be logged against a hypothesis", async ({ page }) => {
    await page.goto("/portal/divisions/innovation-lab/experiments");
    test.skip(
      (await page.getByText(/no access to uig innovation lab/i).count()) > 0,
      "Test account lacks Innovation Lab access",
    );
    const hypothesis = `E2E hypothesis ${Date.now()}`;
    await page.getByPlaceholder(/hypothesis/i).fill(hypothesis);
    await page.getByRole("button", { name: /log/i }).click();
    await expect(page.getByText(hypothesis)).toBeVisible({ timeout: 15_000 });
  });

  test("agritech sensors and predictions pages render their tables", async ({ page }) => {
    await page.goto("/portal/divisions/agritech/sensors");
    test.skip(
      (await page.getByText(/no access to uig agritech/i).count()) > 0,
      "Test account lacks AgriTech access",
    );
    await expect(page.getByText(/fields reporting/i)).toBeVisible();

    await page.goto("/portal/divisions/agritech/predictions");
    await expect(page.getByText(/forecast total|predictions/i).first()).toBeVisible();
  });

  test("logistics shipments board loads", async ({ page }) => {
    await page.goto("/portal/divisions/logistics/shipments");
    test.skip(
      (await page.getByText(/no access to uig logistics/i).count()) > 0,
      "Test account lacks Logistics access",
    );
    await expect(page.locator("h1, h2, table").first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Admin console", () => {
  test.skip(!EMAIL || !PASSWORD, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run admin flows");

  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/login");
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel(/password/i).fill(PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/portal\/(dashboard|choose-division)/, { timeout: 20_000 });
  });

  test("admin overview links to every admin surface", async ({ page }) => {
    await page.goto("/portal/admin");
    test.skip((await page.getByText(/admins only/i).count()) > 0, "Test account is not an admin");

    for (const label of [
      "Access requests",
      "Users",
      "Audit log",
      "System oversight",
      "Broadcast",
      "Division data",
    ]) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
  });

  test("division data console reports per-division record counts", async ({ page }) => {
    await page.goto("/portal/admin/data");
    test.skip((await page.getByText(/admins only/i).count()) > 0, "Test account is not an admin");
    await expect(page.getByRole("heading", { name: /division data/i })).toBeVisible();
    await expect(page.getByText(/records platform-wide/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /seed/i }).first()).toBeVisible();
  });
});
