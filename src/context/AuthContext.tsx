import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth, db, googleProvider } from "../lib/firebase";
import { hasPremiumAccess, premiumAccessWindow } from "../lib/premiumAccess";
import type { UserProfile } from "../types";

/* ------------------------------------------------------------------ */
/*  Human-readable Firebase error messages                             */
/* ------------------------------------------------------------------ */
const friendlyErrors: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
  "auth/user-not-found": "No account found with that email. Try signing up.",
  "auth/wrong-password": "Incorrect password. Try again or reset it.",
  "auth/invalid-credential": "Incorrect email or password. Try again or reset it.",
  "auth/email-already-in-use": "An account with that email already exists. Try logging in.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/popup-closed-by-user": "The Google sign-in popup was closed. Try again.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups for this site and try again.",
  "auth/cancelled-popup-request": "Sign-in was cancelled. Please try again.",
  "auth/network-request-failed": "Network error. Check your internet connection.",
  "auth/operation-not-allowed": "This sign-in method is not enabled. Check Firebase Console → Authentication → Sign-in method.",
  "auth/unauthorized-domain": "This domain is not authorized for sign-in. Add it to Firebase Console → Authentication → Settings → Authorized domains.",
  "auth/internal-error": "Something went wrong on our end. Please try again."
};

export function getFriendlyAuthError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    return friendlyErrors[code] || `Authentication error (${code}). Please try again.`;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred. Please try again.";
}

/* ------------------------------------------------------------------ */
/*  Context shape                                                      */
/* ------------------------------------------------------------------ */
interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const avatarColors = ["#DC2626", "#EF4444", "#991B1B", "#7F1D1D", "#F43F5E"];

function colorFor(uid: string) {
  return avatarColors[uid.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarColors.length];
}

async function ensureProfile(firebaseUser: User, fallbackName?: string): Promise<UserProfile> {
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

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          try {
            await ensureProfile(currentUser);
            // Real-time synchronization of the user profile document
            unsubscribeProfile = onSnapshot(
              doc(db, "users", currentUser.uid),
              (snapshot) => {
                if (snapshot.exists()) {
                  setProfile({ uid: currentUser.uid, ...snapshot.data() } as UserProfile);
                }
              },
              (error) => {
                console.warn("[AuthContext] profile onSnapshot error:", error);
              }
            );
          } catch (profileError) {
            console.warn("[Watch Together] Could not load/create user profile:", profileError);
            setProfile({
              uid: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
              email: currentUser.email || "",
              avatar: currentUser.photoURL || "",
              avatarColor: colorFor(currentUser.uid),
              watchlist: [],
              recentRooms: [],
              viewingHistory: [],
              subscriptionPlan: "free",
              subscriptionStatus: "inactive",
              paymentProvider: "demo",
              premiumBadge: false,
              createdAt: Date.now()
            });
          }
        } else {
          setProfile(null);
          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = undefined;
          }
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Handle redirect result (when signInWithRedirect is used as fallback)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          console.log("[Watch Together] Redirect sign-in succeeded:", result.user.email);
          setUser(result.user);
          setProfile(await ensureProfile(result.user));
        }
      })
      .catch((err) => {
        console.error("[Watch Together] Redirect sign-in failed:", err);
        const msg = getFriendlyAuthError(err);
        setError(msg);
      });
  }, []);

  const profileWithPremiumOverride = useMemo(() => {
    if (!profile) return null;
    const isPremium = hasPremiumAccess(profile.email);
    if (isPremium) {
      return {
        ...profile,
        subscriptionPlan: "premium" as const,
        subscriptionStatus: "active" as const,
        premiumBadge: true
      };
    }
    return profile;
  }, [profile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile: profileWithPremiumOverride,
      loading,
      error,
      clearError: () => setError(null),

      signInWithGoogle: async () => {
        setLoading(true);
        setError(null);
        try {
          console.log("[Watch Together] Starting Google sign-in popup…");
          const result = await signInWithPopup(auth, googleProvider);
          console.log("[Watch Together] Google sign-in succeeded:", result.user.email);
          setUser(result.user);
          setProfile(await ensureProfile(result.user));
        } catch (err: unknown) {
          console.error("[Watch Together] Google sign-in popup FAILED:", err);
          const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
          console.error("[Watch Together] Error code:", code);

          // If popup fails due to unauthorized-domain or popup issues, try redirect
          if (code === "auth/unauthorized-domain" || code === "auth/popup-blocked") {
            console.log("[Watch Together] Falling back to redirect sign-in…");
            try {
              await signInWithRedirect(auth, googleProvider);
              return; // redirect will navigate away
            } catch (redirectErr) {
              console.error("[Watch Together] Redirect sign-in also failed:", redirectErr);
            }
          }

          const msg = getFriendlyAuthError(err);
          setError(msg);
          throw new Error(msg);
        } finally {
          setLoading(false);
        }
      },

      signInWithEmail: async (email, password) => {
        setLoading(true);
        setError(null);
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          setUser(result.user);
          setProfile(await ensureProfile(result.user));
        } catch (err) {
          const msg = getFriendlyAuthError(err);
          setError(msg);
          throw new Error(msg);
        } finally {
          setLoading(false);
        }
      },

      signUpWithEmail: async (name, email, password) => {
        setLoading(true);
        setError(null);
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);

          // Persist the display name on the Firebase Auth user
          await updateProfile(result.user, { displayName: name });

          setUser(result.user);
          setProfile(await ensureProfile(result.user, name));
        } catch (err) {
          const msg = getFriendlyAuthError(err);
          setError(msg);
          throw new Error(msg);
        } finally {
          setLoading(false);
        }
      },

      resetPassword: async (email: string) => {
        setError(null);
        try {
          await sendPasswordResetEmail(auth, email);
        } catch (err) {
          const msg = getFriendlyAuthError(err);
          setError(msg);
          throw new Error(msg);
        }
      },

      logout: async () => {
        await signOut(auth);
        setUser(null);
        setProfile(null);
      }
    }),
    [loading, profileWithPremiumOverride, user, error]
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
