import { test, expect, type Page } from "@playwright/test";

/**
 * Division-admin lifecycle: sign in, open every division Team route, use the
 * grant form, and edit a Real Estate record. Requires a confirmed account that
 * administers the divisions — set E2E_TEST_EMAIL / E2E_TEST_PASSWORD.
 */
const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

const DIVISIONS = [
  "technology",
  "agritech",
  "real-estate",
  "logistics",
  "intelligence",
  "innovation-lab",
] as const;

test.describe("Division admin", () => {
  test.skip(!EMAIL || !PASSWORD, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run admin flows");

  async function signIn(page: Page) {
    await page.goto("/portal/login");
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel(/password/i).fill(PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/portal\/(dashboard|choose-division)/, { timeout: 20_000 });
    if (page.url().includes("choose-division")) {
      await page
        .getByRole("button", { name: /real estate/i })
        .first()
        .click();
      await page
        .getByRole("button", { name: /continue|finish|go to/i })
        .first()
        .click();
    }
  }

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  for (const slug of DIVISIONS) {
    test(`team route loads for ${slug}`, async ({ page }) => {
      await page.goto(`/portal/divisions/${slug}/team`);
      await expect(page.getByText(/Add a teammate|Division admins only/i).first()).toBeVisible({
        timeout: 20_000,
      });
    });
  }

  test("team panel shows members, requests and activity", async ({ page }) => {
    await page.goto("/portal/divisions/real-estate/team");
    const gate = page.getByText(/Division admins only/i);
    if (await gate.isVisible().catch(() => false))
      test.skip(true, "Account is not a division admin");

    await expect(page.getByText(/^Members/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Pending access requests/i)).toBeVisible();
    await expect(page.getByText(/Recent team activity/i)).toBeVisible();
  });

  test("granting access to an unknown email surfaces a clear error", async ({ page }) => {
    await page.goto("/portal/divisions/real-estate/team");
    const field = page.getByLabel(/Portal account email/i);
    if (!(await field.isVisible().catch(() => false)))
      test.skip(true, "Account is not a division admin");
    await field.fill(`no-such-user-${Date.now()}@example.com`);
    await page.getByRole("button", { name: /grant access/i }).click();
    await expect(page.getByText(/No portal account found/i)).toBeVisible({ timeout: 20_000 });
  });

  test("real estate property can be edited", async ({ page }) => {
    await page.goto("/portal/divisions/real-estate/properties");
    const first = page.locator('a[href*="/portal/divisions/real-estate/properties/"]').first();
    if (!(await first.isVisible().catch(() => false))) test.skip(true, "No properties seeded");
    await first.click();
    await page.getByRole("link", { name: /edit/i }).first().click();
    await expect(page).toHaveURL(/\/edit$/, { timeout: 20_000 });
    const title = page.getByLabel(/title/i).first();
    await title.fill(`E2E edited ${Date.now()}`);
    await page
      .getByRole("button", { name: /save|update/i })
      .first()
      .click();
    await expect(page.getByText(/updated/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("bulk import previews a pasted CSV before writing", async ({ page }) => {
    await page.goto("/portal/divisions/real-estate/import");
    await expect(page.getByText(/Bulk import/i).first()).toBeVisible({ timeout: 20_000 });
    await page
      .getByLabel(/Or paste CSV/i)
      .fill("title,city,price\nE2E Preview Only,Lagos,1000000\n,,\n");
    await expect(page.getByText(/1 valid/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Import 1 properties/i })).toBeEnabled();
  });
});
