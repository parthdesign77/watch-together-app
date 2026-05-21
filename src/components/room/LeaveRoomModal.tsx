import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";

interface LeaveRoomModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isHost: boolean;
}

export function LeaveRoomModal({ open, onClose, onConfirm, isHost }: LeaveRoomModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            className="w-full max-w-md bg-[#111111] border border-white/5 rounded-[28px] p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#ff3d47] to-purple-600 animate-pulse" />
            
            <div className="flex items-center gap-4 mb-4 text-[#ff3d47]">
              <div className="bg-[#ff3d47]/10 p-3 rounded-2xl border border-[#ff3d47]/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl font-black text-white">
                {isHost ? "End Watch Room?" : "Leave Watch Party?"}
              </h2>
            </div>

            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              {isHost
                ? "Ending the room will close the party and disconnect all participants. Playback and screenshares will be stopped for everyone."
                : "Leaving means you'll be disconnected from the movie stream and voice chat. You can rejoin using the room's invite code."}
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                className="bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl border border-white/5 h-11 px-5"
              >
                Cancel
              </Button>
              <Button
                className="bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white rounded-xl h-11 px-5 font-bold flex items-center gap-2 border-none shadow-glow-sm"
                onClick={onConfirm}
              >
                {isHost ? (
                  <>
                    <Trash2 className="h-4.5 w-4.5" />
                    <span>End Room</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4.5 w-4.5" />
                    <span>Leave Room</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
