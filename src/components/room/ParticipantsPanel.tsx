import { MonitorUp, Video, Wifi, WifiOff } from "lucide-react";
import type { Participant } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

export function ParticipantsPanel({ participants }: { participants: Participant[] }) {
  return (
    <section className="glass rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Participants</h2>
          <p className="text-xs text-muted">Voice, camera, sync, and screen state</p>
        </div>
        <Badge tone="green">{participants.length} online</Badge>
      </div>
      <div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-thin pr-1">
        {participants.map((participant) => (
          <div key={participant.uid} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/6 p-2">
            <Avatar user={participant} showStatus />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{participant.name}</p>
              <p className="text-xs text-muted">{participant.isHost ? "Host authority" : participant.isBuffering ? "Buffering" : "Synced"}</p>
              <div className="mt-1 flex gap-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                {participant.isCameraOn ? (
                  <span className="inline-flex items-center gap-1 text-red-200">
                    <Video className="h-3 w-3" />
                    Cam
                  </span>
                ) : null}
                {participant.isScreenSharing ? (
                  <span className="inline-flex items-center gap-1 text-red-200">
                    <MonitorUp className="h-3 w-3" />
                    Share
                  </span>
                ) : null}
              </div>
            </div>
            {participant.connectionQuality === "poor" ? (
              <WifiOff className="h-4 w-4 text-danger" />
            ) : (
              <Wifi className="h-4 w-4 text-anime" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
