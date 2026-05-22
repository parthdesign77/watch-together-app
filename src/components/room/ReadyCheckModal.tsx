import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Play, XCircle } from "lucide-react";
import { setReadyStatus, cancelReadyCheck, updatePlayback } from "../../hooks/useRooms";
import type { WatchRoom, Participant } from "../../types";
import { Button } from "../ui/Button";
import { useUISound } from "../../hooks/useUISound";
import { useEffect } from "react";

interface ReadyCheckModalProps {
  open: boolean;
  room: WatchRoom;
  userId: string;
  isHost: boolean;
  participants: Participant[];
}

export function ReadyCheckModal({ open, room, userId, isHost, participants }: ReadyCheckModalProps) {
  const { play } = useUISound();
  const readyCheck = room.readyCheck;

  // Hook 1: Play sound when ready check starts
  useEffect(() => {
    if (open) {
      play("ready");
    }
  }, [open, play]);

  // Safely compute values
  const statusMap = readyCheck?.status || {};
  const isMeReady = statusMap[userId] === true;

  const unreadyParticipants = participants.filter((p) => !statusMap[p.uid]);
  const everyoneReady = open && unreadyParticipants.length === 0;

  // Hook 2: Trigger playback and cancel ready check when everyone is ready
  useEffect(() => {
    if (open && everyoneReady && isHost && room.videoUrl) {
      play("start");
      void updatePlayback(room.id, {
        isPlaying: true,
        currentTime: 0,
        status: "watching"
      }).then(() => {
        void cancelReadyCheck(room.id);
      });
    }
  }, [open, everyoneReady, isHost, room.id, room.videoUrl, play]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="ready-check-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <motion.div
            key="ready-check-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="w-full max-w-md bg-[#111111] border border-white/5 rounded-[28px] p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-cyan" />

            <div className="text-center mb-6">
              <h2 className="font-display text-xl font-black text-white flex items-center justify-center gap-2">
                <span>Ready Check</span>
                {everyoneReady ? (
                  <span className="text-emerald-400 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Ready!
                  </span>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan" />
                )}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Let's make sure everyone is buckled in before starting the movie!
              </p>
            </div>

            <div className="space-y-3 mb-6 max-h-52 overflow-y-auto pr-1">
              {participants.map((p) => {
                const isReady = statusMap[p.uid] === true;
                return (
                  <div
                    key={p.uid}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                      isReady
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                        : "bg-white/2 border-white/5 text-neutral-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/10"
                        style={{ backgroundColor: p.avatar ? undefined : (p.avatarColor || "#ff3d47") }}
                      >
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name || "Guest"} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          (p.name || "Guest").slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                    </div>

                    <div>
                      {isReady ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Waiting...</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2.5">
              {!isMeReady ? (
                <Button
                  className="w-full bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl h-11 font-black tracking-wide border-none shadow-glow-sm"
                  onClick={() => {
                    play("click");
                    void setReadyStatus(room.id, userId, true);
                  }}
                >
                  I'M READY
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl h-11 font-bold pointer-events-none flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-bounce" />
                  <span>LOCKED IN & READY</span>
                </Button>
              )}

              {isHost && (
                <Button
                  variant="ghost"
                  className="w-full hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl h-10 font-bold"
                  onClick={() => {
                    play("leave");
                    void cancelReadyCheck(room.id);
                  }}
                >
                  Cancel Ready Check
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
