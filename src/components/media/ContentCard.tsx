import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toggleWatchlist } from "../../hooks/useWatchlist";
import { useUiStore } from "../../store/uiStore";
import type { ContentItem } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useUISound } from "../../hooks/useUISound";

interface ContentCardProps {
  item: ContentItem;
  onStartRoom?: (item: ContentItem) => void;
}

export function ContentCard({ item, onStartRoom }: ContentCardProps) {
  const { profile } = useAuth();
  const { play } = useUISound();
  const pushToast = useUiStore((state) => state.pushToast);
  const detailPath = item.type === "movie" ? `/movies/${item.id}` : `/anime/${item.id}`;
  
  const [isHovered, setIsHovered] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  // Fast high quality trailer loop
  const trailerUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  const handleMouseEnter = () => {
    setIsHovered(true);
    play("hover");
    // Trigger trailer preview after 500ms delay to feel organic
    hoverTimer.current = setTimeout(() => {
      setShowTrailer(true);
    }, 600);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTrailer(false);
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
      }
    };
  }, []);

  return (
    <motion.article
      className="group relative min-w-[140px] md:min-w-[195px] w-full overflow-hidden rounded-[20px] border border-white/5 bg-[#111111] shadow-2xl transition-all duration-300 hover:border-[#ff3d47]/40"
      whileHover={{ y: -6, scale: 1.03 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={detailPath} aria-label={`Open ${item.title}`} onClick={() => play("click")}>
        <div className="aspect-[2/3] w-full overflow-hidden bg-neutral-900 relative">
          
          {/* Main Poster Art */}
          <img
            src={item.poster}
            alt={item.title}
            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
              showTrailer ? "opacity-0" : "opacity-100"
            }`}
            loading="lazy"
          />

          {/* Netflix-style Muted Trailer Preview */}
          <AnimatePresence>
            {showTrailer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 h-full w-full bg-black"
              >
                <video
                  src={trailerUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
                
                {/* Muted Indicator overlay */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-bold text-neutral-400">
                  TRAILER PREVIEW
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>

      {/* Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#090909] via-[#090909]/90 to-transparent p-2.5 pt-10 md:p-3 md:pt-12 pointer-events-auto lg:pointer-events-none lg:group-hover:pointer-events-auto">
        <div className="mb-1.5 md:mb-2.5 flex items-center gap-2">
          <Badge className={`border-none font-bold uppercase text-[8px] md:text-[9px] px-1.5 py-0.2 rounded ${
            item.type === "anime" ? "bg-emerald-600 text-white" : "bg-[#ff3d47] text-white"
          }`}>
            {item.type}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-amber-300">
            <Star className="h-3 w-3 md:h-3.5 md:w-3.5 fill-amber-300 text-amber-300" />
            {item.rating.toFixed(1)}
          </span>
        </div>

        <h3 className="line-clamp-2 text-xs md:text-sm font-extrabold leading-tight text-white">{item.title}</h3>
        <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs text-neutral-400 font-semibold">{item.year}</p>

        {/* Action triggers */}
        <div className="mt-2 flex gap-1.5 md:gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform translate-y-0 lg:translate-y-1 lg:group-hover:translate-y-0">
          <Button
            size="sm"
            className="flex-1 bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white rounded-xl h-8 md:h-9 text-[10px] md:text-[11px] font-black shadow-glow-sm border-none flex items-center justify-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              play("click");
              onStartRoom?.(item);
            }}
          >
            <Play className="h-3 w-3 md:h-3.5 md:w-3.5 fill-current" />
            <span>Watch Party</span>
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl border border-white/5 flex items-center justify-center flex-shrink-0"
            aria-label="Add to watchlist"
            onClick={async (e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!profile) return;
              play("select");
              await toggleWatchlist(profile, item);
              pushToast({ title: "Added to watchlist", description: item.title, type: "success" });
            }}
          >
            <Plus className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
