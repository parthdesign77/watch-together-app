import { CreditCard, Download, RefreshCw, ShieldCheck, CheckCircle2, Sparkles, Crown, Gift } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useSubscription, activateDemoSubscription, deactivateSubscription } from "../hooks/useSubscription";
import { useUiStore } from "../store/uiStore";
import { hasPremiumAccess } from "../lib/premiumAccess";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function BillingPage() {
  const { profile } = useAuth();
  const subscription = useSubscription(profile);
  const pushToast = useUiStore((state) => state.pushToast);

  const isPremiumEmail = hasPremiumAccess(profile?.email);
  const activePlan = isPremiumEmail ? "premium" : (subscription?.planName || profile?.subscriptionPlan || "free");
  const activeStatus = isPremiumEmail ? "active" : (subscription?.paymentStatus || profile?.subscriptionStatus || "inactive");

  async function handleActivate(plan: "standard" | "premium") {
    if (!profile) return;
    
    const amount = plan === "premium" ? 700 : 200;
    
    // Dynamic load Razorpay payment SDK script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      pushToast({
        title: "Payment SDK failed to load",
        description: "Razorpay script failed to load. Please check your internet connection.",
        type: "error"
      });
      return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SrvWEug6a6cY0x";

    const options = {
      key: keyId,
      amount: amount * 100, // paise
      currency: "INR",
      name: "Watch Together",
      description: `${plan === "premium" ? "Premium" : "Standard"} Subscription`,
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=128&h=128&fit=crop",
      handler: async function (response: any) {
        try {
          await activateDemoSubscription(profile, plan, "razorpay");
          pushToast({
            title: "Payment Successful",
            description: `Successfully upgraded to ${plan}! Payment ID: ${response.razorpay_payment_id}`,
            type: "success"
          });
        } catch (err) {
          pushToast({
            title: "Activation failed",
            description: err instanceof Error ? err.message : "Something went wrong.",
            type: "error"
          });
        }
      },
      prefill: {
        name: profile.name,
        email: profile.email
      },
      theme: {
        color: plan === "premium" ? "#a855f7" : "#06b6d4"
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      pushToast({
        title: "Failed to load payment modal",
        description: "An unexpected error occurred during Razorpay loading.",
        type: "error"
      });
    }
  }

  async function handleDowngrade() {
    if (!profile) return;
    try {
      await deactivateSubscription(profile);
      pushToast({
        title: "Subscription Cancelled",
        description: "Successfully reverted back to the Free plan.",
        type: "success"
      });
    } catch (err) {
      pushToast({
        title: "Cancellation failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        type: "error"
      });
    }
  }

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
              <p className="mt-2 text-2xl font-black capitalize text-snow">{activePlan}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Status</p>
              <p className="mt-2 text-2xl font-black capitalize text-snow">{activeStatus}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Renewal</p>
              <p className="mt-2 text-2xl font-black text-snow">
                {isPremiumEmail ? "Never Expires (Gifted)" : (subscription ? new Date(subscription.expiresAt).toLocaleDateString() : "None")}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => document.getElementById("pricing-plans")?.scrollIntoView({ behavior: "smooth" })}>
              <RefreshCw className="h-4 w-4" />
              Manage Plan
            </Button>
            <Button variant="secondary">
              <CreditCard className="h-4 w-4" />
              Update Payment
            </Button>
          </div>
        </section>

        {activePlan !== "free" && (
          <section className="glass rounded-lg p-5">
            <h2 className="font-display text-xl font-bold">Invoices</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/8 p-3.5">
                <div>
                  <p className="text-sm font-bold text-snow">
                    Invoice #{subscription?.id ? subscription.id.slice(0, 8).toUpperCase() : "WT" + Date.now().toString().slice(-6)}
                  </p>
                  <p className="text-xs text-muted">
                    {activePlan === "premium" ? "Premium Plan (₹700)" : "Standard Plan (₹200)"} • Paid via {profile?.paymentProvider || subscription?.paymentProvider || "razorpay"}
                  </p>
                  <p className="text-[10px] text-muted-more mt-0.5 opacity-60">
                    {subscription?.startedAt ? new Date(subscription.startedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "Active Now"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Download invoice">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Plans Section */}
      <section id="pricing-plans" className="glass rounded-lg p-6 space-y-6 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Badge tone="purple">
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade your cinematic experience
            </Badge>
            <h2 className="mt-2 font-display text-3xl font-black">Available Subscription Plans</h2>
            <p className="text-sm text-muted">Choose the perfect plan to watch movies, anime, and share screens with your friends.</p>
          </div>
          {isPremiumEmail && (
            <div className="flex items-center gap-2 rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 text-purple-300 text-sm">
              <Gift className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Premium Access Granted</p>
                <p className="text-xs opacity-80">Your email has active premium benefits courtesy of support.</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Free Card */}
          <article className={`relative flex flex-col justify-between rounded-lg border p-6 transition-all duration-300 ${
            activePlan === "free"
              ? "border-cyan/50 bg-[#0c1219]/70 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              : "border-white/10 bg-white/4 hover:bg-white/6"
          }`}>
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold font-display text-snow">Free Plan</h3>
                  <p className="mt-1 text-xs text-muted">For basic watch parties</p>
                </div>
                {activePlan === "free" && <Badge tone="cyan">Active</Badge>}
              </div>

              <p className="mt-4 text-3xl font-black text-snow">₹0<span className="text-sm font-normal text-muted">/month</span></p>

              <div className="my-5 h-px bg-white/10" />

              <ul className="space-y-2.5 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Up to 2 participants</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Standard 480p watch rooms</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Real-time playback sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Basic chat and reactions</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              {activePlan === "free" ? (
                <Button className="w-full bg-white/10 border-white/10 text-neutral-400 cursor-not-allowed" disabled>
                  You already have
                </Button>
              ) : isPremiumEmail ? (
                <Button className="w-full" disabled variant="ghost">
                  Locked (Premium Active)
                </Button>
              ) : (
                <Button className="w-full" variant="secondary" onClick={handleDowngrade}>
                  Downgrade to Free
                </Button>
              )}
            </div>
          </article>

          {/* Standard Card */}
          <article className={`relative flex flex-col justify-between rounded-lg border p-6 transition-all duration-300 ${
            activePlan === "standard"
              ? "border-cyan/50 bg-[#0c1219]/70 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              : "border-white/10 bg-white/4 hover:bg-white/6"
          }`}>
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold font-display text-cyan">Standard Plan</h3>
                  <p className="mt-1 text-xs text-muted">Perfect for families & close friends</p>
                </div>
                {activePlan === "standard" && <Badge tone="cyan">Active</Badge>}
              </div>

              <p className="mt-4 text-3xl font-black text-snow">₹200<span className="text-sm font-normal text-muted">/month</span></p>

              <div className="my-5 h-px bg-white/10" />

              <ul className="space-y-2.5 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Up to 5 participants</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>HD 720p watch rooms</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Voice chat in room</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Basic screen sharing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Completely ad-free</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              {activePlan === "standard" ? (
                <Button className="w-full bg-white/10 border-white/10 text-neutral-400 cursor-not-allowed" disabled>
                  You already have
                </Button>
              ) : isPremiumEmail ? (
                <Button className="w-full" disabled variant="ghost">
                  Locked (Premium Active)
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleActivate("standard")}>
                  Activate Standard
                </Button>
              )}
            </div>
          </article>

          {/* Premium Card */}
          <article className={`relative flex flex-col justify-between rounded-lg border p-6 transition-all duration-300 ${
            activePlan === "premium"
              ? "border-purple-500/50 bg-[#160d19]/70 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              : "border-white/10 bg-white/4 hover:bg-white/6"
          }`}>
            <div className="absolute -top-3 right-4">
              <Badge tone="purple" className="flex items-center gap-1 py-1 font-bold shadow-glow-sm">
                <Crown className="h-3.5 w-3.5" />
                POPULAR
              </Badge>
            </div>

            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold font-display text-purple-400">Premium Plan</h3>
                  <p className="mt-1 text-xs text-muted">The ultimate VIP sync experience</p>
                </div>
                {activePlan === "premium" && <Badge tone="purple">Active</Badge>}
              </div>

              <p className="mt-4 text-3xl font-black text-snow">₹700<span className="text-sm font-normal text-muted">/month</span></p>

              <div className="my-5 h-px bg-white/10" />

              <ul className="space-y-2.5 text-sm text-slate-200">
                <li className="flex items-center gap-2 font-semibold text-purple-300">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Up to 20 participants</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Full HD 1080p watch rooms</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Ultra-low latency playback sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>HD screen sharing + system audio</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Premium voice & room controls</span>
                </li>
                <li className="flex items-center gap-2 text-purple-300">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Premium profile badge & themes</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              {activePlan === "premium" ? (
                <Button className="w-full bg-white/10 border-white/10 text-neutral-400 cursor-not-allowed" disabled>
                  You already have
                </Button>
              ) : (
                <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 border-none text-white hover:brightness-110 active:brightness-95 transition shadow-glow" onClick={() => handleActivate("premium")}>
                  Activate Premium
                </Button>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
