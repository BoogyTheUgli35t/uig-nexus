import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Division-admin team management. A division admin can see who belongs to the
 * divisions they administer, grant/revoke access to those divisions only, and
 * review access requests targeted at them. Global admins can do this for every
 * division.
 *
 * Route guards are UX only — every handler re-checks the caller's authority
 * against `division_admins` / `user_roles` server-side before touching data.
 */

const DIVISION_SLUGS = [
  "technology",
  "agritech",
  "real-estate",
  "logistics",
  "intelligence",
  "innovation-lab",
] as const;
const DivisionSlugSchema = z.enum(DIVISION_SLUGS);

type Authority = { isGlobalAdmin: boolean; adminOf: string[] };

async function loadAuthority(userId: string): Promise<Authority> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: roles }, { data: divAdmins }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    supabaseAdmin.from("division_admins").select("division_slug").eq("user_id", userId),
  ]);
  return {
    isGlobalAdmin: (roles ?? []).some((r) => r.role === "admin"),
    adminOf: (divAdmins ?? []).map((d) => d.division_slug),
  };
}

async function requireDivisionAuthority(userId: string, slug: string): Promise<Authority> {
  const authority = await loadAuthority(userId);
  if (!authority.isGlobalAdmin && !authority.adminOf.includes(slug)) {
    throw new Error("You don't administer this division");
  }
  return authority;
}

async function audit(
  userId: string,
  event_type: string,
  metadata: Record<string, string>,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("portal_audit_log").insert({ user_id: userId, event_type, metadata });
}

/** Members of a division, with their email/name and whether they administer it. */
export const listDivisionMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ slug: DivisionSlugSchema }).parse(i))
  .handler(async ({ context, data }) => {
    await requireDivisionAuthority(context.userId, data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: members }, { data: divAdmins }, { data: authUsers }, { data: profiles }] =
      await Promise.all([
        supabaseAdmin
          .from("user_divisions")
          .select("user_id, created_at")
          .eq("division_slug", data.slug),
        supabaseAdmin.from("division_admins").select("user_id").eq("division_slug", data.slug),
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        supabaseAdmin.from("profiles").select("id, full_name"),
      ]);

    const adminIds = new Set((divAdmins ?? []).map((d) => d.user_id));
    const emailById = new Map<string, string>();
    (authUsers?.users ?? []).forEach((u) => emailById.set(u.id, u.email ?? ""));
    const nameById = new Map<string, string>();
    (profiles ?? []).forEach((p) => nameById.set(p.id, p.full_name ?? ""));

    return (members ?? []).map((m) => ({
      userId: m.user_id,
      email: emailById.get(m.user_id) ?? "",
      fullName: nameById.get(m.user_id) ?? "",
      isDivisionAdmin: adminIds.has(m.user_id),
      joinedAt: m.created_at,
    }));
  });

/** Grant a user access to a division by email. */
export const grantDivisionAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ slug: DivisionSlugSchema, email: z.string().trim().email().max(200) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await requireDivisionAuthority(context.userId, data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw new Error(listErr.message);
    const target = authUsers.users.find(
      (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
    );
    if (!target) throw new Error("No portal account found with that email");

    const { error } = await supabaseAdmin
      .from("user_divisions")
      .upsert(
        { user_id: target.id, division_slug: data.slug },
        { onConflict: "user_id,division_slug" },
      );
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("notifications").insert({
      user_id: target.id,
      division: data.slug,
      title: "Division access granted",
      body: `You now have access to the ${data.slug} workspace.`,
    });
    await audit(context.userId, "division_access_granted", {
      division: data.slug,
      target_user: target.id,
    });
    return { ok: true, userId: target.id };
  });

/** Revoke a user's access to a division. */
export const revokeDivisionAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ slug: DivisionSlugSchema, userId: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await requireDivisionAuthority(context.userId, data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("user_divisions")
      .delete()
      .eq("user_id", data.userId)
      .eq("division_slug", data.slug);
    if (error) throw new Error(error.message);

    await audit(context.userId, "division_access_revoked", {
      division: data.slug,
      target_user: data.userId,
    });
    return { ok: true };
  });

