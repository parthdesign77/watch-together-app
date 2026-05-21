import { useCallback, useRef } from "react";

export type UISoundType =
  | "hover"
  | "click"
  | "select"
  | "invite"
  | "join"
  | "leave"
  | "voice"
  | "start"
  | "ready";

export function useUISound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  const play = useCallback((type: UISoundType) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      switch (type) {
        case "hover": {
          // Soft high-frequency tick
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(1500, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

          gain.gain.setValueAtTime(0.015, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }
        case "click": {
          // Round organic popping bubble
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.07);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.07);
          break;
        }
        case "select": {
          // Dynamic ascending double pulse
          const playPulse = (delay: number, freq: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + delay);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + delay + 0.05);

            gain.gain.setValueAtTime(0.05, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.05);
          };
          playPulse(0, 350);
          playPulse(0.06, 490);
          break;
        }
        case "invite": {
          // Sliding swipe sound (ascending sine sweep)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.06, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }
        case "join": {
          // Uplifting success chime
          const playNote = (delay: number, freq: number, dur: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0.04, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + dur);
          };
          playNote(0, 523.25, 0.12); // C5
          playNote(0.05, 659.25, 0.15); // E5
          playNote(0.1, 783.99, 0.18); // G5
          playNote(0.15, 1046.50, 0.25); // C6
          break;
        }
        case "leave": {
          // Soft descending exit pitch
          const playNote = (delay: number, freq: number, dur: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0.04, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + dur);
          };
          playNote(0, 783.99, 0.12); // G5
          playNote(0.05, 659.25, 0.15); // E5
          playNote(0.1, 523.25, 0.18); // C5
          break;
        }
        case "voice": {
          // Soft high quality toggle click
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }
        case "start": {
          // Low cinematic deep whoosh
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(50, now);
          osc.frequency.exponentialRampToValueAtTime(130, now + 0.55);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.55);
          break;
        }
        case "ready": {
          // Sweet chime notification
          const playChime = (delay: number, freq: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0.05, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.22);
          };
          playChime(0, 880); // A5
          playChime(0.07, 1109); // C#6
          break;
        }
      }
    } catch (e) {
      console.warn("Failed to play UI sound", e);
    }
  }, []);

  return { play };
}
