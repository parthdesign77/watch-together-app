import { motion } from "framer-motion";
import { Play, Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toggleWatchlist } from "../../hooks/useWatchlist";
import { useUiStore } from "../../store/uiStore";
import type { ContentItem } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface ContentCardProps {
  item: ContentItem;
  onStartRoom?: (item: ContentItem) => void;
}

export function ContentCard({ item, onStartRoom }: ContentCardProps) {
  const { profile } = useAuth();
  const pushToast = useUiStore((state) => state.pushToast);
  const detailPath = item.type === "movie" ? `/movies/${item.id}` : `/anime/${item.id}`;

  return (
    <motion.article
      className="group relative min-w-[190px] overflow-hidden rounded-lg border border-white/10 bg-panel shadow-2xl"
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <Link to={detailPath} aria-label={`Open ${item.title}`}>
        <div className="aspect-[2/3] overflow-hidden bg-elevated">
          <img src={item.poster} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
        </div>
      </Link>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/84 to-transparent p-3 pt-16">
        <div className="mb-2 flex items-center gap-2">
          <Badge tone={item.type === "anime" ? "green" : "orange"}>{item.type}</Badge>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-200">
            <Star className="h-3.5 w-3.5 fill-amber-300" />
            {item.rating.toFixed(1)}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-bold leading-tight">{item.title}</h3>
        <p className="mt-1 text-xs text-muted">{item.year}</p>
        <div className="mt-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
          <Button size="sm" className="flex-1" onClick={() => onStartRoom?.(item)}>
            <Play className="h-4 w-4" />
            Room
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9"
            aria-label="Add to watchlist"
            onClick={async () => {
              if (!profile) return;
              await toggleWatchlist(profile, item);
              pushToast({ title: "Added to watchlist", description: item.title, type: "success" });
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
