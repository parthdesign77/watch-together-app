import { Crown, DoorOpen, Globe2, Lock, Save, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { endRoom, updateRoomState } from "../../hooks/useRooms";
import { playSound } from "../../lib/sounds";
import type { WatchRoom } from "../../types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface RoomSettingsModalProps {
  open: boolean;
  onClose: () => void;
  room: WatchRoom;
  isHost: boolean;
}

export function RoomSettingsModal({ open, onClose, room, isHost }: RoomSettingsModalProps) {
  const { profile } = useAuth();
  const [roomName, setRoomName] = useState(room.roomName || "");
  const [roomType, setRoomType] = useState<"public" | "private">(room.roomType || (room.isPrivate ? "private" : "public"));
  const [saving, setSaving] = useState(false);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!isHost || saving) return;

    playSound("success");
    setSaving(true);
    try {
      await updateRoomState(room.id, {
        roomName: roomName.trim(),
        roomType,
        isPrivate: roomType === "private"
      });
      onClose();
    } catch (error) {
      console.error("Save settings error:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleEndRoom() {
    if (!isHost) return;
    playSound("danger");
    if (confirm("Are you sure you want to end this watch room for all participants?")) {
      try {
        await endRoom(room.id);
        onClose();
      } catch (error) {
        console.error("End room error:", error);
      }
    }
  }

  return (
    <Modal open={open} title="Room Settings" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-5">
        {/* Host configurations */}
        <section className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-red-200">Room Name</span>
            <input
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              disabled={!isHost}
              placeholder="e.g. Inception Watch Party"
              className="h-12 w-full rounded-lg border border-white/10 bg-white/8 px-3 text-sm outline-none focus:border-red-500 disabled:opacity-50"
              required
            />
          </label>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-red-200">Room Type</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={!isHost}
                className={`rounded-lg border p-4 text-left transition ${
                  roomType === "public"
                    ? "border-red-500 bg-red-500/14"
                    : "border-white/10 bg-white/6 hover:border-red-500/40 disabled:opacity-50"
                }`}
                onClick={() => {
                  playSound("toggle");
                  setRoomType("public");
                }}
              >
                <Globe2 className="h-6 w-6 text-red-300" />
                <h3 className="mt-3 font-display text-lg font-bold text-snow">Public Room</h3>
                <p className="mt-1 text-xs text-muted">Discoverable in active room dashboards for all platform users.</p>
              </button>
              <button
                type="button"
                disabled={!isHost}
                className={`rounded-lg border p-4 text-left transition ${
                  roomType === "private"
                    ? "border-red-500 bg-red-500/14"
                    : "border-white/10 bg-white/6 hover:border-red-500/40 disabled:opacity-50"
                }`}
                onClick={() => {
                  playSound("toggle");
                  setRoomType("private");
                }}
              >
                <Lock className="h-6 w-6 text-red-300" />
                <h3 className="mt-3 font-display text-lg font-bold text-snow">Private Room</h3>
                <p className="mt-1 text-xs text-muted">Hidden and unlisted. Entrance via invite link or room code only.</p>
              </button>
            </div>
          </div>
        </section>

        {/* Action Controls */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 justify-between items-center">
          {isHost ? (
            <Button type="button" variant="danger" className="gap-2" onClick={handleEndRoom}>
              <Trash2 className="h-4 w-4" />
              End Room
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Crown className="h-4 w-4 text-orange" />
              <span>Only the room host can modify these settings.</span>
            </div>
          )}

          {isHost && (
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
