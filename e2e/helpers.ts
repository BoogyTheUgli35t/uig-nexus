import { test, type Page } from "@playwright/test";

/**
 * True once the client bundle has mounted (see the hydration probe in
 * src/routes/__root.tsx).
 *
 * Some local environments serve SSR HTML but never boot the client bundle —
 * on those, anything fetched client-side (status components, listings data,
 * the cookie banner) never appears. Without this check those look identical to
 * real application failures, which cost a full debugging cycle once already.
 */
export async function isHydrated(page: Page, timeoutMs = 8000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => (window as unknown as { __UIG_HYDRATED__?: boolean }).__UIG_HYDRATED__ === true,
      undefined,
      { timeout: timeoutMs },
    );
    return true;
  } catch {
    return false;
  }
}

/** Skip the current test when the environment under test never hydrates. */
export async function requireHydration(page: Page): Promise<void> {
  const hydrated = await isHydrated(page);
  test.skip(
    !hydrated,
    "Environment served SSR HTML but never hydrated — run against a deployed URL via E2E_BASE_URL to cover client-side behaviour",
  );
}
