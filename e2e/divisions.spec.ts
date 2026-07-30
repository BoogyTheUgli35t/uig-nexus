import { test, expect } from "@playwright/test";
import { requireHydration } from "./helpers";

/**
 * Public division marketing surface — these run without credentials, so they
 * guard the pages every visitor sees (and the ones that broke historically:
 * imagery, the location-grouped listings, and the status page).
 */
test.describe("Division marketing pages", () => {
  const DIVISIONS = [
    { path: "/divisions/technology", name: /technology/i },
    { path: "/divisions/agritech", name: /agritech/i },
    { path: "/divisions/real-estate", name: /real estate/i },
    { path: "/divisions/logistics", name: /logistics/i },
    { path: "/divisions/intelligence", name: /intelligence/i },
    { path: "/divisions/innovation-lab", name: /innovation lab/i },
  ];

  for (const division of DIVISIONS) {
    test(`${division.path} renders a hero, imagery and cross-division nav`, async ({ page }) => {
      await page.goto(division.path);
      // The h1 is a marketing headline, so identity is asserted via the document
      // title rather than the heading text.
      await expect(page.locator("h1")).toBeVisible();
      await expect(page).toHaveTitle(division.name);

      // Hero imagery must actually load — a broken src is the failure mode we
      // hit before, and it renders as a 0x0 image rather than a visible error.
      const hero = page.locator("img").first();
      await expect(hero).toBeVisible();
      const naturalWidth = await hero.evaluate((img) => (img as HTMLImageElement).naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);

      // Every division page ends with the "explore the rest of UIG" strip.
      await expect(page.getByText(/explore the rest of uig/i)).toBeVisible();
    });
  }

  test("homepage serves no broken images", async ({ page }) => {
    await page.goto("/");
    // Scroll the full page so lazy-loaded story images actually request.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
    });
    await page.waitForTimeout(2000);

    // A broken image is one that finished loading with zero intrinsic width.
    // Images still in flight (complete === false) are not failures.
    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src),
    );
    expect(broken, `broken images: ${broken.join(", ")}`).toHaveLength(0);
  });
});

test.describe("Real Estate public listings", () => {
  test("listings hub groups properties by location", async ({ page }) => {
    await page.goto("/divisions/real-estate/listings");
    // The hub itself is server-rendered — this assertion also guards the
    // non-nested route fix (it used to render the parent division page).
    await expect(page.getByRole("heading", { name: /choose a location/i })).toBeVisible();

    await requireHydration(page);
    // Either location cards render, or the empty/error state does — never a crash.
    await expect(
      page
        .getByText(/listing/i)
        .or(page.getByText(/no listings are live yet/i))
        .or(page.getByText(/temporarily unavailable/i))
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("drilling into a state shows that state's listings and filters", async ({ page }) => {
    await page.goto("/divisions/real-estate/listings");
    const firstLocation = page.locator('a[href*="/divisions/real-estate/listings/"]').first();
    const hasLocations = await firstLocation.count();
    test.skip(hasLocations === 0, "No listings seeded in this environment");

    await firstLocation.click();
    await expect(page).toHaveURL(/\/divisions\/real-estate\/listings\/.+/);
    await expect(page.getByText(/for sale/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /all locations/i })).toBeVisible();
  });

  test("a listing detail page shows price, gallery and enquiry path", async ({ page }) => {
    await page.goto("/divisions/real-estate/listings");
    const firstLocation = page.locator('a[href*="/divisions/real-estate/listings/"]').first();
    test.skip((await firstLocation.count()) === 0, "No listings seeded in this environment");
    await firstLocation.click();

    const firstListing = page.locator('a[href*="/divisions/real-estate/listings/"]').first();
    test.skip((await firstListing.count()) === 0, "No properties in this location");
    await firstListing.click();

    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.getByText(/₦/).first()).toBeVisible();
  });
});

test.describe("Public status page", () => {
  test("status page lists platform components", async ({ page }) => {
    await page.goto("/status");
    await expect(page.locator("h1")).toBeVisible();

    await requireHydration(page);
    // Components load client-side; either statuses render or the empty state does.
    await expect(page.getByText(/operational|degraded|outage|no components/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe("Innovation Lab public intake", () => {
  test("idea submission form renders with its required fields", async ({ page }) => {
    await page.goto("/divisions/innovation-lab/submit");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.getByRole("textbox").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /submit|send/i }).first()).toBeVisible();
  });
});
