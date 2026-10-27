import { describe, expect, it } from "vitest";
import { LEADERSHIP, LEADERSHIP_OPEN_ROLES, initials } from "./leadership";

describe("leadership data", () => {
  it("names at least one leader with a role and a remit", () => {
    expect(LEADERSHIP.length).toBeGreaterThan(0);
    for (const l of LEADERSHIP) {
      expect(l.name.trim()).not.toBe("");
      expect(l.role.trim()).not.toBe("");
      expect(l.remit.trim()).not.toBe("");
      expect(l.headline.trim()).not.toBe("");
    }
  });

  it("gives every leader a substantive bio", () => {
    for (const l of LEADERSHIP) {
      expect(l.bio.length).toBeGreaterThan(0);
      for (const paragraph of l.bio) {
        // A one-line bio on a leadership page reads worse than no section.
        expect(paragraph.length).toBeGreaterThan(80);
      }
    }
  });

  it("keeps unverified biography claims out of the bio", () => {
    // The bio is published under a real person's name, so it must not carry
    // the kinds of claim nobody here can verify — a plausible-sounding detail
    // is the one a journalist or a procurement officer checks first. Those
    // facts belong in `background`, which the page only renders when filled.
    const banned =
      /\b(graduat|MBA|BSc|MSc|PhD|alumnu|alumn[ai]|formerly at|previously at|ex-[A-Z]|\d+\s*\+?\s*years? of experience|award[- ]winning|named one of|Forbes|Y Combinator)\b/i;
    for (const l of LEADERSHIP) {
      for (const paragraph of l.bio) {
        expect(paragraph).not.toMatch(banned);
      }
    }
  });

  it("does not invent a headshot path", () => {
    for (const l of LEADERSHIP) {
      if (l.photo !== undefined) expect(l.photo.trim()).not.toBe("");
    }
  });

  it("describes every open leadership seat it lists", () => {
    for (const r of LEADERSHIP_OPEN_ROLES) {
      expect(r.role.trim()).not.toBe("");
      expect(r.remit.trim()).not.toBe("");
      expect(r.note.trim()).not.toBe("");
    }
  });

  it("derives initials from the first and last name", () => {
    expect(initials("Efosa Harry Ediagbonya")).toBe("EE");
    expect(initials("Ada Okeke")).toBe("AO");
    expect(initials("Ada")).toBe("AD");
    expect(initials("  spaced   out  ")).toBe("SO");
  });
});
