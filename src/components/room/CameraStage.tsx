import { Maximize2, Video, Lock, Sparkles, Crown, Mic, MicOff } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { StreamVideo } from "./StreamVideo";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import type { Participant } from "../../types";

export interface CameraFeed {
  id: string;
  name: string;
  stream: MediaStream;
  muted?: boolean;
}

interface CameraStageProps {
  feeds: CameraFeed[];
  participants?: Participant[];
  screenShareActive: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  variant?: "floating" | "bottom-bar";
  isFullscreen?: boolean;
}

export function CameraStage({ feeds, participants = [], screenShareActive, containerRef, variant = "floating", isFullscreen = false }: CameraStageProps) {
  const { profile } = useAuth();
  const spotlight = feeds.length <= 1;

  if (variant === "bottom-bar") {
    if (!participants.length) return null;
    
    let trayHeight = screenShareActive ? "h-44 sm:h-56" : "h-36 sm:h-48";
    let avatarSize = screenShareActive ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16 sm:h-20 sm:w-20";
    let avatarText = screenShareActive ? "text-lg sm:text-2xl" : "text-base sm:text-xl";
    let textClass = screenShareActive ? "text-[11px] sm:text-[13px]" : "text-[10px] sm:text-[11px]";
    let iconSize = screenShareActive ? "h-4 w-4" : "h-3.5 w-3.5";

    if (isFullscreen) {
      trayHeight = screenShareActive ? "h-32 sm:h-40" : "h-24 sm:h-32";
      avatarSize = screenShareActive ? "h-14 w-14 sm:h-16 sm:w-16" : "h-11 w-11 sm:h-14 sm:w-14";
      avatarText = screenShareActive ? "text-sm sm:text-lg" : "text-xs sm:text-base";
      textClass = screenShareActive ? "text-[9px] sm:text-[11px]" : "text-[8px] sm:text-[9px]";
      iconSize = screenShareActive ? "h-3 w-3" : "h-2.5 w-2.5";
    }

    return (
      <section className={`w-full ${trayHeight} flex-shrink-0 overflow-hidden rounded-[20px] border border-white/5 bg-[#111111]/60 backdrop-blur-md shadow-2xl p-2 transition-all duration-500 ease-in-out`}>
        <div className="flex h-full w-full items-center gap-3 p-1 overflow-x-auto scrollbar-thin">
          {participants.map((p) => {
            const feed = feeds.find((f) => f.id.startsWith(p.uid));
            return (
              <div key={p.uid} className={`relative h-full aspect-video flex-shrink-0 rounded-lg overflow-hidden border bg-[#111111] flex items-center justify-center transition-all duration-500 ease-in-out ${p.isSpeaking ? 'border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-white/5'}`}>
                {feed ? (
                  <StreamVideo stream={feed.stream} muted={feed.muted} className="h-full w-full object-cover animate-fade-in" />
                ) : (
                  <div 
                    className={`${avatarSize} rounded-full flex items-center justify-center border-2 border-white/10 ${avatarText} font-black text-white relative shadow-md animate-glow transition-all duration-500 ease-in-out`}
                    style={{ backgroundColor: p.avatar ? undefined : (p.avatarColor || "#ff3d47") }}
                  >
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name || "Guest"} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (p.name || "Guest").slice(0, 2).toUpperCase()
                    )}
                    {p.isSpeaking && (
                      <div className="absolute -inset-1 rounded-full border border-emerald-400 animate-ping opacity-75" />
                    )}
                  </div>
                )}
                
                {/* Name Tag and mic overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 px-3 flex items-center justify-between gap-1.5 z-10">
                  <p className={`truncate ${textClass} font-black text-white/95 max-w-[75%]`}>{p.name}</p>
                  {p.isMuted ? (
                    <MicOff className={`${iconSize} text-red-500 flex-shrink-0`} />
                  ) : (
                    <Mic className={`${iconSize} flex-shrink-0 ${p.isSpeaking ? "text-emerald-400 animate-bounce" : "text-neutral-400"}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (screenShareActive) {
    if (!participants.length) return null;
  } else {
    if (!feeds.length) return null;
  }

  const plan = profile?.subscriptionPlan || "free";
  const isDraggable = plan === "premium" || plan === "standard";

  if (screenShareActive) {
    let floatTrayHeight = "h-44 sm:h-52";
    let floatAvatarSize = "h-20 w-20 sm:h-22 sm:w-22";
    let floatAvatarText = "text-lg sm:text-xl";
    let floatTextClass = "text-[11px] sm:text-xs";
    let floatIconSize = "h-3.5 w-3.5";

    if (isFullscreen) {
      floatTrayHeight = "h-32 sm:h-38";
      floatAvatarSize = "h-14 w-14 sm:h-16 sm:w-16";
      floatAvatarText = "text-sm sm:text-lg";
      floatTextClass = "text-[9px] sm:text-[10px]";
      floatIconSize = "h-3 w-3";
    }

    return (
      <motion.section
        drag={isDraggable}
        dragConstraints={containerRef}
        dragElastic={0.05}
        dragMomentum={false}
        className={`absolute bottom-4 left-4 z-20 ${floatTrayHeight} w-fit max-w-[90vw] sm:max-w-[480px] overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl transition-all duration-500 ease-in-out ${
          isDraggable 
            ? "cursor-grab active:cursor-grabbing hover:border-cyan/40 hover:shadow-cyan/10" 
             : "pointer-events-auto"
        }`}
      >
        <div className="flex h-full w-full items-center gap-2.5 p-2 overflow-x-auto scrollbar-thin">
          {participants.map((p) => {
            const feed = feeds.find((f) => f.id.startsWith(p.uid));
            return (
              <div key={p.uid} className={`relative h-full aspect-video flex-shrink-0 rounded-lg overflow-hidden border bg-[#111111] flex items-center justify-center transition-all duration-500 ease-in-out ${p.isSpeaking ? 'border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-white/5'}`}>
                {feed ? (
                  <StreamVideo stream={feed.stream} muted={feed.muted} className="h-full w-full object-cover animate-fade-in" />
                ) : (
                  <div 
                    className={`${floatAvatarSize} rounded-full flex items-center justify-center border-2 border-white/10 ${floatAvatarText} font-black text-white relative shadow-md animate-glow transition-all duration-500 ease-in-out`}
                    style={{ backgroundColor: p.avatar ? undefined : (p.avatarColor || "#ff3d47") }}
                  >
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name || "Guest"} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (p.name || "Guest").slice(0, 2).toUpperCase()
                    )}
                    {p.isSpeaking && (
                      <div className="absolute -inset-1 rounded-full border border-emerald-400 animate-ping opacity-75" />
                    )}
                  </div>
                )}
                
                {/* Name Tag and mic overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 px-2.5 flex items-center justify-between gap-1 z-10">
                  <p className={`truncate ${floatTextClass} font-black text-white/95 max-w-[75%]`}>{p.name}</p>
                  {p.isMuted ? (
                    <MicOff className={`${floatIconSize} text-red-500 flex-shrink-0`} />
                  ) : (
                    <Mic className={`${floatIconSize} flex-shrink-0 ${p.isSpeaking ? "text-emerald-400 animate-bounce" : "text-neutral-400"}`} />
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Plan badge overlay */}
          <div className="absolute left-2 top-2 flex items-center gap-1.5 pointer-events-none z-30">
            {plan === "premium" ? (
              <span className="flex items-center gap-1 bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-lg border border-purple-500/20">
                <Crown className="h-2.5 w-2.5" />
                Premium PiP
              </span>
            ) : plan === "standard" ? (
              <span className="flex items-center gap-1 bg-gradient-to-r from-cyan/90 to-blue-600/90 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-lg border border-cyan/20">
                <Sparkles className="h-2.5 w-2.5" />
                Standard PiP
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-black/80 text-[9px] font-bold text-gray-400 px-1.5 py-0.5 rounded-full border border-white/5">
                <Lock className="h-2.5 w-2.5" />
                PiP (Locked)
              </span>
            )}
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
