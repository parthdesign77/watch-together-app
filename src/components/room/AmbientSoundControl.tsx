import { Music2, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playSound } from "../../lib/sounds";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

const presets = [
  { id: "rain", label: "Rain" },
  { id: "cafe", label: "Cafe" },
  { id: "lofi", label: "Lofi" },
  { id: "nature", label: "Nature" }
] as const;

type Preset = (typeof presets)[number]["id"];

interface AmbientSoundControlProps {
  isScreenSharing?: boolean;
}

export function AmbientSoundControl({ isScreenSharing = false }: AmbientSoundControlProps) {
  const [playing, setPlaying] = useState(false);
  const [preset, setPreset] = useState<Preset>("rain");
  const [volume, setVolume] = useState(0.18);
  const audioRef = useRef<{
    context: AudioContext;
    gain: GainNode;
    stop: () => void;
  } | null>(null);

  // Auto shut down ambient sound when someone starts screen sharing
  useEffect(() => {
    if (isScreenSharing && playing) {
      stopAmbient();
      setPlaying(false);
    }
  }, [isScreenSharing]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.gain.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (playing) {
      stopAmbient();
      startAmbient();
    }
    return () => undefined;
  }, [preset]);

  function startAmbient() {
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = volume;
    gain.connect(context.destination);

    if (preset === "lofi") {
      const bass = context.createOscillator();
      const lead = context.createOscillator();
      bass.type = "sine";
      lead.type = "triangle";
      bass.frequency.value = 82;
      lead.frequency.value = 196;
      bass.connect(gain);
      lead.connect(gain);
      bass.start();
      lead.start();
      audioRef.current = {
        context,
        gain,
        stop: () => {
          bass.stop();
          lead.stop();
        }
      };
      return;
    }

    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      const base = Math.random() * 2 - 1;
      data[i] = preset === "rain" ? base * 0.38 : preset === "cafe" ? base * 0.16 : Math.sin(i / 240) * 0.08 + base * 0.1;
    }
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    filter.type = preset === "rain" ? "highpass" : "lowpass";
    filter.frequency.value = preset === "rain" ? 1400 : preset === "cafe" ? 720 : 420;
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(filter);
    filter.connect(gain);
    noise.start();
    audioRef.current = {
      context,
      gain,
      stop: () => noise.stop()
    };
  }

  function stopAmbient() {
    audioRef.current?.stop();
    void audioRef.current?.context.close();
    audioRef.current = null;
  }

  function toggle() {
    playSound("toggle");
    if (playing) {
      stopAmbient();
      setPlaying(false);
      return;
    }
    startAmbient();
    setPlaying(true);
  }

  return (
    <section className="glass rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Music2 className="h-5 w-5 text-red-300" />
          <div>
            <h2 className="font-display text-lg font-bold">Background Sound</h2>
            <p className="text-xs text-muted">Local ambient layer mixed below content and voice.</p>
          </div>
        </div>
        <Badge tone={playing ? "red" : "muted"}>{playing ? "On" : "Off"}</Badge>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {presets.map((item) => (
          <button
            key={item.id}
            className={`h-9 rounded-md border text-xs font-bold transition ${
              preset === item.id ? "border-red-500 bg-red-500/20 text-white" : "border-white/10 bg-white/6 text-muted hover:text-white"
            }`}
            onClick={() => {
              playSound("click");
              setPreset(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button variant={playing ? "danger" : "secondary"} size="icon" onClick={toggle} aria-label="Toggle ambient sound">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="min-w-0 flex-1 accent-red-500"
        />
        <span className="w-10 text-right text-xs font-bold text-muted">{Math.round(volume * 200)}%</span>
      </div>
    </section>
  );
}
