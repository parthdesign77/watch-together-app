import { useCallback } from "react";

export type UISoundType =
  | "hover"
  | "click"
  | "select"
  | "invite"
  | "join"
  | "leave"
  | "voice"
  | "start"
  | "ready"
  | "fullscreen-enter"
  | "fullscreen-exit";

// Global, module-level singleton AudioContext to prevent browser limit crashes and optimize responsiveness
let globalAudioCtx: AudioContext | null = null;

export function useUISound() {
  const getAudioContext = (): AudioContext => {
    if (!globalAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      globalAudioCtx = new AudioCtxClass();
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  };

  const play = useCallback((type: UISoundType) => {
    try {
      const isMobile = typeof window !== "undefined" && (window.matchMedia("(max-width: 1024px)").matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
      if (isMobile) return;

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
        case "fullscreen-enter": {
          // Futuristic sweep up and space expansion chime
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(250, now);
          osc1.frequency.exponentialRampToValueAtTime(750, now + 0.45);

          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(150, now);
          osc2.frequency.exponentialRampToValueAtTime(450, now + 0.45);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.45);
          osc2.stop(now + 0.45);
          break;
        }
        case "fullscreen-exit": {
          // Decelerating slide down chime
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(650, now);
          osc1.frequency.exponentialRampToValueAtTime(220, now + 0.35);

          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(350, now);
          osc2.frequency.exponentialRampToValueAtTime(120, now + 0.35);

          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.35);
          osc2.stop(now + 0.35);
          break;
        }
      }
    } catch (e) {
      console.warn("Failed to play UI sound", e);
    }
  }, []);

  return { play };
}
