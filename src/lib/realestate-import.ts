import { z } from "zod";
import {
  LEAD_STAGES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  UNIT_STATUSES,
} from "@/lib/realestate.functions";

/**
 * Pure CSV parsing + validation for Real Estate bulk import. Shared by the
 * preview step in the browser and the commit handler on the server, so what
 * the user previews is exactly what gets validated before any write.
 */

export const IMPORT_ENTITIES = ["properties", "units", "tenants", "leads"] as const;
export type ImportEntity = (typeof IMPORT_ENTITIES)[number];

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalNumber = (max: number) =>
  z
    .union([z.literal(""), z.coerce.number().min(0).max(max)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v)));
const optionalDate = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")])
  .optional()
  .transform((v) => (v ? v : null));

export const PropertyRowSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(180),
  property_type: z.enum(PROPERTY_TYPES).default("residential"),
  status: z.enum(PROPERTY_STATUSES).default("available"),
  city: optionalText(120),
  state: optionalText(120),
  address: optionalText(240),
  price: z.coerce.number().min(0).max(1_000_000_000_000).default(0),
  bedrooms: z.coerce.number().int().min(0).max(100).default(0),
  bathrooms: z.coerce.number().int().min(0).max(100).default(0),
  area_sqm: z.coerce.number().min(0).max(10_000_000).default(0),
  description: optionalText(4000),
});

export const UnitRowSchema = z.object({
  property_title: z.string().trim().min(1, "property_title is required").max(180),
  unit_number: z.string().trim().min(1, "unit_number is required").max(40),
  floor: z
    .union([z.literal(""), z.coerce.number().int().min(-10).max(300)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
  bedrooms: z.coerce.number().int().min(0).max(50).default(0),
  bathrooms: z.coerce.number().int().min(0).max(50).default(0),
  area_sqm: z.coerce.number().min(0).max(1_000_000).default(0),
  rent_amount: z.coerce.number().min(0).max(1_000_000_000).default(0),
  status: z.enum(UNIT_STATUSES).default("vacant"),
});

export const TenantRowSchema = z.object({
  full_name: z.string().trim().min(1, "full_name is required").max(150),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(180)]).optional(),
  phone: optionalText(40),
  property_title: optionalText(180),
  rent_amount: z.coerce.number().min(0).max(1_000_000_000).default(0),
  lease_start: optionalDate,
  lease_end: optionalDate,
  payment_status: z.enum(["current", "due", "overdue"]).default("current"),
});

export const LeadRowSchema = z.object({
  full_name: z.string().trim().min(1, "full_name is required").max(150),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(180)]).optional(),
  phone: optionalText(40),
  stage: z.enum(LEAD_STAGES).default(LEAD_STAGES[0]),
  property_title: optionalText(180),
  budget_max: optionalNumber(1_000_000_000_000),
  next_follow_up_date: optionalDate,
  notes: optionalText(4000),
});

export const ROW_SCHEMAS = {
  properties: PropertyRowSchema,
  units: UnitRowSchema,
  tenants: TenantRowSchema,
  leads: LeadRowSchema,
} as const;

export const ENTITY_COLUMNS: Record<ImportEntity, { required: string[]; optional: string[] }> = {
  properties: {
    required: ["title"],
    optional: [
      "property_type",
      "status",
      "city",
      "state",
      "address",
      "price",
      "bedrooms",
      "bathrooms",
      "area_sqm",
      "description",
    ],
  },
  units: {
    required: ["property_title", "unit_number"],
    optional: ["floor", "bedrooms", "bathrooms", "area_sqm", "rent_amount", "status"],
  },
  tenants: {
    required: ["full_name"],
    optional: [
      "email",
      "phone",
      "property_title",
      "rent_amount",
      "lease_start",
      "lease_end",
      "payment_status",
    ],
  },
  leads: {
    required: ["full_name"],
    optional: [
      "email",
      "phone",
      "stage",
      "property_title",
      "budget_max",
      "next_follow_up_date",
      "notes",
    ],
  },
};

export function sampleCsv(entity: ImportEntity): string {
  const cols = [...ENTITY_COLUMNS[entity].required, ...ENTITY_COLUMNS[entity].optional];
  const examples: Record<string, string> = {
    title: "3-Bed Terrace, Lekki Phase 1",
    property_title: "3-Bed Terrace, Lekki Phase 1",
    property_type: "residential",
    status: entity === "units" ? "vacant" : "available",
    city: "Lagos",
    state: "Lagos",
    address: "12 Admiralty Way",
    price: "185000000",
    bedrooms: "3",
    bathrooms: "3",
    area_sqm: "210",
    description: "Serviced terrace with borehole and generator",
    unit_number: "A-101",
    floor: "1",
    rent_amount: "4500000",
    full_name: "Amaka Obi",
    email: "amaka@example.com",
    phone: "+2348012345678",
    lease_start: "2026-01-01",
    lease_end: "2026-12-31",
    payment_status: "current",
    stage: LEAD_STAGES[0] as string,
    budget_max: "150000000",
    next_follow_up_date: "2026-09-01",
    notes: "Prefers Ikoyi or Lekki",
  };
  return `${cols.join(",")}\n${cols.map((c) => csvCell(examples[c] ?? "")).join(",")}\n`;
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** RFC4180-ish CSV parser: quoted fields, escaped quotes, CRLF tolerant. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type ParsedRow = {
  line: number;
  raw: Record<string, string>;
  value: Record<string, unknown> | null;
  errors: string[];
};

export type ImportPreview = {
  entity: ImportEntity;
  headers: string[];
  unknownColumns: string[];
  missingRequired: string[];
  rows: ParsedRow[];
  validCount: number;
  errorCount: number;
};

/** Parse + validate a CSV payload without touching the database. */
export function buildPreview(entity: ImportEntity, csv: string, limit = 500): ImportPreview {
  const grid = parseCsv(csv);
  const spec = ENTITY_COLUMNS[entity];
  const known = new Set([...spec.required, ...spec.optional]);

  if (grid.length === 0) {
    return {
      entity,
      headers: [],
      unknownColumns: [],
      missingRequired: spec.required,
      rows: [],
      validCount: 0,
      errorCount: 0,
    };
  }

  const headers = (grid[0] ?? []).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const unknownColumns = headers.filter((h) => h && !known.has(h));
  const missingRequired = spec.required.filter((r) => !headers.includes(r));
  const schema = ROW_SCHEMAS[entity];

  const rows: ParsedRow[] = grid.slice(1, limit + 1).map((cells, idx) => {
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (h && known.has(h)) raw[h] = (cells[i] ?? "").trim();
    });
    // Blank optional cells fall back to schema defaults rather than failing.
    const candidate = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== ""));
    const parsed = schema.safeParse(candidate);
    return {
      line: idx + 2,
      raw,
      value: parsed.success ? (parsed.data as Record<string, unknown>) : null,
      errors: parsed.success
        ? []
        : parsed.error.issues.map((iss) =>
            iss.path.length ? `${iss.path.join(".")}: ${iss.message}` : iss.message,
          ),
    };
  });

  return {
    entity,
    headers,
    unknownColumns,
    missingRequired,
    rows,
    validCount: rows.filter((r) => r.errors.length === 0).length,
    errorCount: rows.filter((r) => r.errors.length > 0).length,
  };
}
