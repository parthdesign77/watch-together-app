import {
  Crown,
  Film,
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
import { playSound } from "../../lib/sounds";
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
  onOpenQuality,
  onOpenSettings,
  onOpenSelector,
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

        {isHost && (
          <Button
            className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-glow-sm border-none animate-pulse hover:animate-none"
            onClick={() => {
              playSound("click");
              onOpenSelector();
            }}
          >
            <Film className="h-4 w-4" />
            Select Movie
          </Button>
        )}

        <Button
          variant="secondary"
          onClick={() => {
            playSound("click");
            onInvite();
          }}
        >
          <Share2 className="h-4 w-4" />
          Invite
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            playSound("success");
            onStartVoice();
          }}
        >
          <PhoneCall className="h-4 w-4" />
          Voice
        </Button>
        <Button
          variant={muted ? "danger" : "secondary"}
          size="icon"
          onClick={() => {
            playSound("toggle");
            onToggleMute();
          }}
          aria-label="Toggle mute"
        >
          {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button
          variant={hasCameraStream ? "danger" : "secondary"}
          onClick={() => {
            playSound("toggle");
            onToggleCamera();
          }}
        >
          {hasCameraStream ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          {hasCameraStream ? "Camera Off" : "Camera"}
        </Button>
        {hasScreenStream ? (
          <Button
            variant="danger"
            onClick={() => {
              playSound("danger");
              onStopScreen();
            }}
          >
            <MonitorUp className="h-4 w-4" />
            Stop Share
          </Button>
        ) : (
          <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/6">
            <Button
              variant="secondary"
              className="rounded-none border-0"
              onClick={() => {
                playSound("success");
                onShareScreen("entire-screen");
              }}
            >
              <MonitorUp className="h-4 w-4" />
              Entire Screen
            </Button>
            <Button
              variant="secondary"
              className="rounded-none border-0 border-l border-white/10"
              onClick={() => {
                playSound("success");
                onShareScreen("window");
              }}
            >
              Window Only
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            playSound("toggle");
            void updateRoomState(room.id, {
              theaterMode: !room.theaterMode
            });
          }}
        >
          <Users className="h-4 w-4" />
          Theater
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            playSound("click");
            onOpenQuality();
          }}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>{room.quality || "480p"}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            playSound("click");
            onOpenSettings();
          }}
          aria-label="Room settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
