import { describe, expect, it } from "vitest";
import { DIVISIONS, DIVISION_MAP, DIVISION_SLUGS, getDivision } from "./divisions";

describe("DIVISIONS data integrity", () => {
  it("has exactly six divisions", () => {
    expect(DIVISIONS).toHaveLength(6);
  });

  it("has unique slugs", () => {
    const slugs = DIVISIONS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps DIVISION_MAP and DIVISION_SLUGS in sync with DIVISIONS", () => {
    for (const division of DIVISIONS) {
      expect(DIVISION_MAP[division.slug]).toEqual(division);
      expect(DIVISION_SLUGS).toContain(division.slug);
    }
  });

  it("gives every division at least one module with a valid status", () => {
    for (const division of DIVISIONS) {
      expect(division.modules.length).toBeGreaterThan(0);
      for (const mod of division.modules) {
        expect(["live", "soon"]).toContain(mod.status);
      }
    }
  });

  it("resolves known slugs and rejects unknown ones via getDivision", () => {
    expect(getDivision("technology")?.name).toBe("UIG Technology");
    expect(getDivision("not-a-real-division")).toBeUndefined();
  });
});
