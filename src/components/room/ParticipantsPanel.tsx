import { MonitorUp, Video, Wifi, WifiOff, Hand, Volume2, VolumeX } from "lucide-react";
import type { Participant } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { useUiStore } from "../../store/uiStore";

export function ParticipantsPanel({ participants }: { participants: Participant[] }) {
  const { profile } = useAuth();
  const participantVolumes = useUiStore((state) => state.participantVolumes);
  const setParticipantVolume = useUiStore((state) => state.setParticipantVolume);

  return (
    <section className="glass rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Participants</h2>
          <p className="text-xs text-muted">Voice, camera, sync, and screen state</p>
        </div>
        <Badge tone="green">{participants.length} online</Badge>
      </div>
      <div className="space-y-3 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
        {participants.map((participant) => {
          const isLocal = profile && participant.uid === profile.uid;
          const currentVolume = participantVolumes[participant.uid] ?? 1;
          const isSpeaking = participant.isSpeaking;

          return (
            <div
              key={participant.uid}
              className={`flex flex-col gap-2 rounded-lg border p-2.5 transition-all duration-350 ${
                isSpeaking
                  ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-[1.01]"
                  : "border-white/10 bg-white/6 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar user={participant} showStatus />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="truncate text-sm font-black text-white">{participant.name}</p>
                    {participant.isHandRaised && (
                      <span className="inline-flex items-center gap-0.5 bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.2 rounded-full border border-amber-500/30 animate-pulse font-black uppercase shrink-0">
                        <Hand className="h-2.5 w-2.5 fill-amber-400" />
                        Hand
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {participant.isHost ? "Host authority" : participant.isBuffering ? "Buffering" : "Synced"}
                  </p>
                </div>
                {participant.connectionQuality === "poor" ? (
                  <WifiOff className="h-4 w-4 text-danger" />
                ) : (
                  <Wifi className="h-4 w-4 text-anime" />
                )}
              </div>

              {/* Action indicators and volume controls */}
              <div className="flex items-center justify-between gap-2 mt-1 pt-1.5 border-t border-white/5 flex-wrap">
                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {participant.isCameraOn ? (
                    <span className="inline-flex items-center gap-0.5 text-red-200">
                      <Video className="h-3 w-3" />
                      Cam
                    </span>
                  ) : null}
                  {participant.isScreenSharing ? (
                    <span className="inline-flex items-center gap-0.5 text-red-200">
                      <MonitorUp className="h-3 w-3" />
                      Share
                    </span>
                  ) : null}
                  {!participant.isCameraOn && !participant.isScreenSharing && (
                    <span className="text-neutral-500">No stream</span>
                  )}
                </div>

                {/* Speaker volume control for remote participants */}
                {!isLocal && (
                  <div className="flex items-center gap-1.5 bg-black/40 rounded-lg px-2 py-1 max-w-[130px] border border-white/5 flex-1 justify-end">
                    {currentVolume === 0 ? (
                      <VolumeX className="h-3.5 w-3.5 text-red-400 shrink-0 cursor-pointer" onClick={() => setParticipantVolume(participant.uid, 1)} />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 text-cyan shrink-0 cursor-pointer" onClick={() => setParticipantVolume(participant.uid, 0)} />
                    )}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={currentVolume}
                      onChange={(e) => setParticipantVolume(participant.uid, Number(e.target.value))}
                      className="w-16 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan outline-none"
                      title={`${participant.name}'s volume`}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
