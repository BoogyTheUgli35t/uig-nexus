import { describe, it, expect } from "vitest";
import { rentInstalmentKobo, ASSET_RESERVATION_KOBO, STRIPE_MAX_KOBO } from "./portal-payments";

describe("portal payments", () => {
  it("charges one twelfth of annual rent", () => {
    expect(rentInstalmentKobo(1_200_000)).toBe(100_000 * 100);
  });
  it("caps rent at Stripe's NGN limit", () => {
    expect(rentInstalmentKobo(60_000_000)).toBe(STRIPE_MAX_KOBO);
  });
  it("returns 0 when no rent set", () => {
    expect(rentInstalmentKobo(0)).toBe(0);
  });
  it("reservation deposit is ₦500,000", () => {
    expect(ASSET_RESERVATION_KOBO).toBe(50_000_000);
  });
});
