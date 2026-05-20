import {
  Crown,
  Mic,
  MicOff,
  MonitorUp,
  PhoneCall,
  Settings,
  Share2,
  SlidersHorizontal,
  Users,
  Video,
  VideoOff
} from "lucide-react";
import { updateRoomState } from "../../hooks/useRooms";
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
  hasCameraStream: boolean;
  hasScreenStream: boolean;
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
  hasCameraStream,
  hasScreenStream
}: RoomControlsProps) {
  return (
    <section className="glass rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto min-w-[220px]">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-black">{room.roomName}</h1>
            {isHost ? (
              <Badge tone="orange">
                <Crown className="h-3.5 w-3.5" />
                Host
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">
            Code {room.code} · {Object.keys(room.participants || {}).length} friends · {room.roomType || (room.isPrivate ? "private" : "public")} · {room.status}
          </p>
        </div>

        <Button variant="secondary" onClick={onInvite}>
          <Share2 className="h-4 w-4" />
          Invite
        </Button>
        <Button variant="secondary" onClick={onStartVoice}>
          <PhoneCall className="h-4 w-4" />
          Voice
        </Button>
        <Button variant={muted ? "danger" : "secondary"} size="icon" onClick={onToggleMute} aria-label="Toggle mute">
          {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button variant={hasCameraStream ? "danger" : "secondary"} onClick={onToggleCamera}>
          {hasCameraStream ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          {hasCameraStream ? "Camera Off" : "Camera"}
        </Button>
        {hasScreenStream ? (
          <Button variant="danger" onClick={onStopScreen}>
            <MonitorUp className="h-4 w-4" />
            Stop Share
          </Button>
        ) : (
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            <Button variant="secondary" className="rounded-none border-0" onClick={() => onShareScreen("entire-screen")}>
              <MonitorUp className="h-4 w-4" />
              Entire Screen
            </Button>
            <Button variant="secondary" className="rounded-none border-0 border-l border-white/10" onClick={() => onShareScreen("window")}>
              Window Only
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={() =>
            updateRoomState(room.id, {
              theaterMode: !room.theaterMode
            })
          }
        >
          <Users className="h-4 w-4" />
          Theater
        </Button>
        <Button
          variant="ghost"
          disabled={!isHost}
          onClick={() =>
            updateRoomState(room.id, {
              quality: room.quality === "1080p" ? "720p" : "1080p"
            })
          }
        >
          <SlidersHorizontal className="h-4 w-4" />
          {room.quality}
        </Button>
        <Button variant="ghost" size="icon" disabled={!isHost} aria-label="Room settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
