import { motion } from "framer-motion";
import { Play, Plus, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toggleWatchlist } from "../../hooks/useWatchlist";
import { useUiStore } from "../../store/uiStore";
import type { ContentItem } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface HeroShowcaseProps {
  item: ContentItem;
  onStartRoom?: (item: ContentItem) => void;
}

export function HeroShowcase({ item, onStartRoom }: HeroShowcaseProps) {
  const { profile } = useAuth();
  const pushToast = useUiStore((state) => state.pushToast);
  const detailPath = item.type === "movie" ? `/movies/${item.id}` : `/anime/${item.id}`;

  return (
    <section className="relative min-h-[calc(100vh-14rem)] overflow-hidden rounded-lg border border-white/10">
      <img src={item.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/82 to-ink/18" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
      <motion.div
        className="relative z-10 flex min-h-[calc(100vh-14rem)] max-w-3xl flex-col justify-end p-5 pb-8 md:p-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="purple">
            <Sparkles className="h-3.5 w-3.5" />
            Premium Sync
          </Badge>
          <Badge tone={item.type === "anime" ? "green" : "orange"}>{item.type}</Badge>
          <span className="text-sm font-bold text-amber-200">{item.rating.toFixed(1)} rating</span>
        </div>
        <h1 className="font-display text-4xl font-black leading-none md:text-7xl">{item.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">{item.overview}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {item.genres.map((genre) => (
            <span key={genre} className="rounded-md border border-white/10 bg-white/8 px-3 py-1 text-sm font-semibold text-slate-200">
              {genre}
            </span>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => (onStartRoom ? onStartRoom(item) : (window.location.href = "/login"))}>
            <Play className="h-5 w-5" />
            Start Together
          </Button>
          <Link to={detailPath}>
            <Button variant="secondary" size="lg">
              <Users className="h-5 w-5" />
              Watch Together
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            onClick={async () => {
              if (!profile) return;
              await toggleWatchlist(profile, item);
              pushToast({ title: "Saved", description: `${item.title} is in your watchlist.`, type: "success" });
            }}
          >
            <Plus className="h-5 w-5" />
            Watchlist
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
