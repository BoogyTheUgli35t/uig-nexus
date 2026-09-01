import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, AlertCircle } from "lucide-react";
import { listMyBilling, createCheckoutSession, paymentsConfigured } from "@/lib/billing.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_apex/portal/billing")({
  head: () => ({ meta: [{ title: "Billing — UIG Apex" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    paid: search.paid === "1",
    canceled: search.canceled === "1",
  }),
  component: BillingPage,
});

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

function BillingPage() {
  const { paid, canceled } = Route.useSearch();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["payments-configured"],
    queryFn: async () => paymentsConfigured(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["my-billing"],
    queryFn: async () => listMyBilling({ headers: await authHeaders() }),
  });

  useEffect(() => {
    if (paid) toast.success("Payment received — thank you.");
    if (canceled) toast("Checkout canceled.");
  }, [paid, canceled]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const amountNaira = Number(amount);
    if (!description.trim() || !amountNaira || amountNaira <= 0) return;
    setCreating(true);
    try {
      const res = await createCheckoutSession({
        data: {
          description: description.trim(),
          amount_kobo: Math.round(amountNaira * 100),
          currency: "ngn",
          origin: window.location.origin,
        },
        headers: await authHeaders(),
      });
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout");
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Shared infra</p>
        <h1 className="mt-2 text-3xl font-bold">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Payments run through Stripe Checkout. Invoices across divisions (like Technology milestone
          billing) can also be paid directly from their own page.
        </p>
      </div>

      {config && !config.configured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Payments aren't connected yet. Set <code className="font-mono">STRIPE_SECRET_KEY</code>{" "}
            and <code className="font-mono">STRIPE_WEBHOOK_SECRET</code> in your environment to
            enable real checkout — a Stripe test key works without moving real money.
          </div>
        </div>
      )}

      <DataPanel title="Request a payment">
        <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bill-desc">What's this for?</Label>
            <Input
              id="bill-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Consulting retainer — July"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bill-amount">Amount (₦)</Label>
            <Input
              id="bill-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={creating || !description.trim() || !amount}
            className="self-end bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <CreditCard className="mr-2 h-4 w-4" />{" "}
            {creating ? "Redirecting…" : "Checkout with Stripe"}
          </Button>
        </form>
      </DataPanel>

      <DataPanel title="Transaction history">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={CreditCard} title="No transactions yet" />
        ) : (
          <div className="divide-y divide-border">
            {data.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{t.description}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString()}
                    {t.division ? ` · ${t.division}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-medium">{naira(t.amount_kobo)}</span>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
