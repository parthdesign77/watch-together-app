import { Crown, HelpCircle, Lock, Music2, Sliders, Volume2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { updateRoomState } from "../../hooks/useRooms";
import { playSound } from "../../lib/sounds";
import type { WatchRoom } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useNavigate } from "react-router-dom";

interface QualitySelectModalProps {
  open: boolean;
  onClose: () => void;
  room: WatchRoom;
}

export function QualitySelectModal({ open, onClose, room }: QualitySelectModalProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const hostPlan = room.maxQuality === "1080p" ? "premium" : room.maxQuality === "720p" ? "standard" : "free";

  const resolutions = [
    { id: "480p", label: "Standard 480p", tier: "free", desc: "Optimized for mobile & free accounts" },
    { id: "720p", label: "High Definition 720p", tier: "standard", desc: "Crisp HD for Standard & Premium accounts" },
    { id: "1080p", label: "Full HD 1080p", tier: "premium", desc: "Ultimate cinematic clear display for Premium accounts" }
  ] as const;

  const audioChannels = [
    { id: "stereo", label: "Stereo 2.0", tier: "free", desc: "Standard audio playback" },
    { id: "surround", label: "Surround 5.1", tier: "standard", desc: "Enhanced spatial audio channels" },
    { id: "dolby", label: "Dolby Atmos", tier: "premium", desc: "Premium virtual overhead acoustics" }
  ];

  const audioLanguages = [
    { code: "en", label: "English (Original)" },
    { code: "hi", label: "Hindi (Dubbed)" },
    { code: "es", label: "Spanish (Español)" },
    { code: "comm", label: "Director Commentary" }
  ];

  // Current local selections
  const currentQuality = room.quality || "480p";
  const currentAudio = room.audioChannel || "stereo";
  const currentLang = room.audioLanguage || "en";

  function isTierLocked(itemTier: string): boolean {
    if (itemTier === "free") return false;
    if (itemTier === "standard") return hostPlan === "free";
    if (itemTier === "premium") return hostPlan !== "premium";
    return false;
  }

  async function handleSelectQuality(qualityId: "480p" | "720p" | "1080p" | "auto", itemTier: string) {
    if (isTierLocked(itemTier)) {
      playSound("danger");
      onClose();
      navigate("/billing");
      return;
    }

    playSound("toggle");
    await updateRoomState(room.id, { quality: qualityId });
  }

  async function handleSelectAudio(audioId: string, itemTier: string) {
    if (isTierLocked(itemTier)) {
      playSound("danger");
      onClose();
      navigate("/billing");
      return;
    }

    playSound("toggle");
    await updateRoomState(room.id, { audioChannel: audioId });
  }

  async function handleSelectLang(langCode: string) {
    playSound("click");
    await updateRoomState(room.id, { audioLanguage: langCode });
  }

  return (
    <Modal open={open} title="Quality & Audio Controls" onClose={onClose}>
      <div className="space-y-6">
        {/* Video Quality */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-cyan">
            <Sliders className="h-5 w-5" />
            <h3 className="font-display font-bold text-snow">Video Quality</h3>
          </div>
          <div className="space-y-2">
            {resolutions.map((res) => {
              const locked = isTierLocked(res.tier);
              const active = currentQuality === res.id;

              return (
                <button
                  key={res.id}
                  onClick={() => handleSelectQuality(res.id, res.tier)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    active
                      ? "border-cyan bg-cyan/10 text-white shadow-glow-sm"
                      : locked
                      ? "border-white/5 bg-black/40 text-muted opacity-60 hover:opacity-80"
                      : "border-white/10 bg-white/6 text-muted hover:border-cyan/40 hover:text-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-snow">{res.label}</span>
                      {res.tier !== "free" && (
                        <Badge tone={res.tier === "premium" ? "purple" : "cyan"}>
                          {res.tier.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{res.desc}</p>
                  </div>
                  {locked ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Upgrade Room Host</span>
                    </div>
                  ) : active ? (
                    <div className="h-2 w-2 rounded-full bg-cyan shadow-glow" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* Audio Output Channel */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-anime">
            <Volume2 className="h-5 w-5" />
            <h3 className="font-display font-bold text-snow">Audio Output</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {audioChannels.map((chan) => {
              const locked = isTierLocked(chan.tier);
              const active = currentAudio === chan.id;

              return (
                <button
                  key={chan.id}
                  onClick={() => handleSelectAudio(chan.id, chan.tier)}
                  className={`text-left p-3 rounded-lg border transition-all flex flex-col justify-between ${
                    active
                      ? "border-anime bg-anime/10 text-white"
                      : locked
                      ? "border-white/5 bg-black/40 text-muted opacity-60 hover:opacity-80"
                      : "border-white/10 bg-white/6 text-muted hover:border-anime/40 hover:text-white"
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span className="font-bold text-xs text-snow">{chan.label}</span>
                    {locked && <Lock className="h-3 w-3 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-muted mt-1 leading-tight">{chan.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Audio Track Selector */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-red-300">
            <Music2 className="h-5 w-5" />
            <h3 className="font-display font-bold text-snow">Audio Language</h3>
          </div>
          <div className="grid gap-2 grid-cols-2">
            {audioLanguages.map((lang) => {
              const active = currentLang === lang.code;

              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLang(lang.code)}
                  className={`text-center py-2.5 px-3 rounded-lg border text-sm font-bold transition-all ${
                    active
                      ? "border-red-500 bg-red-500/20 text-white"
                      : "border-white/10 bg-white/6 text-muted hover:text-white hover:border-red-500/40"
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Alert on Hosting tier */}
        <div className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/4 p-3 text-xs text-muted">
          <HelpCircle className="h-4 w-4 shrink-0 text-cyan mt-0.5" />
          <p>
            Room capabilities (max participants, maximum resolution) are determined by the room host's subscription plan. To stream higher resolutions, the host must upgrade.
          </p>
        </div>
      </div>
    </Modal>
  );
}
