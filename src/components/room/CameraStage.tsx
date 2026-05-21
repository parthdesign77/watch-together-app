import { Maximize2, Video, Lock, Sparkles, Crown } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { StreamVideo } from "./StreamVideo";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export interface CameraFeed {
  id: string;
  name: string;
  stream: MediaStream;
  muted?: boolean;
}

interface CameraStageProps {
  feeds: CameraFeed[];
  screenShareActive: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function CameraStage({ feeds, screenShareActive, containerRef }: CameraStageProps) {
  const { profile } = useAuth();
  const spotlight = feeds.length <= 1;

  if (!feeds.length) return null;

  const plan = profile?.subscriptionPlan || "free";
  const isDraggable = plan === "premium" || plan === "standard";

  if (screenShareActive) {
    return (
      <motion.section
        drag={isDraggable}
        dragConstraints={containerRef}
        dragElastic={0.05}
        dragMomentum={false}
        className={`absolute bottom-4 left-4 z-20 h-36 w-56 overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl transition-shadow duration-300 ${
          isDraggable 
            ? "cursor-grab active:cursor-grabbing hover:border-cyan/40 hover:shadow-cyan/10" 
            : "pointer-events-auto"
        }`}
      >
        <div className="relative h-full w-full">
          <StreamVideo stream={feeds[0].stream} muted={feeds[0].muted} className="h-full w-full object-cover" />
          
          {/* Plan badge overlay */}
          <div className="absolute left-2 top-2 flex items-center gap-1.5 pointer-events-none">
            {plan === "premium" ? (
              <span className="flex items-center gap-1 bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-lg border border-purple-500/20">
                <Crown className="h-3 w-3" />
                Premium PiP
              </span>
            ) : plan === "standard" ? (
              <span className="flex items-center gap-1 bg-gradient-to-r from-cyan/90 to-blue-600/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-lg border border-cyan/20">
                <Sparkles className="h-3 w-3" />
                Standard PiP
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-black/80 text-[10px] font-bold text-gray-400 px-2 py-0.5 rounded-full border border-white/5">
                <Lock className="h-3 w-3" />
                PiP (Locked)
              </span>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="truncate text-xs font-bold text-white">{feeds[0].name}</p>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl min-h-[520px]">
      <div className={`grid h-full min-h-[520px] gap-3 p-3 ${spotlight ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        {feeds.map((feed) => (
          <article key={feed.id} className="relative overflow-hidden rounded-lg border border-white/10 bg-elevated">
            <StreamVideo stream={feed.stream} muted={feed.muted} className="h-full min-h-[240px] w-full object-cover" />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <Badge tone="red">
                <Video className="h-3.5 w-3.5" />
                Camera
              </Badge>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/90 to-transparent p-3">
              <p className="truncate font-bold">{feed.name}</p>
              <Button variant="ghost" size="icon" onClick={() => document.documentElement.requestFullscreen?.()} aria-label="Fullscreen camera grid">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
