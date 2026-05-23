import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  LogOut,
  Smile,
  Sliders,
  Headphones,
  HeadphoneOff
} from "lucide-react";
import { useUISound } from "../../hooks/useUISound";
import { useUiStore } from "../../store/uiStore";
import type { WatchRoom } from "../../types";

interface MobileControlsProps {
  room: WatchRoom;
  isHost: boolean;
  muted: boolean;
  hasCameraStream: boolean;
  hasScreenStream: boolean;
  isHandRaised: boolean;
  unreadCount: number;
  participantsCount: number;
  onStartVoice: () => void;
  onToggleMute: (forceState?: boolean) => void;
  onToggleCamera: () => void;
  onShareScreen: (mode: "entire-screen" | "window") => void;
  onStopScreen: () => void;
  onToggleHandRaise: () => void;
  onOpenChat: () => void;
  onOpenParticipants: () => void;
  onOpenOptions: () => void;
  onLeaveRoom: () => void;
  onSendReaction?: (emoji: string) => void;
}

export function MobileControls({
  room,
  isHost,
  muted,
  hasCameraStream,
  hasScreenStream,
  isHandRaised,
  unreadCount,
  participantsCount,
  onStartVoice,
  onToggleMute,
  onToggleCamera,
  onShareScreen,
  onStopScreen,
  onToggleHandRaise,
  onOpenChat,
  onOpenParticipants,
  onOpenOptions,
  onLeaveRoom,
  onSendReaction
}: MobileControlsProps) {
  const { play } = useUISound();
  const [showEmojis, setShowEmojis] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  const deafened = useUiStore((state) => state.deafened);
  const setDeafened = useUiStore((state) => state.setDeafened);

  const emojis = ["👍", "❤️", "😂", "😮", "🔥"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojis(false);
      }
    }
    if (showEmojis) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojis]);

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#090909]/95 backdrop-blur-2xl border-t border-white/10 px-4 pt-3 pb-safe shadow-[0_-12px_36px_rgba(0,0,0,0.85)] select-none">
      
      {/* Floating Emojis Quick Tray Trigger & Options Panel Toggle above the main controls */}
      <div className="absolute -top-12 inset-x-4 flex items-center justify-between pointer-events-none z-30">
        {/* Sliders Option Sheet Trigger */}
        <button
          onClick={() => {
            play("click");
            onOpenOptions();
          }}
          className="h-10 px-3 rounded-full flex items-center gap-1.5 border bg-[#121216]/90 border-white/10 text-neutral-300 shadow-lg backdrop-blur-md transition-all active:scale-95 pointer-events-auto text-xs font-bold"
        >
          <Sliders className="h-4 w-4 text-[#ff3d47]" />
          <span>Settings</span>
        </button>

        {/* Reaction Smile Trigger */}
        <div className="relative pointer-events-auto" ref={emojiRef}>
          <button
            onClick={() => {
              play("click");
              setShowEmojis(!showEmojis);
            }}
            className={`h-10 w-10 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-md transition-all active:scale-95 ${
              showEmojis
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : "bg-[#121216]/90 border-white/10 text-neutral-300"
            }`}
            title="Send Reaction"
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Quick reactions menu */}
          <AnimatePresence>
            {showEmojis && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: -4, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full right-0 mb-2 bg-[#0c0c0e]/98 border border-white/10 rounded-2xl px-3 py-1.5 flex gap-2.5 shadow-2xl backdrop-blur-xl"
              >
                {emojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      play("click");
                      onSendReaction?.(emoji);
                      setShowEmojis(false);
                    }}
                    className="text-2.5xl hover:scale-120 transition-transform focus:outline-none select-none active:scale-130"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Bottom Control Grid (6 equally-spaced, beautifully-sized buttons) */}
      <div className="grid grid-cols-6 gap-1.5 xs:gap-2 max-w-md mx-auto items-center justify-items-center py-1 px-1 xs:px-2 sm:px-4">
        
        {/* 1. Mic Control */}
        <button
          id="micBtn"
          onClick={() => {
            play(muted ? "mic-unmute" : "mic-mute");
            onToggleMute(!muted);
          }}
          className={`h-12 w-12 rounded-full flex flex-col items-center justify-center border transition-all duration-300 active:scale-90 cursor-pointer ${
            muted
              ? "bg-[#ff3d47]/15 border-[#ff3d47]/30 text-[#ff3d47] shadow-[0_0_12px_rgba(255,61,71,0.08)]"
              : "bg-white/5 border-white/10 text-neutral-300 active:bg-white/10"
          }`}
          aria-label={muted ? "Unmute Mic" : "Mute Mic"}
          title={muted ? "Unmute Mic" : "Mute Mic"}
        >
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* 2. Deafen Control */}
        <button
          id="deafenBtn"
          onClick={() => {
            const nextState = !deafened;
            play(nextState ? "deafen" : "undeafen");
            setDeafened(nextState);
            if (nextState) {
              onToggleMute(true);
            } else {
              onToggleMute(false);
            }
          }}
          className={`h-12 w-12 rounded-full flex flex-col items-center justify-center border transition-all duration-300 active:scale-90 cursor-pointer ${
            deafened
              ? "bg-[#ff3d47]/15 border-[#ff3d47]/30 text-[#ff3d47] shadow-[0_0_12px_rgba(255,61,71,0.08)]"
              : "bg-white/5 border-white/10 text-neutral-300 active:bg-white/10"
          }`}
          aria-label={deafened ? "Undeafen Audio – Receive incoming audio" : "Deafen Audio – Mute all incoming audio"}
          title={deafened ? "Deafened – You can't hear others" : "Deafen Audio"}
        >
          {deafened ? <HeadphoneOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
        </button>

        {/* 5. Camera or Screen Share Control */}
        {hasScreenStream ? (
          <button
            onClick={() => {
              play("screenshare-stop");
              onStopScreen();
            }}
            className="h-10 w-10 min-w-[40px] xs:h-12 xs:w-12 rounded-full flex items-center justify-center border bg-[#ff3d47] border-[#ff3d47] text-white shadow-[0_0_12px_rgba(255,61,71,0.4)] animate-pulse cursor-pointer"
            aria-label="Stop Screen Share"
            title="Stop Screen Share"
          >
            <MonitorUp className="h-5 w-5 text-white" />
          </button>
        ) : (
          <button
            onClick={() => {
              play(hasCameraStream ? "camera-off" : "camera-on");
              onToggleCamera();
            }}
            className={`h-10 w-10 min-w-[40px] xs:h-12 xs:w-12 rounded-full flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
              hasCameraStream
                ? "bg-[#ff3d47] border-[#ff3d47] text-white shadow-[0_0_12px_rgba(255,61,71,0.3)] animate-glow"
                : "bg-white/5 border-white/10 text-neutral-300 active:bg-white/10"
            }`}
            aria-label={hasCameraStream ? "Stop Camera" : "Start Camera"}
          >
            {hasCameraStream ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
        )}

        {/* 6. Chat Control */}
        <button
          onClick={() => {
            play("click");
            onOpenChat();
          }}
          className="h-10 w-10 min-w-[40px] xs:h-12 xs:w-12 rounded-full flex items-center justify-center border bg-white/5 border-white/10 text-neutral-300 relative transition-all active:scale-90 cursor-pointer active:bg-white/10"
          aria-label="Open Chat"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-cyan text-black font-black text-[9px] h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center border border-black shadow animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {/* 7. Participants Control */}
        <button
          onClick={() => {
            play("click");
            onOpenParticipants();
          }}
          className="h-10 w-10 min-w-[40px] xs:h-12 xs:w-12 rounded-full flex items-center justify-center border bg-white/5 border-white/10 text-neutral-300 relative transition-all active:scale-90 cursor-pointer active:bg-white/10"
          aria-label="Open Participants"
        >
          <Users className="h-5 w-5" />
          {participantsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-black font-black text-[9px] h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center border border-black shadow">
              {participantsCount}
            </span>
          )}
        </button>

        {/* 8. Leave Room Control */}
        <button
          onClick={() => {
            play("leave");
            onLeaveRoom();
          }}
          className="h-10 w-10 min-w-[40px] xs:h-12 xs:w-12 rounded-full flex items-center justify-center border bg-red-600 border-red-500 text-white transition-all active:scale-90 cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.45)] hover:bg-red-700 hover:border-red-600"
          aria-label="Leave Room"
        >
          <LogOut className="h-5 w-5" />
        </button>

      </div>
      <audio id="myAudioElement" muted style={{ display: 'none' }} />
    </div>
  );
}
