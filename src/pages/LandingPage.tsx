import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MonitorPlay, ShieldCheck, Sparkles, Users, Video } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { HeroShowcase } from "../components/media/HeroShowcase";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { movieSeeds } from "../data/catalog";
import { planDetails } from "../lib/constants";

const features = [
  { icon: MonitorPlay, title: "Real-time playback sync", body: "Play, pause, seek, drift correction, heartbeat sync, and host authority." },
  { icon: Video, title: "HD screen share with audio", body: "Browser screen capture, system audio where supported, stream controls, and reconnect states." },
  { icon: Users, title: "Discord-style rooms", body: "Voice chat, participants, speaking indicators, live chat, reactions, and invite codes." },
  { icon: ShieldCheck, title: "Firebase-secured sessions", body: "Google sign-in, persistent profiles, protected routes, Firestore realtime state, and safe client rules." }
];

export function LandingPage() {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-cinema-radial text-snow">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-ink/62 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-cyan via-premium to-movie">
              <MonitorPlay className="h-5 w-5" />
            </span>
            <span className="font-display font-black">Watch Together</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex">
            <a href="#features" className="hover:text-snow">Features</a>
            <a href="#pricing" className="hover:text-snow">Pricing</a>
            <a href="#security" className="hover:text-snow">Security</a>
          </nav>
          <Link to="/login">
            <Button>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-20">
        <HeroShowcase item={movieSeeds[0]} />

        <section id="features" className="grid gap-4 py-16 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              className="glass rounded-lg p-5"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
            >
              <feature.icon className="h-8 w-8 text-cyan" />
              <h2 className="mt-4 font-display text-lg font-bold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-6 py-8 lg:grid-cols-[1.2fr_.8fr]">
          <div className="glass rounded-lg p-6">
            <Badge tone="purple">
              <Sparkles className="h-3.5 w-3.5" />
              Startup-grade streaming rooms
            </Badge>
            <h2 className="mt-5 font-display text-4xl font-black">Netflix-style discovery meets Discord-quality realtime presence.</h2>
            <p className="mt-4 max-w-3xl text-slate-300">
              Create rooms, invite friends, auto-join voice, receive screen share streams, sync timestamps, restore state, and keep the room flowing across desktop and mobile.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["YouTube, MP4, and HLS URLs", "TMDB movies and Jikan anime", "Watchlists and continue watching", "PWA-ready responsive UI"].map((item) => (
                <p key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-anime" />
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-panel">
            <img src={movieSeeds[5].backdrop} alt="Spider-Verse cinematic backdrop" className="h-full min-h-[340px] w-full object-cover" />
          </div>
        </section>

        <section id="pricing" className="grid gap-4 py-16 md:grid-cols-2">
          {Object.entries(planDetails).map(([key, plan]) => (
            <article key={key} className="glass cinema-border rounded-lg p-6">
              <p className={`bg-gradient-to-r ${plan.accent} bg-clip-text font-display text-3xl font-black text-transparent`}>{plan.name}</p>
              <p className="mt-2 text-2xl font-black">{plan.price}</p>
              <p className="mt-1 text-sm text-muted">{plan.participants}</p>
              <div className="my-5 h-px bg-white/10" />
              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <p key={feature} className="flex items-center gap-2 text-sm text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-anime" />
                    {feature}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
