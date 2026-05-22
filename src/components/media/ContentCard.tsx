import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Check, Star } from "lucide-react";
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
    // Trigger trailer preview after 600ms delay to feel organic
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

  const isInWatchlist = profile?.watchlist?.includes(item.id);

  return (
    <motion.article
      className="group relative min-w-[140px] md:min-w-[195px] w-full overflow-hidden rounded-[20px] border border-white/5 bg-[#111111] shadow-2xl transition-all duration-300 hover:border-[#ff3d47]/40"
      whileHover={{ y: -6, scale: 1.03 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Watchlist Button - Top Right Glassmorphic */}
      <button
        type="button"
        aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        onClick={async (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!profile) return;
          play("select");
          await toggleWatchlist(profile, item);
          pushToast({ 
            title: isInWatchlist ? "Removed from watchlist" : "Added to watchlist", 
            description: item.title, 
            type: "success" 
          });
        }}
        className={`absolute top-3 right-3 z-20 h-8 w-8 rounded-full backdrop-blur border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isInWatchlist 
            ? "bg-[#ff3d47] text-white border-[#ff3d47]/20" 
            : "bg-black/60 hover:bg-[#ff3d47] text-white"
        }`}
      >
        {isInWatchlist ? <Check className="h-4.5 w-4.5 stroke-[2.5]" /> : <Plus className="h-4.5 w-4.5 stroke-[2.5]" />}
      </button>

      <Link to={detailPath} aria-label={`Open ${item.title}`} onClick={() => play("open-card")}>
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
                
                {/* Muted Indicator overlay - positioned top-left to avoid top-right watchlist button */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-bold text-neutral-400">
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
        <div className="mt-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform translate-y-0 lg:translate-y-1 lg:group-hover:translate-y-0">
          <Button
            size="sm"
            className="w-full bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white rounded-xl h-8 md:h-9 text-[10px] md:text-[11px] font-black shadow-glow-sm border-none flex items-center justify-center gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              play("click");
              onStartRoom?.(item);
            }}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Watch Party</span>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
