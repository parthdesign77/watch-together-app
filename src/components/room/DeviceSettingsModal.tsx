import { useEffect, useState, useRef } from "react";
import { Mic, Volume2, Sliders, ShieldAlert } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface DeviceSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function DeviceSettingsModal({ open, onClose }: DeviceSettingsModalProps) {
  const audioInputDeviceId = useUiStore((state) => state.audioInputDeviceId);
  const audioOutputDeviceId = useUiStore((state) => state.audioOutputDeviceId);
  const noiseSuppressionEnabled = useUiStore((state) => state.noiseSuppressionEnabled);

  const setAudioInputDeviceId = useUiStore((state) => state.setAudioInputDeviceId);
  const setAudioOutputDeviceId = useUiStore((state) => state.setAudioOutputDeviceId);
  const setNoiseSuppressionEnabled = useUiStore((state) => state.setNoiseSuppressionEnabled);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const testStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Request permissions and enumerate devices
  useEffect(() => {
    if (!open) return;

    const initDevices = async () => {
      try {
        // Request initial mic permission if not granted yet, so device labels are visible
        await navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
        });

        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceList);
        setPermissionError(null);
      } catch (err) {
        console.warn("Device enumeration permission denied or failed:", err);
        setPermissionError("Microphone access is required to configure devices and voice chat.");
        // Try enumerating anyway (device labels will be empty, but we might get IDs)
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceList);
      }
    };

    void initDevices();

    // Listen for device changes (e.g. plugging/unplugging headsets)
    navigator.mediaDevices.addEventListener("devicechange", initDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", initDevices);
    };
  }, [open]);

  // Handle temporary visual VU level meter
  useEffect(() => {
    if (!open) {
      stopTestStream();
      return;
    }

    let active = true;

    const startTestStream = async () => {
      stopTestStream();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: audioInputDeviceId && audioInputDeviceId !== "default" ? { exact: audioInputDeviceId } : undefined
          }
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        testStreamRef.current = stream;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!active) return;
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const average = sum / dataArray.length;
          // Normalize level between 0 and 100 for display
          const normalized = Math.min(100, Math.round((average / 128) * 100));
          setMicLevel(normalized);
          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch (err) {
        console.warn("Failed to start mic test level stream:", err);
        setMicLevel(0);
      }
    };

    void startTestStream();

    return () => {
      active = false;
      stopTestStream();
    };
  }, [open, audioInputDeviceId]);

  const stopTestStream = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((track) => track.stop());
      testStreamRef.current = null;
    }
    setMicLevel(0);
  };

  const microphones = devices.filter((d) => d.kind === "audioinput");
  const speakers = devices.filter((d) => d.kind === "audiooutput");

  return (
    <Modal open={open} title="Audio & Device Settings" onClose={onClose}>
      <div className="space-y-6">
        {permissionError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-400 text-xs">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Microphone Permission Required</p>
              <p className="mt-0.5 leading-relaxed">{permissionError}</p>
            </div>
          </div>
        )}

        {/* Microphone / Audio Input */}
        <section className="space-y-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#ff3d47]/80">
              Microphone (Input Device)
            </span>
            <div className="relative">
              <select
                value={audioInputDeviceId}
                onChange={(e) => setAudioInputDeviceId(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white outline-none focus:border-[#ff3d47] transition cursor-pointer"
              >
                <option value="default" className="bg-[#111] text-white">Default Microphone</option>
                {microphones.map((device) => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-[#111] text-white">
                    {device.label || `Microphone (${device.deviceId.slice(0, 5)})`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                <Mic className="h-4 w-4" />
              </div>
            </div>
          </label>
        </section>

        {/* Speaker / Audio Output */}
        <section className="space-y-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#ff3d47]/80">
              Speaker / Headphones (Output Device)
            </span>
            <div className="relative">
              <select
                value={audioOutputDeviceId}
                onChange={(e) => setAudioOutputDeviceId(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white outline-none focus:border-[#ff3d47] transition cursor-pointer"
              >
                <option value="default" className="bg-[#111] text-white">Default Speaker</option>
                {speakers.map((device) => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-[#111] text-white">
                    {device.label || `Speaker (${device.deviceId.slice(0, 5)})`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                <Volume2 className="h-4 w-4" />
              </div>
            </div>
          </label>
          <p className="text-[10px] text-neutral-400 leading-relaxed px-1">
            Note: Changing output devices (setSinkId) is supported in Google Chrome, Microsoft Edge, and Firefox.
          </p>
        </section>

        {/* Noise Suppression Switch */}
        <section className="bg-white/4 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-[#ff3d47]" />
              Noise Suppression
            </h4>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              Filters background static hums, fan whirring, and transient room noises from your microphone feed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNoiseSuppressionEnabled(!noiseSuppressionEnabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              noiseSuppressionEnabled ? "bg-[#ff3d47]" : "bg-neutral-800"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                noiseSuppressionEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </section>

        {/* Real-time VU Volume Level Meter */}
        <section className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-[#ff3d47]/80">
            <span>Microphone Input Level</span>
            <span className="font-mono text-[10px] text-neutral-400">{micLevel}%</span>
          </div>
          <div className="h-3.5 w-full bg-neutral-900 border border-white/5 rounded-full overflow-hidden p-0.5">
            <div
              style={{ width: `${micLevel}%` }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-[#ff3d47] transition-all duration-75 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            />
          </div>
        </section>

        {/* Close Button */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <Button onClick={onClose} className="bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white rounded-xl px-6 h-11 font-bold">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
