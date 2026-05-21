import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Film,
  Mic,
  MicOff,
  MonitorUp,
  Settings,
  Share2,
  SlidersHorizontal,
  Users,
  Video,
  VideoOff,
  LogOut,
  Trash2,
  Smile,
  Copy,
  Check,
  Tv
} from "lucide-react";
import { updateRoomState } from "../../hooks/useRooms";
import { useUISound } from "../../hooks/useUISound";
import type { WatchRoom } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface RoomControlsProps {
  room: WatchRoom;
  isHost: boolean;
  muted: boolean;
  onInvite: () => void;
  onStartVoice: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onShareScreen: (mode: "entire-screen" | "window") => void;
  onStopScreen: () => void;
  onOpenQuality: () => void;
  onOpenSettings: () => void;
  onOpenSelector: () => void;
  onLeaveRoom: () => void;
  onSendReaction?: (emoji: string) => void;
  onTriggerReadyCheck?: () => void;
  hasCameraStream: boolean;
  hasScreenStream: boolean;
  cinemaMode: boolean;
  onToggleCinemaMode: () => void;
  onTurnOffVideo?: () => void;
}

export function RoomControls({
  room,
  isHost,
  muted,
  onInvite,
  onStartVoice,
  onToggleMute,
  onToggleCamera,
  onShareScreen,
  onStopScreen,
  onOpenQuality,
  onOpenSettings,
  onOpenSelector,
  onLeaveRoom,
  onSendReaction,
  onTriggerReadyCheck,
  hasCameraStream,
  hasScreenStream,
  cinemaMode,
  onToggleCinemaMode,
  onTurnOffVideo
}: RoomControlsProps) {
  const { play } = useUISound();
  const [copied, setCopied] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    play("select");
    setTimeout(() => setCopied(false), 2000);
  };

  const emojis = ["👍", "❤️", "😂", "😮", "🔥"];

  return (
    <section className="glass relative rounded-[20px] p-3.5 sm:p-5 border border-white/5 bg-[#111111]/80 backdrop-blur-md shadow-glow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Left Side: Stacked Room & Movie Info */}
        <div className="flex flex-col gap-1 min-w-[240px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-xl font-extrabold tracking-tight text-white">{room.roomName}</h1>
            {isHost ? (
              <Badge className="bg-[#ff3d47]/20 text-[#ff3d47] border border-[#ff3d47]/30 flex items-center gap-1 font-bold text-xs">
                <Crown className="h-3 w-3" />
                Host
              </Badge>
            ) : (
              <Badge className="bg-white/10 text-white/80 border border-white/15 flex items-center gap-1 font-medium text-xs">
                Member
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-0.5">
            <span className="font-mono text-neutral-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              Code: {room.code}
            </span>
            <span>•</span>
            <span>{Object.keys(room.participants || {}).length} watching</span>
            <span>•</span>
            <span className="capitalize">{room.roomType}</span>
          </div>
          {room.videoUrl ? (
            <p className="text-xs text-[#ff3d47] font-semibold mt-1 flex items-center gap-1.5 animate-pulse">
              <Film className="h-3.5 w-3.5" />
              Now Playing: <span className="underline">{room.roomName.replace(" Watch Party", "")}</span>
            </p>
          ) : (
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" />
              Waiting for movie selection...
            </p>
          )}
        </div>

        {/* Center: 48px square actions */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {/* Select Movie (Host Only) */}
          {isHost && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                style={{ width: "48px", height: "48px", minWidth: "48px" }}
                className="bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white rounded-[14px] flex items-center justify-center p-0 shadow-glow-sm"
                onClick={() => {
                  play("click");
                  onOpenSelector();
                }}
                title="Select Movie"
              >
                <Film className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* Turn Off Movie / Switch to VC (Host Only) */}
          {isHost && room.videoUrl && onTurnOffVideo && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                style={{ width: "48px", height: "48px", minWidth: "48px" }}
                className="bg-neutral-800 hover:bg-neutral-700/80 text-red-400 hover:text-red-300 rounded-[14px] flex items-center justify-center p-0 border border-white/5 shadow-glow-sm"
                onClick={() => {
                  play("click");
                  onTurnOffVideo();
                }}
                title="Turn Off Movie / Switch to VC"
              >
                <VideoOff className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* Trigger Ready Check (Host Only) */}
          {isHost && onTriggerReadyCheck && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                style={{ width: "48px", height: "48px", minWidth: "48px" }}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-[14px] flex items-center justify-center p-0"
                onClick={() => {
                  play("click");
                  onTriggerReadyCheck();
                }}
                title="Trigger Ready Check"
              >
                <Check className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* Invite Friend */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              style={{ width: "48px", height: "48px", minWidth: "48px" }}
              variant="secondary"
              className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-[14px] flex items-center justify-center p-0 border border-white/5"
              onClick={() => {
                play("invite");
                onInvite();
              }}
              title="Invite Friends"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Voice Chat Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              style={{ width: "48px", height: "48px", minWidth: "48px" }}
              variant={muted ? "secondary" : "success"}
              className={`rounded-[14px] flex items-center justify-center p-0 border border-white/5 ${
                muted ? "bg-neutral-800 hover:bg-neutral-700 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
              onClick={() => {
                play("voice");
                onStartVoice();
              }}
              title={muted ? "Connect Voice" : "Voice Connected"}
            >
              <Mic className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Mute Button (Only active when in Voice) */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              style={{ width: "48px", height: "48px", minWidth: "48px" }}
              variant={muted ? "danger" : "secondary"}
              className={`rounded-[14px] flex items-center justify-center p-0 border border-white/5 ${
                muted ? "bg-[#ff3d47]/20 border-[#ff3d47]/30 text-[#ff3d47]" : "bg-neutral-800 hover:bg-neutral-700 text-white"
              }`}
              onClick={() => {
                play("click");
                onToggleMute();
              }}
              title={muted ? "Unmute Mic" : "Mute Mic"}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </motion.div>

          {/* Camera Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              style={{ width: "48px", height: "48px", minWidth: "48px" }}
              variant={hasCameraStream ? "danger" : "secondary"}
              className={`rounded-[14px] flex items-center justify-center p-0 border border-white/5 ${
                hasCameraStream ? "bg-[#ff3d47]/20 border-[#ff3d47]/30 text-[#ff3d47]" : "bg-neutral-800 hover:bg-neutral-700 text-white"
              }`}
              onClick={() => {
                play("click");
                onToggleCamera();
              }}
              title={hasCameraStream ? "Turn Off Camera" : "Turn On Camera"}
            >
              {hasCameraStream ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
          </motion.div>

          {/* Screen Share (Entire Screen only - window sharing removed!) */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              style={{ width: "48px", height: "48px", minWidth: "48px" }}
              variant={hasScreenStream ? "danger" : "secondary"}
              className={`rounded-[14px] flex items-center justify-center p-0 border border-white/5 ${
                hasScreenStream ? "bg-[#ff3d47]/20 border-[#ff3d47]/30 text-[#ff3d47]" : "bg-neutral-800 hover:bg-neutral-700 text-white"
              }`}
              onClick={() => {
                play("click");
                if (hasScreenStream) {
                  onStopScreen();
                } else {
                  onShareScreen("entire-screen");
                }
              }}
              title={hasScreenStream ? "Stop Sharing Screen" : "Share Entire Screen"}
            >
              <MonitorUp className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Cinema Mode Toggle */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              style={{ width: "48px", height: "48px", minWidth: "48px" }}
              variant={cinemaMode ? "success" : "secondary"}
              className={`rounded-[14px] flex items-center justify-center p-0 border border-white/5 ${
                cinemaMode ? "bg-[#ff3d47]/20 border-[#ff3d47]/30 text-[#ff3d47]" : "bg-neutral-800 hover:bg-neutral-700 text-white"
              }`}
              onClick={() => {
                play("click");
                onToggleCinemaMode();
              }}
              title={cinemaMode ? "Exit Cinema Mode" : "Enter Cinema Mode"}
            >
              <Tv className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Reaction Picker Button */}
          <div className="relative">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                style={{ width: "48px", height: "48px", minWidth: "48px" }}
                variant="secondary"
                className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-[14px] flex items-center justify-center p-0 border border-white/5"
                onClick={() => {
                  play("click");
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                title="Send Reaction"
              >
                <Smile className="h-5 w-5 text-yellow-400" />
              </Button>
            </motion.div>

            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  ref={emojiPickerRef}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#111111] border border-white/10 rounded-full px-3 py-1.5 flex gap-2 shadow-2xl z-50"
                >
                  {emojis.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        play("click");
                        onSendReaction?.(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-2xl hover:brightness-125 transition-all focus:outline-none"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Settings & Leaves */}
        <div className="flex items-center justify-center gap-3">
          {/* Quality Select Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="secondary"
              onClick={() => {
                play("click");
                onOpenQuality();
              }}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/5 rounded-xl text-xs font-semibold flex items-center gap-1.5 h-10 px-3"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />
              <span>Quality: {room.quality || "480p"}</span>
            </Button>
          </motion.div>

          {/* Room Settings Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl border border-white/5 h-10 w-10 p-0 flex items-center justify-center"
              onClick={() => {
                play("click");
                onOpenSettings();
              }}
              title="Room Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Leave/End Room Red Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold h-10 px-4 flex items-center gap-2 border-none shadow-glow-sm"
              onClick={() => {
                play("leave");
                onLeaveRoom();
              }}
              title={isHost ? "End/Leave Room" : "Leave Room"}
            >
              <LogOut className="h-4 w-4" />
              <span>Leave</span>
            </Button>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
