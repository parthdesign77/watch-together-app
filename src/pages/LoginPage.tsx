import { FormEvent, useState } from "react";
import { Chrome, KeyRound, Loader2, Mail, MonitorPlay } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useUiStore } from "../store/uiStore";

export function LoginPage() {
  const { user, loading, error: authError, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, clearError } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pushToast = useUiStore((state) => state.pushToast);
  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || "/dashboard";

  // Already logged in — redirect
  if (user) return <Navigate to={redirectTo} replace />;

  const displayError = localError || authError;

  async function finish(action: () => Promise<void>) {
    setLocalError(null);
    clearError();
    setSubmitting(true);
    try {
      await action();
      pushToast({ title: "Welcome to Watch Together", description: "Your session is ready.", type: "success" });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setLocalError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void finish(() => (mode === "signup" ? signUpWithEmail(name, email, password) : signInWithEmail(email, password)));
  }

  async function handleForgotPassword() {
    if (!email) {
      setLocalError("Enter your email address above, then click Forgot Password.");
      return;
    }
    setLocalError(null);
    clearError();
    try {
      await resetPassword(email);
      setResetSent(true);
      pushToast({ title: "Password reset sent", description: `Check ${email} for a reset link.`, type: "success" });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not send reset email.");
    }
  }

  async function handleDemoLogin() {
    await finish(async () => {
      const demoEmail = "demo@watchtogether.app";
      const demoPassword = "demoPassword123";
      try {
        console.log("[Watch Together] Attempting demo sign in…");
        await signInWithEmail(demoEmail, demoPassword);
      } catch (err: any) {
        console.log("[Watch Together] Demo sign in failed (normal if account doesn't exist yet), attempting registration…");
        // If it's a new database/project, create the demo account first
        await signUpWithEmail("Cinema Guest", demoEmail, demoPassword);
      }
    });
  }

  const isDisabled = loading || submitting;

  return (
    <div className="grid min-h-screen bg-cinema-radial text-snow lg:grid-cols-[1.15fr_.85fr]">
      {/* ---------- Left hero panel ---------- */}
      <section className="relative hidden overflow-hidden lg:block">
        <img src="https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/76 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end p-12">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-cyan via-premium to-movie">
              <MonitorPlay className="h-6 w-6" />
            </span>
            <span className="font-display text-2xl font-black">Watch Together</span>
          </div>
          <h1 className="max-w-2xl font-display text-6xl font-black leading-none">Rooms that stay in sync, even when the night gets loud.</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">Google sign-in, voice chat, HD screen share, watchlists, and realtime Firebase state are ready after login.</p>
        </div>
      </section>

      {/* ---------- Right auth panel ---------- */}
      <section className="flex items-center justify-center px-4 py-10">
        <div className="glass cinema-border w-full max-w-md rounded-lg p-6">
          <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-cyan via-premium to-movie">
              <MonitorPlay className="h-5 w-5" />
            </span>
            <span className="font-display font-black">Watch Together</span>
          </Link>

          <h2 className="font-display text-3xl font-black">{mode === "login" ? "Welcome back" : "Create your room profile"}</h2>
          <p className="mt-2 text-sm text-muted">Sign in to sync playback, voice, rooms, and watchlists with Firebase.</p>

          {/* ---------- Error banner ---------- */}
          {displayError && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <p>{displayError}</p>
              {displayError.includes("auth/unauthorized-domain") && (
                <div className="mt-2.5 border-t border-red-500/20 pt-2.5 text-xs leading-relaxed text-red-400 space-y-1.5">
                  <p>
                    <strong>Why this happens:</strong> Google OAuth requires you to explicitly authorize the domain you are using. Currently, you are accessing the app from <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[11px] text-white">{window.location.origin}</code>.
                  </p>
                  <p>
                    <strong>How to fix:</strong>
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Try using <a href="http://localhost:5173" className="underline text-cyan hover:text-white font-semibold">http://localhost:5173</a> (which Firebase authorizes by default).</li>
                    <li>Or go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline text-cyan hover:text-white font-semibold">Firebase Console</a> &rarr; <strong>Authentication</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Authorized domains</strong> and add <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-[11px] text-white">{window.location.hostname}</code>.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ---------- Google ---------- */}
          <Button id="google-sign-in" className="mt-6 w-full" onClick={() => finish(signInWithGoogle)} disabled={isDisabled}>
            {isDisabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
            Continue with Google
          </Button>

          {/* ---------- Demo Mode Option ---------- */}
          <div className="mt-3">
            <Button
              id="demo-login"
              variant="secondary"
              className="w-full border-cyan/30 hover:border-cyan/70 hover:bg-cyan/10 text-cyan-400 hover:text-cyan"
              onClick={handleDemoLogin}
              disabled={isDisabled}
            >
              {isDisabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <MonitorPlay className="h-4 w-4" />}
              Instant Demo Access (Bypass OAuth)
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted">
            <span className="h-px flex-1 bg-white/10" />
            Email
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {/* ---------- Email form ---------- */}
          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" ? (
              <input
                id="signup-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Display name"
                className="h-12 w-full rounded-lg border border-white/10 bg-white/8 px-4 text-sm outline-none focus:border-cyan"
                required
                disabled={isDisabled}
              />
            ) : null}
            <input
              id="auth-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              className="h-12 w-full rounded-lg border border-white/10 bg-white/8 px-4 text-sm outline-none focus:border-cyan"
              required
              disabled={isDisabled}
            />
            <input
              id="auth-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              minLength={6}
              className="h-12 w-full rounded-lg border border-white/10 bg-white/8 px-4 text-sm outline-none focus:border-cyan"
              required
              disabled={isDisabled}
            />
            <Button id="email-submit" type="submit" className="w-full" disabled={isDisabled}>
              {isDisabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {mode === "login" ? "Login with email" : "Create account"}
            </Button>
          </form>

          {/* ---------- Forgot password (login mode) ---------- */}
          {mode === "login" && (
            <button
              id="forgot-password"
              type="button"
              className="mt-3 flex items-center gap-1.5 text-sm text-muted transition hover:text-cyan"
              onClick={handleForgotPassword}
              disabled={isDisabled}
            >
              <KeyRound className="h-3.5 w-3.5" />
              {resetSent ? "Reset email sent — check your inbox" : "Forgot password?"}
            </button>
          )}

          {/* ---------- Toggle login / signup ---------- */}
          <button
            id="toggle-auth-mode"
            className="mt-5 text-sm font-semibold text-cyan hover:text-white"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setLocalError(null);
              clearError();
              setResetSent(false);
            }}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </section>
    </div>
  );
}
