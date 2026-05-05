import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_portal/portal/settings")({
  head: () => ({ meta: [{ title: "Settings — UIG Apex" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? "");
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", u.id).maybeSingle();
      setName(prof?.full_name ?? "");
    })();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return setSaving(false);
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", data.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Settings</p>
        <h1 className="mt-2 text-3xl font-bold">Your profile</h1>
      </div>
      <form onSubmit={onSave} className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </div>
        <Button type="submit" disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90">
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}
