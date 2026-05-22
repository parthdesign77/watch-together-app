import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Hand,
  Sliders,
  LogOut,
  Smile,
  Crown
} from "lucide-react";
import { useUISound } from "../../hooks/useUISound";
import type { WatchRoom } from "../../types";
import { Badge } from "../ui/Badge";

interface MobileControlsProps {
  room: WatchRoom;
  isHost: boolean;
  muted: boolean;
  hasCameraStream: boolean;
  hasScreenStream: boolean;
  isHandRaised: boolean;
  unreadCount: number;
  onStartVoice: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onShareScreen: (mode: "entire-screen" | "window") => void;
  onStopScreen: () => void;
  onToggleHandRaise: () => void;
  onOpenChat: () => void;
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
  onStartVoice,
  onToggleMute,
  onToggleCamera,
  onShareScreen,
  onStopScreen,
  onToggleHandRaise,
  onOpenChat,
  onOpenOptions,
  onLeaveRoom,
  onSendReaction
}: MobileControlsProps) {
  const { play } = useUISound();
  const [showEmojis, setShowEmojis] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#090909]/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 safe-bottom shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      {/* Floating Emojis Quick Tray */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            ref={emojiRef}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#121216]/95 border border-white/10 rounded-full px-4 py-2 flex gap-3.5 shadow-2xl backdrop-blur-md"
          >
            {emojis.map((emoji) => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  play("click");
                  onSendReaction?.(emoji);
                  setShowEmojis(false);
                }}
                className="text-3xl active:scale-125 transition-transform focus:outline-none select-none"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-1 max-w-md mx-auto">
        {/* Voice Connect / Mic Toggle (Combined touch area) */}
        <button
          onClick={() => {
            play("click");
            onToggleMute();
          }}
          className={`h-[52px] w-[52px] rounded-2xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
            muted
              ? "bg-[#ff3d47]/15 border-[#ff3d47]/30 text-[#ff3d47]"
              : "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
          }`}
          title={muted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {muted ? <MicOff className="h-5.5 w-5.5" /> : <Mic className="h-5.5 w-5.5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => {
            play("click");
            onToggleCamera();
          }}
          className={`h-[52px] w-[52px] rounded-2xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
            hasCameraStream
              ? "bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.25)]"
              : "bg-neutral-800 border-white/5 text-neutral-300"
          }`}
          title={hasCameraStream ? "Stop Camera" : "Start Camera"}
        >
          {hasCameraStream ? <Video className="h-5.5 w-5.5" /> : <VideoOff className="h-5.5 w-5.5" />}
        </button>

        {/* Emojis Trigger */}
        <button
          onClick={() => {
            play("click");
            setShowEmojis(!showEmojis);
          }}
          className={`h-[52px] w-[52px] rounded-2xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
            showEmojis
              ? "bg-amber-600/25 border-amber-500/40 text-amber-400"
              : "bg-neutral-800 border-white/5 text-neutral-300"
          }`}
          title="Send Reaction"
        >
          <Smile className="h-5.5 w-5.5" />
        </button>

        {/* Raise Hand Toggle */}
        <button
          onClick={() => {
            play("click");
            onToggleHandRaise();
          }}
          className={`h-[52px] w-[52px] rounded-2xl flex items-center justify-center border transition-all active:scale-95 relative cursor-pointer ${
            isHandRaised
              ? "bg-amber-600 border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse"
              : "bg-neutral-800 border-white/5 text-neutral-300"
          }`}
          title={isHandRaised ? "Lower Hand" : "Raise Hand"}
        >
          <Hand className={`h-5.5 w-5.5 ${isHandRaised ? "fill-white" : ""}`} />
          {isHandRaised && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
        </button>

        {/* Live Chat Panel Trigger */}
        <button
          onClick={() => {
            play("click");
            onOpenChat();
          }}
          className="h-[52px] w-[52px] rounded-2xl flex items-center justify-center border bg-neutral-800 border-white/5 text-neutral-300 relative transition-all active:scale-95 cursor-pointer"
          title="Open Chat"
        >
          <MessageSquare className="h-5.5 w-5.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-cyan text-black font-black text-[9px] h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center border border-black shadow animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {/* More Settings Drawer Toggle */}
        <button
          onClick={() => {
            play("click");
            onOpenOptions();
          }}
          className="h-[52px] w-[52px] rounded-2xl flex items-center justify-center border bg-neutral-800 border-white/5 text-neutral-300 transition-all active:scale-95 cursor-pointer"
          title="More Options"
        >
          <Sliders className="h-5.5 w-5.5" />
        </button>

        {/* Disconnect red circle button */}
        <button
          onClick={() => {
            play("leave");
            onLeaveRoom();
          }}
          className="h-[52px] w-[52px] rounded-2xl flex items-center justify-center border bg-red-600 border-red-500 text-white transition-all active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.3)]"
          title={isHost ? "End Call" : "Leave Call"}
        >
          <LogOut className="h-5.5 w-5.5" />
        </button>
      </div>
    </div>
  );
}
