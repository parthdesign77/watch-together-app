import { FormEvent, useEffect, useState } from "react";
import { Compass, DoorOpen, Globe2, Link2, Lock, Plus, Radio, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { joinRoomByCode, joinRoomById, resolveRoomLink, usePublicRooms } from "../../hooks/useRooms";
import { useStartRoom } from "../../hooks/useStartRoom";
import { useUiStore } from "../../store/uiStore";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

import type { ContentItem } from "../../types";

interface StartTogetherModalProps {
  open: boolean;
  onClose: () => void;
  defaultVideoUrl?: string;
  selectedContent?: ContentItem | null;
}

export function StartTogetherModal({ open, onClose, defaultVideoUrl = "", selectedContent = null }: StartTogetherModalProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const startRoom = useStartRoom();
  const publicRooms = usePublicRooms();
  const pushToast = useUiStore((state) => state.pushToast);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [roomType, setRoomType] = useState<"public" | "private">("private");
  const [videoUrl, setVideoUrl] = useState(defaultVideoUrl);
  const [inviteLink, setInviteLink] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (open) {
      if (selectedContent) {
        setVideoUrl(selectedContent.trailerUrl || "");
      } else {
        setVideoUrl(defaultVideoUrl);
      }
    }
  }, [defaultVideoUrl, selectedContent, open]);

  async function createRoom() {
    await startRoom(selectedContent || undefined, videoUrl || undefined, roomType);
    onClose();
  }

  async function joinCode(event?: FormEvent) {
    event?.preventDefault();
    if (!profile || !code.trim()) return;

    try {
      const roomId = await joinRoomByCode(code, profile);
      pushToast({ title: "Joined room", description: "Playback, voice, cameras, and chat are syncing now.", type: "success" });
      onClose();
      navigate(`/room/${roomId}`);
    } catch (error) {
      pushToast({ title: "Could not join room", description: error instanceof Error ? error.message : "Try another code.", type: "error" });
    }
  }

  async function joinLink(event?: FormEvent) {
    event?.preventDefault();
    if (!profile) return;

    try {
      const roomId = await resolveRoomLink(inviteLink);
      await joinRoomById(roomId, profile);
      pushToast({ title: "Invite accepted", description: "You are entering the room automatically.", type: "success" });
      onClose();
      navigate(`/room/${roomId}`);
    } catch (error) {
      pushToast({ title: "Invalid invite link", description: error instanceof Error ? error.message : "Paste a full Watch Together URL.", type: "error" });
    }
  }

  return (
    <Modal open={open} title="Start Together" onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/6 p-1">
          <button
            className={`flex h-12 items-center justify-center gap-2 rounded-md text-sm font-bold transition ${
              mode === "create" ? "bg-red-600 text-white shadow-glow" : "text-muted hover:bg-white/8 hover:text-white"
            }`}
            onClick={() => setMode("create")}
          >
            <Plus className="h-4 w-4" />
            Create a Room
          </button>
          <button
            className={`flex h-12 items-center justify-center gap-2 rounded-md text-sm font-bold transition ${
              mode === "join" ? "bg-red-600 text-white shadow-glow" : "text-muted hover:bg-white/8 hover:text-white"
            }`}
            onClick={() => setMode("join")}
          >
            <DoorOpen className="h-4 w-4" />
            Join a Room
          </button>
        </div>

        {mode === "create" ? (
          <div className="space-y-4">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-red-200">Choose room type</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className={`rounded-lg border p-4 text-left transition ${
                    roomType === "public" ? "border-red-500 bg-red-500/14" : "border-white/10 bg-white/6 hover:border-red-500/40"
                  }`}
                  onClick={() => setRoomType("public")}
                >
                  <Globe2 className="h-6 w-6 text-red-300" />
                  <h3 className="mt-3 font-display text-lg font-bold">Public Room</h3>
                  <p className="mt-1 text-sm text-muted">Discoverable in the public room browser. Anyone can find and join.</p>
                </button>
                <button
                  className={`rounded-lg border p-4 text-left transition ${
                    roomType === "private" ? "border-red-500 bg-red-500/14" : "border-white/10 bg-white/6 hover:border-red-500/40"
                  }`}
                  onClick={() => setRoomType("private")}
                >
                  <Lock className="h-6 w-6 text-red-300" />
                  <h3 className="mt-3 font-display text-lg font-bold">Private Room</h3>
                  <p className="mt-1 text-sm text-muted">Hidden and unlisted. Friends enter through an invite link or room code.</p>
                </button>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-red-200">Optional media URL</span>
              <input
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                placeholder="YouTube, MP4, or HLS URL"
                className="h-12 w-full rounded-lg border border-white/10 bg-white/8 px-3 text-sm outline-none focus:border-red-500"
              />
            </label>

            <Button className="w-full" onClick={createRoom}>
              <Sparkles className="h-4 w-4" />
              Create {roomType === "public" ? "Public" : "Private"} Room
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={joinLink} className="rounded-lg border border-white/10 bg-white/6 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-red-300" />
                <div>
                  <h3 className="font-display text-lg font-bold">Join via Link</h3>
                  <p className="text-xs text-muted">Paste an invite URL and enter the room automatically.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  value={inviteLink}
                  onChange={(event) => setInviteLink(event.target.value)}
                  placeholder="https://.../room/..."
                  className="h-12 min-w-0 flex-1 rounded-lg border border-white/10 bg-ink px-3 text-sm outline-none focus:border-red-500"
                />
                <Button type="submit">Join</Button>
              </div>
            </form>

            <form onSubmit={joinCode} className="rounded-lg border border-white/10 bg-white/6 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Search className="h-5 w-5 text-red-300" />
                <div>
                  <h3 className="font-display text-lg font-bold">Enter Code</h3>
                  <p className="text-xs text-muted">Use the host's short alphanumeric room code.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  placeholder="A7K9Q2"
                  className="h-12 min-w-0 flex-1 rounded-lg border border-white/10 bg-ink px-3 text-center font-display text-xl font-black tracking-[0.2em] outline-none focus:border-red-500"
                />
                <Button type="submit">Enter</Button>
              </div>
            </form>

            <section className="rounded-lg border border-white/10 bg-white/6 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-red-300" />
                  <h3 className="font-display text-lg font-bold">Public Rooms</h3>
                </div>
                <Badge tone="red">{publicRooms.length}</Badge>
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {publicRooms.length ? (
                  publicRooms.map((room) => (
                    <button
                      key={room.id}
                      className="w-full rounded-lg border border-white/10 bg-black/30 p-3 text-left transition hover:border-red-500/50 hover:bg-red-500/10"
                      onClick={async () => {
                        if (!profile) return;
                        await joinRoomById(room.id, profile);
                        onClose();
                        navigate(`/room/${room.id}`);
                      }}
                    >
                      <p className="truncate text-sm font-bold">{room.roomName}</p>
                      <p className="mt-1 text-xs text-muted">
                        {room.code} · {Object.keys(room.participants || {}).length} online · {room.status}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-muted">No public rooms are live yet.</p>
                )}
              </div>
            </section>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
          <Radio className="mt-0.5 h-4 w-4" />
          <p>Invite links auto-join room state, voice, camera presence, chat history, and the current playback timestamp.</p>
        </div>
      </div>
    </Modal>
  );
}
