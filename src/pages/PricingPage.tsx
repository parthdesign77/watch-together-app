import { CheckCircle2, Crown, Sparkles } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { activateDemoSubscription } from "../hooks/useSubscription";
import { planDetails } from "../lib/constants";
import { useUiStore } from "../store/uiStore";

export function PricingPage() {
  const { profile } = useAuth();
  const pushToast = useUiStore((state) => state.pushToast);

  async function activate(plan: "standard" | "premium") {
    if (!profile) return;
    await activateDemoSubscription(profile, plan);
    pushToast({
      title: `${planDetails[plan].name} activated`,
      description: "Demo checkout completed. Replace this with Razorpay or Stripe keys for production billing.",
      type: "success"
    });
  }

  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-6">
        <Badge tone="purple">
          <Sparkles className="h-3.5 w-3.5" />
          Completely ad-free
        </Badge>
        <h1 className="mt-4 font-display text-4xl font-black">Premium Plans</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Razorpay/Stripe-ready subscription records are stored in Firestore. This build includes a demo checkout switch so the app works immediately.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(planDetails).map(([key, plan]) => (
          <article key={key} className="glass cinema-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`bg-gradient-to-r ${plan.accent} bg-clip-text font-display text-4xl font-black text-transparent`}>{plan.name}</h2>
                <p className="mt-2 text-2xl font-black">{plan.price}</p>
              </div>
              {key === "premium" ? <Crown className="h-10 w-10 text-movie" /> : null}
            </div>
            <p className="mt-3 text-sm text-muted">{plan.participants}</p>
            <div className="my-6 h-px bg-white/10" />
            <div className="space-y-3">
              {plan.features.map((feature) => (
                <p key={feature} className="flex items-center gap-2 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-anime" />
                  {feature}
                </p>
              ))}
            </div>
            <Button className="mt-6 w-full" onClick={() => activate(key as "standard" | "premium")}>
              Activate {plan.name}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
