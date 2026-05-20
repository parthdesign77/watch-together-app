import { FormEvent, useState } from "react";
import { Chrome, Loader2, Mail, MonitorPlay } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useUiStore } from "../store/uiStore";

export function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const pushToast = useUiStore((state) => state.pushToast);
  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || "/dashboard";

  if (user) return <Navigate to={redirectTo} replace />;

  async function finish(action: () => Promise<void>) {
    try {
      await action();
      pushToast({ title: "Welcome to Watch Together", description: "Your session is ready.", type: "success" });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      pushToast({
        title: "Sign-in failed",
        description: error instanceof Error ? error.message : "Please check your Firebase auth settings.",
        type: "error"
      });
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void finish(() => (mode === "signup" ? signUpWithEmail(name, email, password) : signInWithEmail(email, password)));
  }

  return (
    <div className="grid min-h-screen bg-cinema-radial text-snow lg:grid-cols-[1.15fr_.85fr]">
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

          <Button className="mt-6 w-full" onClick={() => finish(signInWithGoogle)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted">
            <span className="h-px flex-1 bg-white/10" />
            Email
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" ? (
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Display name"
                className="h-12 w-full rounded-lg border border-white/10 bg-white/8 px-4 text-sm outline-none focus:border-cyan"
                required
              />
            ) : null}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              className="h-12 w-full rounded-lg border border-white/10 bg-white/8 px-4 text-sm outline-none focus:border-cyan"
              required
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              minLength={6}
              className="h-12 w-full rounded-lg border border-white/10 bg-white/8 px-4 text-sm outline-none focus:border-cyan"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              <Mail className="h-4 w-4" />
              {mode === "login" ? "Login with email" : "Create account"}
            </Button>
          </form>

          <button className="mt-5 text-sm font-semibold text-cyan hover:text-white" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </section>
    </div>
  );
}
