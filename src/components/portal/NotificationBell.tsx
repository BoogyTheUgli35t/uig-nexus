import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  division: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const fetchNotifications = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data as Notification[]);
    }
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      await fetchNotifications();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const meta = user?.user_metadata as { notif_portal?: boolean } | undefined;
      if (typeof meta?.notif_portal === "boolean") setEnabled(meta.notif_portal);
      if (user) {
        channel = supabase
          .channel("public:notifications")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              fetchNotifications();
            },
          )
          .subscribe();
      }
    };
    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markAllAsRead = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userData.user.id)
      .is("read_at", null);

    fetchNotifications();
  };

  if (!enabled) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-gold/20 text-gold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex flex-col gap-1 transition-colors ${
                    !n.read_at ? "bg-gold/5" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      {!n.read_at && (
                        <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0 mt-1" />
                      )}
                      <span className="font-medium text-sm leading-tight">{n.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {n.body && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pl-3.5">{n.body}</p>
                  )}
                  {n.division && (
                    <span className="text-[10px] text-gold/70 uppercase tracking-wider pl-3.5">
                      {n.division}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
