import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Lock, Bell, Shield, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_apex/portal/settings")({
  head: () => ({
    meta: [{ title: "Settings — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPortal, setNotifPortal] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [joinedAt, setJoinedAt] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? "");
      setUserId(u.id);
      setJoinedAt(
        u.created_at
          ? new Date(u.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "",
      );

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.id)
        .maybeSingle();
      setName(prof?.full_name ?? "");

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id)
        .limit(1)
        .maybeSingle();
      setRole(roleRow?.role ?? "");

      const meta = u.user_metadata as
        | { notif_email?: boolean; notif_portal?: boolean }
        | undefined;
      if (typeof meta?.notif_email === "boolean") setNotifEmail(meta.notif_email);
      if (typeof meta?.notif_portal === "boolean") setNotifPortal(meta.notif_portal);
    })();
  }, []);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return setSaving(false);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", data.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved.");
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function onSaveNotifications(e: React.FormEvent) {
    e.preventDefault();
    setSavingNotifs(true);
    // Notification preferences stored in user metadata
    const { error } = await supabase.auth.updateUser({
      data: { notif_email: notifEmail, notif_portal: notifPortal },
    });
    setSavingNotifs(false);
    if (error) return toast.error(error.message);
    toast.success("Notification preferences saved.");
  }

  return (
    <div className="space-y-10 max-w-2xl pb-16">
      {/* Header */}
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Settings</p>
        <h1 className="mt-2 text-3xl font-bold">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, security, and notification preferences.
        </p>
      </div>

      {/* Account overview badge */}
      <div className="rounded-xl border border-border bg-surface p-4 flex flex-wrap items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-lg shrink-0">
          {name ? name[0].toUpperCase() : (email[0]?.toUpperCase() ?? "U")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{name || email}</div>
          <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-3">
            {role && (
              <span className="inline-flex items-center gap-1">
                <Shield className="h-3 w-3 text-gold" />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            )}
            {joinedAt && <span>Member since {joinedAt}</span>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Profile */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <User className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-semibold">Profile information</h2>
        </div>
        <form
          onSubmit={onSaveProfile}
          className="rounded-xl border border-border bg-surface p-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" value={email} disabled className="opacity-60" />
              <p className="text-[10px] text-muted-foreground">
                Contact support to change your email.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-id">User ID</Label>
            <Input id="user-id" value={userId} disabled className="opacity-50 font-mono text-xs" />
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </section>

      <Separator />

      {/* Password */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Lock className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-semibold">Change password</h2>
        </div>
        <form
          onSubmit={onChangePassword}
          className="rounded-xl border border-border bg-surface p-6 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="new-pass">New password</Label>
            <Input
              id="new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pass">Confirm new password</Label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Passwords do not match.
            </p>
          )}
          <Button
            type="submit"
            disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
            variant="outline"
          >
            {changingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            {changingPassword ? "Updating..." : "Update password"}
          </Button>
        </form>
      </section>

      <Separator />

      {/* Notifications */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-semibold">Notification preferences</h2>
        </div>
        <form
          onSubmit={onSaveNotifications}
          className="rounded-xl border border-border bg-surface p-6 space-y-4"
        >
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={notifEmail}
              onChange={(e) => setNotifEmail(e.target.checked)}
              className="mt-1 accent-[hsl(var(--gold))]"
            />
            <div>
              <div className="font-medium text-sm">Email notifications</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Receive project updates, task assignments, and alerts via email.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={notifPortal}
              onChange={(e) => setNotifPortal(e.target.checked)}
              className="mt-1 accent-[hsl(var(--gold))]"
            />
            <div>
              <div className="font-medium text-sm">In-portal notifications</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Show the notification bell for in-app updates and activity.
              </div>
            </div>
          </label>
          <Button type="submit" disabled={savingNotifs} variant="outline">
            {savingNotifs ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            {savingNotifs ? "Saving..." : "Save preferences"}
          </Button>
        </form>
      </section>

      <Separator />

      {/* Danger zone */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
          <div>
            <div className="font-medium text-sm">Sign out of all devices</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              This will invalidate all active sessions across all devices.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={async () => {
              await supabase.auth.signOut({ scope: "global" });
              toast.success("Signed out of all devices.");
            }}
          >
            Sign out everywhere
          </Button>
        </div>
      </section>
    </div>
  );
}
