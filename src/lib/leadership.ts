/**
 * Named leadership for the public site.
 *
 * There was no named person anywhere on the public site — every insight
 * article was bylined "UIG Editorial Team" and the About page named no
 * executive. For a group claiming six divisions and pitching enterprise and
 * government accounts, an unnamed leadership was the single largest
 * credibility gap on the site.
 *
 * ---------------------------------------------------------------------------
 * A note on what belongs in a `bio`
 *
 * Everything here is published under a real person's name, so each `bio` line
 * says only what is verifiably true of UIG and of the role: what was founded,
 * what the person is accountable for, what the operating thesis is. It does
 * NOT claim education, previous employers, years of experience or awards,
 * because a detail invented for the sake of a fuller-looking page is a detail
 * a journalist or a procurement officer can catch — and that costs far more
 * than a short bio does.
 *
 * `background` is the slot for those facts, and it renders only when filled.
 * Add the real lines and they appear immediately; leave it empty and the page
 * is honest rather than padded.
 * ---------------------------------------------------------------------------
 */
export type Leader = {
  name: string;
  role: string;
  /** Division or group remit, shown as an eyebrow above the name. */
  remit: string;
  /** Short line for cards and the JSON-LD `jobTitle` context. */
  headline: string;
  /** Substantive paragraphs. Only claims true of UIG and the role. */
  bio: string[];
  /**
   * Verifiable personal history — prior roles, education, recognition.
   * Empty by design until supplied by the person it describes; the page omits
   * the block entirely rather than inventing filler.
   */
  background: string[];
  /** Optional pull-quote, in the leader's own words. */
  quote?: string;
  /** Storage path or absolute URL for a headshot. Falls back to initials. */
  photo?: string;
  linkedin?: string;
};

export const LEADERSHIP: Leader[] = [
  {
    name: "Efosa Harry Ediagbonya",
    role: "Founder & Chief Executive Officer",
    remit: "Group",
    headline: "Founded UIG and leads the group across all six divisions.",
    bio: [
      "Efosa Harry Ediagbonya founded Unified Innovations Group on a structural bet rather than a product idea: that the constraint on Nigerian enterprise is not a shortage of good businesses but a shortage of shared infrastructure between them — and that a group which builds that spine once can compete in six sectors at a cost no single-sector operator can match.",
      "That thesis is why UIG is organised the way it is. Technology, AgriTech, Real Estate, Logistics, Intelligence and the Innovation Lab each run as a focused operating business, but all six sit on one AI layer, one data layer and one client portal. A model trained on logistics routing informs real-estate yield analysis; a portal built for one client becomes the operating system for an industry. As CEO he owns that architecture — which divisions exist, what they share, and where the group's capital and engineering effort go next.",
      "He is directly accountable for group strategy, capital allocation across the six divisions, and the standard of delivery clients experience through the Apex Portal. Day to day that means sitting closer to the work than a conglomerate CEO usually does: division leads report to him, and the product decisions that shape what UIG ships are made with him in the room.",
    ],
    background: [
      // Add verifiable history here — prior roles, education, recognition —
      // one string per line. Rendered as a "Background" list on the About
      // page; omitted entirely while this array is empty.
    ],
    quote:
      "Africa does not need more companies selling software to each other. It needs infrastructure that works on the first try, in the conditions we actually operate in. That is the whole brief.",
  },
];

/**
 * Open leadership seats.
 *
 * Listed deliberately: an org chart with visible gaps reads as a company
 * growing on purpose, and it doubles as recruitment. Empty is fine — the
 * section hides itself.
 */
export const LEADERSHIP_OPEN_ROLES: { role: string; remit: string; note: string }[] = [
  {
    role: "Chief Technology Officer",
    remit: "Technology & Intelligence",
    note: "Owning the shared AI and engineering spine that all six divisions run on.",
  },
  {
    role: "Division Lead — AgriTech",
    remit: "AgriTech",
    note: "Field operations, cooperative partnerships and the farm-to-market network.",
  },
  {
    role: "Head of Real Estate",
    remit: "Real Estate",
    note: "Portfolio origination, title verification and the investor network.",
  },
];

/** Initials for the headshot fallback, e.g. "Efosa Harry Ediagbonya" → "EE". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
