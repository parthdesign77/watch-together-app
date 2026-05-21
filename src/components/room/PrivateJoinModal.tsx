import { useState } from "react";
import { ShieldAlert, Key } from "lucide-react";
import type { WatchRoom } from "../../types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface PrivateJoinModalProps {
  open: boolean;
  room: WatchRoom | null;
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

export function PrivateJoinModal({ open, room, onClose, onSuccess }: PrivateJoinModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (!room) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!room) return;
    if (code.trim().toUpperCase() === room.code.toUpperCase()) {
      setError("");
      setCode("");
      onSuccess(room.id);
    } else {
      setError("Invalid room code. Please check and try again.");
    }
  }

  return (
    <Modal open={open} title="Private Watch Room Validation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="h-12 w-12 rounded-full bg-cyan/10 text-cyan flex items-center justify-center mb-3 border border-cyan/20">
            <Key className="h-6 w-6 text-cyan" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">Security Verification</h3>
          <p className="text-xs text-muted max-w-sm mt-1">
            "{room.roomName}" is a private synchronized room. Enter the 6-character access code to join.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-cyan block">
            Access Code
          </label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="ENTER ACCESS CODE"
            className="h-12 w-full rounded-lg border border-white/10 bg-white/8 px-4 text-center font-display text-2xl font-black tracking-[0.2em] text-white outline-none focus:border-cyan"
            required
            autoFocus
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Unlock & Join
          </Button>
        </div>
      </form>
    </Modal>
  );
}
