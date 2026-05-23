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
  | "fullscreen-exit"
  | "open-card"
  | "mic-mute"
  | "mic-unmute"
  | "camera-on"
  | "camera-off"
  | "screenshare-start"
  | "screenshare-stop"
  | "deafen"
  | "undeafen";

// Global, module-level singleton AudioContext to prevent browser limit crashes and optimize responsiveness
let globalAudioCtx: AudioContext | null = null;
let lastSoundPlayedTime = 0;

export function useUISound() {
  const getAudioContext = (): AudioContext => {
    if (!globalAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      globalAudioCtx = new AudioCtxClass();

      // Intercept and scale gain values dynamically on mobile viewports to make sound effects soft and quiet
      const originalCreateGain = globalAudioCtx.createGain.bind(globalAudioCtx);
      globalAudioCtx.createGain = () => {
        const gainNode = originalCreateGain();
        
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
        const volScale = isMobileDevice ? 0.25 : 1.0;

        const originalSetValueAtTime = gainNode.gain.setValueAtTime.bind(gainNode.gain);
        gainNode.gain.setValueAtTime = (value: number, time: number) => {
          return originalSetValueAtTime(value * volScale, time);
        };

        const originalLinearRampToValueAtTime = gainNode.gain.linearRampToValueAtTime.bind(gainNode.gain);
        gainNode.gain.linearRampToValueAtTime = (value: number, time: number) => {
          return originalLinearRampToValueAtTime(value * volScale, time);
        };

        const originalExponentialRampToValueAtTime = gainNode.gain.exponentialRampToValueAtTime.bind(gainNode.gain);
        gainNode.gain.exponentialRampToValueAtTime = (value: number, time: number) => {
          return originalExponentialRampToValueAtTime(value * volScale, time);
        };

        return gainNode;
      };
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  };

  const play = useCallback((type: UISoundType) => {
    try {
      // Mute system sounds if deafened, EXCEPT for the toggle actions
      const isDeafened = localStorage.getItem("deafened") === "true";
      if (isDeafened && type !== "deafen" && type !== "undeafen") {
        return;
      }

      const nowTime = Date.now();
      if (nowTime - lastSoundPlayedTime < 50) {
        return;
      }
      lastSoundPlayedTime = nowTime;

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
        case "open-card": {
          // Ascending major arpeggio synth chime
          const playChime = (delay: number, freq: number, volume: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(volume, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.3);
          };
          playChime(0, 440, 0.04); // A4
          playChime(0.06, 554.37, 0.04); // C#5
          playChime(0.12, 659.25, 0.05); // E5
          break;
        }
        case "mic-mute": {
          // Discord-style descending mute tone
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          const gain2 = ctx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(440, now);
          osc1.frequency.exponentialRampToValueAtTime(320, now + 0.08);
          gain1.gain.setValueAtTime(0.06, now);
          gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

          osc2.type = "sine";
          osc2.frequency.setValueAtTime(320, now + 0.05);
          osc2.frequency.exponentialRampToValueAtTime(220, now + 0.15);
          gain2.gain.setValueAtTime(0.05, now + 0.05);
          gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

          osc1.connect(gain1);
          osc2.connect(gain2);
          gain1.connect(ctx.destination);
          gain2.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now + 0.05);
          osc1.stop(now + 0.08);
          osc2.stop(now + 0.15);
          break;
        }
        case "mic-unmute": {
          // Discord-style ascending unmute tone
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          const gain2 = ctx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(320, now);
          osc1.frequency.exponentialRampToValueAtTime(440, now + 0.08);
          gain1.gain.setValueAtTime(0.05, now);
          gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

          osc2.type = "sine";
          osc2.frequency.setValueAtTime(440, now + 0.05);
          osc2.frequency.exponentialRampToValueAtTime(600, now + 0.15);
          gain2.gain.setValueAtTime(0.06, now + 0.05);
          gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

          osc1.connect(gain1);
          osc2.connect(gain2);
          gain1.connect(ctx.destination);
          gain2.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now + 0.05);
          osc1.stop(now + 0.08);
          osc2.stop(now + 0.15);
          break;
        }
        case "camera-on": {
          // Warm ascending chime
          const playChime = (delay: number, freq: number, vol: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(vol, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.25);
          };
          playChime(0, 523.25, 0.04); // C5
          playChime(0.05, 659.25, 0.04); // E5
          playChime(0.1, 783.99, 0.05); // G5
          break;
        }
        case "camera-off": {
          // Warm descending chime
          const playChime = (delay: number, freq: number, vol: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(vol, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.25);
          };
          playChime(0, 783.99, 0.05); // G5
          playChime(0.05, 659.25, 0.04); // E5
          playChime(0.1, 523.25, 0.04); // C5
          break;
        }
        case "screenshare-start": {
          // futuristic tech dual beep
          const playPulse = (delay: number, freq: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0.05, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.15);
          };
          playPulse(0, 880); // A5
          playPulse(0.07, 1318.51); // E6
          break;
        }
        case "screenshare-stop": {
          // futuristic descending chime
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(1318.51, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case "deafen": {
          // Premium, rich descending chime (D5 -> B4 -> G4) with warm harmonics
          const playChimeNote = (delay: number, freq: number, dur: number) => {
            const oscSine = ctx.createOscillator();
            const oscTri = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            oscSine.type = "sine";
            oscSine.frequency.setValueAtTime(freq, now + delay);

            oscTri.type = "triangle";
            // Soft harmonic at double frequency (one octave up) for acoustic richness
            oscTri.frequency.setValueAtTime(freq * 2, now + delay);

            // Clean click-free envelope: 10ms attack, smooth exponential decay
            gain.gain.setValueAtTime(0.0001, now + delay);
            gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

            // Shape the tone to make it sound extra soft and rounded
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(freq * 1.6, now + delay);

            oscSine.connect(gain);
            oscTri.connect(gain);
            gain.connect(filter);
            filter.connect(ctx.destination);

            oscSine.start(now + delay);
            oscTri.start(now + delay);
            oscSine.stop(now + delay + dur);
            oscTri.stop(now + delay + dur);
          };

          playChimeNote(0, 587.33, 0.20); // D5
          playChimeNote(0.08, 493.88, 0.20); // B4
          playChimeNote(0.16, 392.00, 0.35); // G4
          break;
        }
        case "undeafen": {
          // Premium, rich ascending chime (G4 -> B4 -> D5) with warm harmonics
          const playChimeNote = (delay: number, freq: number, dur: number) => {
            const oscSine = ctx.createOscillator();
            const oscTri = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            oscSine.type = "sine";
            oscSine.frequency.setValueAtTime(freq, now + delay);

            oscTri.type = "triangle";
            // Soft harmonic at double frequency (one octave up) for acoustic richness
            oscTri.frequency.setValueAtTime(freq * 2, now + delay);

            // Clean click-free envelope: 10ms attack, smooth exponential decay
            gain.gain.setValueAtTime(0.0001, now + delay);
            gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

            // Shape the tone to make it sound extra soft and rounded
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(freq * 1.6, now + delay);

            oscSine.connect(gain);
            oscTri.connect(gain);
            gain.connect(filter);
            filter.connect(ctx.destination);

            oscSine.start(now + delay);
            oscTri.start(now + delay);
            oscSine.stop(now + delay + dur);
            oscTri.stop(now + delay + dur);
          };

          playChimeNote(0, 392.00, 0.20); // G4
          playChimeNote(0.08, 493.88, 0.20); // B4
          playChimeNote(0.16, 587.33, 0.35); // D5
          break;
        }
      }
    } catch (e) {
      console.warn("Failed to play UI sound", e);
    }
  }, []);

  return { play };
}
