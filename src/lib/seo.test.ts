import { describe, expect, it } from "vitest";
import {
  CONTACT_EMAIL,
  ORGANIZATION_JSON_LD,
  SITE_URL,
  SOCIAL_LINKS,
  canonical,
  whatsappHref,
} from "./seo";

describe("canonical()", () => {
  it("returns the bare origin for the home page", () => {
    expect(canonical("/")).toEqual({ rel: "canonical", href: SITE_URL });
  });

  it("joins a path onto the site URL", () => {
    expect(canonical("/about").href).toBe(`${SITE_URL}/about`);
    expect(canonical("/divisions/real-estate").href).toBe(`${SITE_URL}/divisions/real-estate`);
  });

  it("strips trailing slashes, so one page never gets two canonicals", () => {
    expect(canonical("/about/").href).toBe(`${SITE_URL}/about`);
    expect(canonical("/about///").href).toBe(`${SITE_URL}/about`);
  });
});

describe("contact details", () => {
  it("uses a single address on the UIG domain", () => {
    // The contact page used to print hello@uig.africa while the footer and the
    // structured data said something else — one of the two silently dropped
    // mail. Everything reads this constant now.
    expect(CONTACT_EMAIL).toMatch(/@unifiedinnovationsgroup\.online$/);
    expect(ORGANIZATION_JSON_LD.email).toBe(CONTACT_EMAIL);
  });

  it("gives the organisation a contact point search engines can read", () => {
    expect(ORGANIZATION_JSON_LD.contactPoint[0].email).toBe(CONTACT_EMAIL);
  });
});

describe("whatsappHref()", () => {
  it("returns null when no number is configured", () => {
    // Guards the regression this replaced: a placeholder fallback shipped a
    // chat button on every page dialling a line nobody owns. Callers must be
    // able to render nothing.
    if (!import.meta.env.VITE_WHATSAPP_NUMBER) {
      expect(whatsappHref("hello")).toBeNull();
    }
  });

  it("builds a wa.me link with the message encoded, when configured", () => {
    const href = whatsappHref("Hi UIG — a & b");
    if (href) {
      expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
      expect(href).not.toContain(" ");
      expect(href).toContain("%26");
    }
  });
});

describe("social links", () => {
  it("only advertises profiles that have a URL", () => {
    const sameAs = (ORGANIZATION_JSON_LD as { sameAs?: string[] }).sameAs ?? [];
    const live = SOCIAL_LINKS.filter((s) => s.href).map((s) => s.href);
    expect(sameAs).toHaveLength(live.length);
    for (const href of sameAs) expect(href).toMatch(/^https?:\/\//);
  });

  it("labels every entry, so an unlinked icon still reads as something", () => {
    for (const s of SOCIAL_LINKS) expect(s.label.trim()).not.toBe("");
  });
});