/** Pending access requests aimed at a division. */
export const listDivisionAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ slug: DivisionSlugSchema }).parse(i))
  .handler(async ({ context, data }) => {
    await requireDivisionAuthority(context.userId, data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("access_requests")
      .select("id, name, email, requested_role, reason, status, user_id, created_at")
      .eq("division_slug", data.slug)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Approve (grants division access) or decline a division access request. */
export const resolveDivisionAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        slug: DivisionSlugSchema,
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    await requireDivisionAuthority(context.userId, data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("access_requests")
      .update({ status: data.decision })
      .eq("id", data.id)
      .eq("division_slug", data.slug)
      .select("user_id, email")
      .single();
    if (error) throw new Error(error.message);

    if (data.decision === "approved" && row.user_id) {
      await supabaseAdmin
        .from("user_divisions")
        .upsert(
          { user_id: row.user_id, division_slug: data.slug },
          { onConflict: "user_id,division_slug" },
        );
      await supabaseAdmin.from("notifications").insert({
        user_id: row.user_id,
        division: data.slug,
        title: "Access request approved",
        body: `You now have access to the ${data.slug} workspace.`,
      });
    }

    await audit(context.userId, `division_request_${data.decision}`, {
      division: data.slug,
      request: data.id,
    });
    return { ok: true };
  });

// =============== Global admin: appoint division admins ===============

async function requireGlobalAdmin(userId: string): Promise<void> {
  const { isGlobalAdmin } = await loadAuthority(userId);
  if (!isGlobalAdmin) throw new Error("Admins only");
}

/** Every division-admin appointment across the company. */
export const listDivisionAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireGlobalAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: rows }, { data: authUsers }, { data: profiles }] = await Promise.all([
      supabaseAdmin
        .from("division_admins")
        .select("id, user_id, division_slug, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("profiles").select("id, full_name"),
    ]);
    const emailById = new Map<string, string>();
    (authUsers?.users ?? []).forEach((u) => emailById.set(u.id, u.email ?? ""));
    const nameById = new Map<string, string>();
    (profiles ?? []).forEach((p) => nameById.set(p.id, p.full_name ?? ""));
    return (rows ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      divisionSlug: r.division_slug,
      email: emailById.get(r.user_id) ?? "",
      fullName: nameById.get(r.user_id) ?? "",
      createdAt: r.created_at,
    }));
  });

/** Appoint a user as admin of a division (also grants them access to it). */
export const appointDivisionAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ slug: DivisionSlugSchema, email: z.string().trim().email().max(200) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await requireGlobalAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw new Error(listErr.message);
    const target = authUsers.users.find(
      (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
    );
    if (!target) throw new Error("No portal account found with that email");

    const { error } = await supabaseAdmin
      .from("division_admins")
      .upsert(
        { user_id: target.id, division_slug: data.slug },
        { onConflict: "user_id,division_slug" },
      );
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("user_divisions")
      .upsert(
        { user_id: target.id, division_slug: data.slug },
        { onConflict: "user_id,division_slug" },
      );
    await supabaseAdmin.from("notifications").insert({
      user_id: target.id,
      division: data.slug,
      title: "You're now a division admin",
      body: `You can manage the team for the ${data.slug} workspace.`,
    });
    await audit(context.userId, "division_admin_appointed", {
      division: data.slug,
      target_user: target.id,
    });
    return { ok: true };
  });

/** Remove a division-admin appointment (division access itself is untouched). */
export const removeDivisionAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ slug: DivisionSlugSchema, userId: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await requireGlobalAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("division_admins")
      .delete()
      .eq("user_id", data.userId)
      .eq("division_slug", data.slug);
    if (error) throw new Error(error.message);
    await audit(context.userId, "division_admin_removed", {
      division: data.slug,
      target_user: data.userId,
    });
    return { ok: true };
  });
