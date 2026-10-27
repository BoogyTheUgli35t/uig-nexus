import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/divisions.functions";
import { authHeaders } from "@/lib/auth-headers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * Where each division's notifications lead. A notification that says a field
 * went critical is only useful if it takes you to the field.
 */
const DIVISION_ROUTES: Record<string, string> = {
  technology: "/portal/divisions/technology",
  agritech: "/portal/divisions/agritech",
  "real-estate": "/portal/divisions/real-estate",
  logistics: "/portal/divisions/logistics",
  intelligence: "/portal/divisions/intelligence",
  "innovation-lab": "/portal/divisions/innovation-lab",
};

const DIVISION_LABELS: Record<string, string> = {
  technology: "Technology",
  agritech: "AgriTech",
  "real-estate": "Real Estate",
  logistics: "Logistics",
  intelligence: "Intelligence",
  "innovation-lab": "Innovation Lab",
};

/**
 * The portal's notification bell.
 *
 * Reads and writes go through the `listNotifications` /
 * `markNotificationRead` / `markAllNotificationsRead` server functions, which
 * sit behind the auth middleware — the component previously queried Supabase
 * straight from the browser and scoped rows by `user_id` itself, which meant
 * the access rule lived in the client and the three purpose-built server
 * functions had no caller at all.
 *
 * Realtime still needs the browser client: the channel only signals that
 * something changed, and the refetch is what actually loads it.
 */
export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const { data: notifications = [] } = useQuery({
    queryKey: ["portal-notifications"],
    queryFn: async () => listNotifications({ headers: await authHeaders() }),
  });

  useEffect(() => {
    let cancelled = false;
    // Unique topic per mount: a shared topic name is reused by supabase-js,
    // so a second mount would try to add callbacks after subscribe().
    const channel = supabase.channel(`notifications:${Math.random().toString(36).slice(2)}`);

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const meta = user.user_metadata as { notif_portal?: boolean } | undefined;
      if (typeof meta?.notif_portal === "boolean") setEnabled(meta.notif_portal);
      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            qc.invalidateQueries({ queryKey: ["portal-notifications"] });
          },
        )
        .subscribe();
    };
    init();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const unread = notifications.filter((n) => !n.read_at);

  const readOneMut = useMutation({
    mutationFn: async (id: string) =>
      markNotificationRead({ data: { id }, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-notifications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const readAllMut = useMutation({
    mutationFn: async () => markAllNotificationsRead({ headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-notifications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!enabled) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unread.length > 0 ? `Notifications, ${unread.length} unread` : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unread.length > 0 && (
              <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                {unread.length}
              </span>
            )}
          </div>
          {unread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={readAllMut.isPending}
              onClick={() => readAllMut.mutate()}
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Alerts from your divisions will appear here.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {notifications.map((n) => {
                const route = n.division ? DIVISION_ROUTES[n.division] : undefined;
                const body = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {!n.read_at && (
                          <span
                            className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                            aria-hidden="true"
                          />
                        )}
                        <span className="text-sm font-medium leading-tight">{n.title}</span>
                      </div>
                      <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {n.body && (
                      <p className="pl-3.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    )}
                    {n.division && (
                      <span className="pl-3.5 text-[10px] uppercase tracking-wider text-gold/70">
                        {DIVISION_LABELS[n.division] ?? n.division}
                      </span>
                    )}
                  </>
                );

                return (
                  <li key={n.id} className={cn("group relative", !n.read_at && "bg-gold/5")}>
                    {/* Opening a notification is what marks it read — the bell
                        used to have no way to read one item, so the badge
                        stayed lit until you cleared the whole list. */}
                    {route ? (
                      <Link
                        to={route}
                        onClick={() => {
                          if (!n.read_at) readOneMut.mutate(n.id);
                          setOpen(false);
                        }}
                        className="flex flex-col gap-1 p-4 pr-10 transition-colors hover:bg-surface-elevated"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className="flex flex-col gap-1 p-4 pr-10">{body}</div>
                    )}
                    {!n.read_at && (
                      <button
                        onClick={() => readOneMut.mutate(n.id)}
                        disabled={readOneMut.isPending}
                        aria-label={`Mark "${n.title}" as read`}
                        title="Mark as read"
                        className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-surface-elevated hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
