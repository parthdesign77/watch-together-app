import { CreditCard, Download, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../hooks/useSubscription";

export function BillingPage() {
  const { profile } = useAuth();
  const subscription = useSubscription(profile);

  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-6">
        <Badge tone="cyan">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure billing
        </Badge>
        <h1 className="mt-4 font-display text-4xl font-black">Billing</h1>
        <p className="mt-2 text-sm text-muted">Subscription status, renewal, invoices, upgrade/downgrade, and cancellation controls.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="glass rounded-lg p-5">
          <h2 className="font-display text-2xl font-bold">Current Plan</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Plan</p>
              <p className="mt-2 text-2xl font-black capitalize">{subscription?.planName || profile?.subscriptionPlan || "free"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Status</p>
              <p className="mt-2 text-2xl font-black capitalize">{subscription?.paymentStatus || profile?.subscriptionStatus || "inactive"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Renewal</p>
              <p className="mt-2 text-2xl font-black">
                {subscription ? new Date(subscription.expiresAt).toLocaleDateString() : "None"}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button>
              <RefreshCw className="h-4 w-4" />
              Manage Plan
            </Button>
            <Button variant="secondary">
              <CreditCard className="h-4 w-4" />
              Update Payment
            </Button>
          </div>
        </section>

        <section className="glass rounded-lg p-5">
          <h2 className="font-display text-xl font-bold">Invoices</h2>
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/8 p-3">
                <div>
                  <p className="text-sm font-bold">Invoice #{202605 - index}</p>
                  <p className="text-xs text-muted">{index + 1} month ago</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Download invoice">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
