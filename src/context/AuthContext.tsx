import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth, db, googleProvider } from "../lib/firebase";
import { hasPremiumAccess, premiumAccessWindow } from "../lib/premiumAccess";
import type { UserProfile } from "../types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const avatarColors = ["#DC2626", "#EF4444", "#991B1B", "#7F1D1D", "#F43F5E"];

function colorFor(uid: string) {
  return avatarColors[uid.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarColors.length];
}

async function ensureProfile(firebaseUser: User, fallbackName?: string) {
  const ref = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(ref);
  const now = Date.now();
  const premiumAccess = hasPremiumAccess(firebaseUser.email);
  const premiumWindow = premiumAccess ? premiumAccessWindow() : null;
  const premiumFields = premiumAccess
    ? {
        subscriptionPlan: "premium" as const,
        subscriptionStatus: "active" as const,
        subscriptionStart: premiumWindow!.startedAt,
        subscriptionEnd: premiumWindow!.expiresAt,
        paymentProvider: "demo" as const,
        premiumBadge: true
      }
    : {};

  if (!snapshot.exists()) {
    const profile: UserProfile = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || fallbackName || firebaseUser.email?.split("@")[0] || "Cinema Friend",
      email: firebaseUser.email || "",
      avatar: firebaseUser.photoURL || "",
      avatarColor: colorFor(firebaseUser.uid),
      watchlist: [],
      recentRooms: [],
      viewingHistory: [],
      subscriptionPlan: premiumAccess ? "premium" : "free",
      subscriptionStatus: premiumAccess ? "active" : "inactive",
      paymentProvider: "demo",
      premiumBadge: premiumAccess,
      createdAt: now,
      ...(premiumWindow
        ? {
            subscriptionStart: premiumWindow.startedAt,
            subscriptionEnd: premiumWindow.expiresAt
          }
        : {})
    };

    await setDoc(ref, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    if (premiumAccess && premiumWindow) {
      await setDoc(
        doc(db, "subscriptions", firebaseUser.uid),
        {
          userId: firebaseUser.uid,
          planName: "premium",
          amount: 700,
          billingCycle: "monthly",
          paymentStatus: "active",
          paymentProvider: "demo",
          startedAt: premiumWindow.startedAt,
          expiresAt: premiumWindow.expiresAt,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }
    return profile;
  }

  await updateDoc(ref, {
    name: firebaseUser.displayName || snapshot.data().name,
    email: firebaseUser.email || snapshot.data().email,
    avatar: firebaseUser.photoURL || snapshot.data().avatar || "",
    ...premiumFields,
    updatedAt: serverTimestamp()
  });
  if (premiumAccess && premiumWindow) {
    await setDoc(
      doc(db, "subscriptions", firebaseUser.uid),
      {
        userId: firebaseUser.uid,
        planName: "premium",
        amount: 700,
        billingCycle: "monthly",
        paymentStatus: "active",
        paymentProvider: "demo",
        startedAt: premiumWindow.startedAt,
        expiresAt: premiumWindow.expiresAt,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  const data = snapshot.data() as UserProfile;
  return {
    ...data,
    ...premiumFields,
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || data.name,
    email: firebaseUser.email || data.email,
    avatar: firebaseUser.photoURL || data.avatar || ""
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setProfile(await ensureProfile(currentUser));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      signInWithGoogle: async () => {
        setLoading(true);
        try {
          const result = await signInWithPopup(auth, googleProvider);
          setUser(result.user);
          setProfile(await ensureProfile(result.user));
        } finally {
          setLoading(false);
        }
      },
      signInWithEmail: async (email, password) => {
        setLoading(true);
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          setUser(result.user);
          setProfile(await ensureProfile(result.user));
        } finally {
          setLoading(false);
        }
      },
      signUpWithEmail: async (name, email, password) => {
        setLoading(true);
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          setUser(result.user);
          setProfile(await ensureProfile(result.user, name));
        } finally {
          setLoading(false);
        }
      },
      logout: async () => {
        await signOut(auth);
      }
    }),
    [loading, profile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
