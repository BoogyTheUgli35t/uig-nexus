import { test, expect } from "@playwright/test";

test.describe("Public site smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/UIG|Unified Innovations/i);
  });

  test("divisions index lists all six divisions", async ({ page }) => {
    await page.goto("/divisions");
    for (const name of ["Technology", "AgriTech", "Real Estate", "Logistics", "Intelligence", "Innovation"]) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
    }
  });

  test("cookie banner appears on first visit and can be dismissed", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    const banner = page.getByText(/essential cookies/i);
    await expect(banner).toBeVisible();
    await page.getByRole("button", { name: /accept all/i }).click();
    await expect(banner).not.toBeVisible();
  });

  test("legal pages render", async ({ page }) => {
    for (const path of ["/privacy", "/terms", "/cookies"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("public shipment tracking page loads", async ({ page }) => {
    await page.goto("/track");
    await expect(page.locator("body")).toBeVisible();
  });

  test("contact page has a working form shell", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("form")).toBeVisible();
  });
});
