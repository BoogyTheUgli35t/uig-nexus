import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DIVISION_SLUGS = [
  "technology",
  "agritech",
  "real-estate",
  "logistics",
  "intelligence",
  "innovation-lab",
] as const;
const DivisionSlugSchema = z.enum(DIVISION_SLUGS);

/** Divisions the current user can access, plus their roles. Admins see all. */
export const getMyWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: roles }, { data: userDivisions }, { data: unread }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("user_divisions").select("division_slug").eq("user_id", userId),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null),
    ]);
    const roleList = (roles ?? []).map((r) => r.role as string);
    const isAdmin = roleList.includes("admin");
    const slugs = isAdmin ? [...DIVISION_SLUGS] : (userDivisions ?? []).map((d) => d.division_slug);
    return {
      userId,
      roles: roleList,
      isAdmin,
      divisionSlugs: slugs,
      unreadNotifications: unread?.length ?? 0,
    };
  });

// =============== Notifications ===============

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, title, body, division, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const NotificationIdSchema = z.object({ id: z.string().uuid() });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => NotificationIdSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Messaging ===============

const ListMessagesSchema = z.object({
  division: DivisionSlugSchema,
  thread_key: z.string().trim().min(1).max(100).default("general"),
});

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => ListMessagesSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, body, sender_id, thread_key, created_at")
      .eq("division", data.division)
      .eq("thread_key", data.thread_key)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const SendMessageSchema = z.object({
  division: DivisionSlugSchema,
  thread_key: z.string().trim().min(1).max(100).default("general"),
  body: z.string().trim().min(1).max(4000),
});

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => SendMessageSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("messages").insert({
      division: data.division,
      thread_key: data.thread_key,
      body: data.body,
      sender_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
