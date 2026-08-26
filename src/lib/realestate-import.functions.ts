import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { IMPORT_ENTITIES, buildPreview } from "@/lib/realestate-import";

/**
 * Bulk import commit for Real Estate. The browser previews with the same
 * `buildPreview` helper, then sends the raw CSV here; the server re-validates
 * from scratch so a tampered preview can never widen what gets written.
 * All writes go through the RLS-scoped client of the signed-in user.
 */

const CommitSchema = z.object({
  entity: z.enum(IMPORT_ENTITIES),
  csv: z.string().min(1).max(2_000_000),
});

export const commitRealEstateImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CommitSchema.parse(i))
  .handler(async ({ context, data }) => {
    const preview = buildPreview(data.entity, data.csv, 1000);
    if (preview.missingRequired.length) {
      throw new Error(`Missing required columns: ${preview.missingRequired.join(", ")}`);
    }
    const rows = preview.rows.filter((r) => r.errors.length === 0).map((r) => r.value!);
    if (rows.length === 0) throw new Error("No valid rows to import");

    // property_title → property_id lookup, resolved through RLS.
    const titles = Array.from(
      new Set(
        rows
          .map((r) => String((r as Record<string, unknown>)["property_title"] ?? "").trim())
          .filter(Boolean),
      ),
    );
    const propertyIdByTitle = new Map<string, string>();
    if (titles.length) {
      const { data: props } = await context.supabase
        .from("properties")
        .select("id, title")
        .in("title", titles);
      (props ?? []).forEach((p) => propertyIdByTitle.set(p.title.toLowerCase(), p.id));
    }

    const unresolved: string[] = [];
    let payload: Record<string, unknown>[] = [];
    let table: "properties" | "property_units" | "tenants" | "leads" = "properties";

    if (data.entity === "properties") {
      table = "properties";
      payload = rows.map((r) => ({
        title: r["title"],
        property_type: r["property_type"] ?? "residential",
        status: r["status"] ?? "available",
        city: r["city"] || null,
        state: r["state"] || null,
        address: r["address"] || null,
        price: r["price"] ?? 0,
        bedrooms: r["bedrooms"] ?? 0,
        bathrooms: r["bathrooms"] ?? 0,
        area_sqm: r["area_sqm"] ?? 0,
        description: r["description"] || null,
        owner_id: context.userId,
      }));
    } else if (data.entity === "units") {
      table = "property_units";
      payload = [];
      for (const r of rows) {
        const key = String(r["property_title"] ?? "").toLowerCase();
        const propertyId = propertyIdByTitle.get(key);
        if (!propertyId) {
          unresolved.push(String(r["property_title"]));
          continue;
        }
        payload.push({
          property_id: propertyId,
          unit_number: r["unit_number"],
          floor: r["floor"] ?? null,
          bedrooms: r["bedrooms"] ?? 0,
          bathrooms: r["bathrooms"] ?? 0,
          area_sqm: r["area_sqm"] ?? 0,
          rent_amount: r["rent_amount"] ?? 0,
          status: r["status"] ?? "vacant",
        });
      }
    } else if (data.entity === "tenants") {
      table = "tenants";
      payload = rows.map((r) => {
        const key = String(r["property_title"] ?? "").toLowerCase();
        const propertyId = key ? (propertyIdByTitle.get(key) ?? null) : null;
        if (key && !propertyId) unresolved.push(String(r["property_title"]));
        return {
          full_name: r["full_name"],
          email: r["email"] || null,
          phone: r["phone"] || null,
          property_id: propertyId,
          rent_amount: r["rent_amount"] ?? 0,
          lease_start: r["lease_start"] ?? null,
          lease_end: r["lease_end"] ?? null,
          payment_status: r["payment_status"] ?? "current",
        };
      });
    } else {
      table = "leads";
      payload = rows.map((r) => {
        const key = String(r["property_title"] ?? "").toLowerCase();
        const propertyId = key ? (propertyIdByTitle.get(key) ?? null) : null;
        if (key && !propertyId) unresolved.push(String(r["property_title"]));
        return {
          full_name: r["full_name"],
          email: r["email"] || null,
          phone: r["phone"] || null,
          stage: r["stage"] ?? "new",
          property_id: propertyId,
          budget_max: r["budget_max"] ?? null,
          next_follow_up_date: r["next_follow_up_date"] ?? null,
          notes: r["notes"] || null,
          owner_id: context.userId,
        };
      });
    }

    if (payload.length === 0) {
      throw new Error(
        unresolved.length
          ? `No rows imported — unknown property titles: ${Array.from(new Set(unresolved)).slice(0, 5).join(", ")}`
          : "No valid rows to import",
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (context.supabase.from as any)(table).insert(payload);
    if (error) throw new Error(error.message);

    return {
      inserted: payload.length,
      skipped: preview.errorCount,
      unresolved: Array.from(new Set(unresolved)),
    };
  });
