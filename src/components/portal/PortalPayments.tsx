import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, Building2 } from "lucide-react";
import { toast } from "sonner";
import { authHeaders } from "@/lib/auth-headers";
import { payMyRent, listInvestableAssets, reserveAsset } from "@/lib/portal-payments.functions";
import { rentInstalmentKobo, ASSET_RESERVATION_KOBO } from "@/lib/portal-payments";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";

const fromKobo = (k: number) => `₦${(k / 100).toLocaleString()}`;

function useReturnToast() {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  if (p.get("paid")) toast.success("Payment received — thank you.", { id: "paid" });
  if (p.get("canceled")) toast.message("Checkout cancelled.", { id: "canceled" });
}

export function PayRentPanel({ annualRent }: { annualRent: number }) {
  useReturnToast();
  const amount = rentInstalmentKobo(annualRent);
  const mut = useMutation({
    mutationFn: async () =>
      payMyRent({ data: { origin: window.location.origin }, headers: await authHeaders() }),
    onSuccess: (r) => (window.location.href = r.url),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <DataPanel title="Pay rent">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Monthly instalment: <span className="font-semibold text-foreground">{fromKobo(amount)}</span>
          . Secure card payment by Stripe.
        </p>
        <Button onClick={() => mut.mutate()} disabled={amount <= 0 || mut.isPending}>
          <CreditCard className="mr-2 h-4 w-4" />
          {mut.isPending ? "Opening checkout…" : "Pay rent now"}
        </Button>
      </div>
    </DataPanel>
  );
}

export function BuyAssetsPanel() {
  useReturnToast();
  const { data, isLoading } = useQuery({
    queryKey: ["investable-assets"],
    queryFn: async () => listInvestableAssets({ headers: await authHeaders() }),
  });
  const mut = useMutation({
    mutationFn: async (property_id: string) =>
      reserveAsset({
        data: { origin: window.location.origin, property_id },
        headers: await authHeaders(),
      }),
    onSuccess: (r) => (window.location.href = r.url),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <DataPanel title="Buy an asset">
      <p className="mb-4 text-sm text-muted-foreground">
        Reserve a property with a {fromKobo(ASSET_RESERVATION_KOBO)} deposit. Your relationship
        manager completes the purchase with you.
      </p>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading assets…</div>
      ) : !data?.length ? (
        <EmptyState icon={Building2} title="No assets open for investment right now" />
      ) : (
        <ul className="divide-y divide-border">
          {data.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <div className="text-sm font-medium">{p.title}</div>
                <div className="text-xs text-muted-foreground">
                  {[p.city, p.state].filter(Boolean).join(", ")} · ₦
                  {Number(p.price).toLocaleString()}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={mut.isPending}
                onClick={() => mut.mutate(p.id)}
              >
                Reserve
              </Button>
            </li>
          ))}
        </ul>
      )}
    </DataPanel>
  );
}
