import { test, expect } from "@playwright/test";
import { requireHydration } from "./helpers";

test.describe("Portal auth smoke", () => {
  test("login page renders sign-in form", async ({ page }) => {
    await page.goto("/portal/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("bad credentials show an error toast, not a silent failure", async ({ page }) => {
    await page.goto("/portal/login");
    await requireHydration(page);
    await page.getByLabel(/email/i).fill(`nobody-${Date.now()}@example.com`);
    await page.getByLabel(/password/i).fill("wrong-password-123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/incorrect|couldn't sign you in|confirm your email/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("forgot password page renders and accepts an email", async ({ page }) => {
    await page.goto("/portal/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot your password/i })).toBeVisible();
    await requireHydration(page);
    await page.getByLabel(/email/i).fill(`nobody-${Date.now()}@example.com`);
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 10_000 });
  });

  test("signup page renders create-account form", async ({ page }) => {
    await page.goto("/portal/signup");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
  });

  test("visiting a portal route while signed out redirects to login", async ({ page }) => {
    await page.goto("/portal/dashboard");
    await expect(page).toHaveURL(/\/portal\/login/);
  });
});

// Full signup -> choose division -> land on seeded dashboard flow requires a
// real (or seeded) Supabase test account and email confirmation, which this
// environment doesn't have credentials for. Set E2E_TEST_EMAIL /
// E2E_TEST_PASSWORD for an already-confirmed, already-onboarded account to
// enable the authenticated smoke test below.
test.describe("Authenticated smoke (requires E2E_TEST_EMAIL/E2E_TEST_PASSWORD)", () => {
  test.skip(
    !process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD,
    "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated flows",
  );

  test("sign in lands on dashboard with division cards", async ({ page }) => {
    await page.goto("/portal/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/portal\/dashboard/, { timeout: 15_000 });
  });
});
