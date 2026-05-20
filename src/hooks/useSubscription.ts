import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import type { SubscriptionPlan, UserProfile } from "../types";

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planName: SubscriptionPlan;
  amount: number;
  billingCycle: "monthly";
  paymentStatus: "active" | "cancelled" | "past_due";
  paymentProvider: "razorpay" | "stripe" | "demo";
  startedAt: number;
  expiresAt: number;
}

export function useSubscription(profile?: UserProfile | null) {
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);

  useEffect(() => {
    if (!profile) return;
    return onSnapshot(doc(db, "subscriptions", profile.uid), (snapshot) => {
      setSubscription(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as SubscriptionRecord) : null);
    });
  }, [profile]);

  return subscription;
}

export async function activateDemoSubscription(profile: UserProfile, planName: Exclude<SubscriptionPlan, "free">) {
  const now = Date.now();
  const amount = planName === "premium" ? 700 : 200;

  await setDoc(doc(db, "subscriptions", profile.uid), {
    userId: profile.uid,
    planName,
    amount,
    billingCycle: "monthly",
    paymentStatus: "active",
    paymentProvider: "demo",
    startedAt: now,
    expiresAt: now + 1000 * 60 * 60 * 24 * 30,
    updatedAt: serverTimestamp()
  });

  await updateDoc(doc(db, "users", profile.uid), {
    subscriptionPlan: planName,
    subscriptionStatus: "active",
    subscriptionStart: now,
    subscriptionEnd: now + 1000 * 60 * 60 * 24 * 30,
    premiumBadge: planName === "premium",
    paymentProvider: "demo",
    updatedAt: serverTimestamp()
  });
}
