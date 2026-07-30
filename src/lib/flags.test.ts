import { describe, expect, it, vi, afterEach } from "vitest";

/**
 * Flags gate whether whole public surfaces are exposed, so the failure
 * direction matters: an unset or malformed value must leave the feature ON
 * (ship what was built) rather than silently hiding a division.
 */
async function loadFlags(env: Record<string, string>) {
  vi.resetModules();
  vi.stubEnv("VITE_FLAG_REAL_ESTATE_LISTINGS", env.REAL_ESTATE_LISTINGS ?? "");
  vi.stubEnv("VITE_FLAG_SELF_SERVE_SIGNUP", env.SELF_SERVE_SIGNUP ?? "");
  return import("./flags");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("feature flags", () => {
  it("defaults to enabled when the variable is unset", async () => {
    const { FLAGS } = await loadFlags({});
    expect(FLAGS.realEstateListings).toBe(true);
    expect(FLAGS.selfServeSignup).toBe(true);
  });

  it("disables on the documented off values", async () => {
    for (const value of ["off", "false", "0", "no", "OFF", "False"]) {
      const { FLAGS } = await loadFlags({ REAL_ESTATE_LISTINGS: value });
      expect(FLAGS.realEstateListings, `"${value}" should disable`).toBe(false);
    }
  });

  it("stays enabled for on-ish and unrecognised values", async () => {
    // A typo must not take a live division offline.
    for (const value of ["on", "true", "1", "yes", "enabled", "banana"]) {
      const { FLAGS } = await loadFlags({ REAL_ESTATE_LISTINGS: value });
      expect(FLAGS.realEstateListings, `"${value}" should stay enabled`).toBe(true);
    }
  });

  it("treats each flag independently", async () => {
    const { FLAGS } = await loadFlags({ REAL_ESTATE_LISTINGS: "off" });
    expect(FLAGS.realEstateListings).toBe(false);
    expect(FLAGS.selfServeSignup).toBe(true);
  });

  it("isEnabled agrees with the FLAGS object", async () => {
    const { FLAGS, isEnabled } = await loadFlags({ REAL_ESTATE_LISTINGS: "off" });
    expect(isEnabled("realEstateListings")).toBe(FLAGS.realEstateListings);
    expect(isEnabled("selfServeSignup")).toBe(FLAGS.selfServeSignup);
  });
});
