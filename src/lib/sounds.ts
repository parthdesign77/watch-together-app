// Web Audio API Synthesizer for low-latency modern UI click sounds
let sharedAudioCtx: AudioContext | null = null;
let sharedMasterGain: GainNode | null = null;

function getSharedCtx() {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return { ctx: null, masterGain: null };
    
    try {
      sharedAudioCtx = new AudioContextClass();
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
      const volScale = isMobileDevice ? 0.65 : 1.0;
      
      sharedMasterGain = sharedAudioCtx.createGain();
      sharedMasterGain.gain.setValueAtTime(volScale, sharedAudioCtx.currentTime);
      sharedMasterGain.connect(sharedAudioCtx.destination);
    } catch (e) {
      console.warn("Failed to create shared AudioContext:", e);
      return { ctx: null, masterGain: null };
    }
  }
  
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  
  return { ctx: sharedAudioCtx, masterGain: sharedMasterGain };
}

export function playSound(type: "click" | "success" | "danger" | "toggle" | "pop") {
  try {
    const { ctx, masterGain } = getSharedCtx();
    if (!ctx || !masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);

    const now = ctx.currentTime;

    if (type === "click") {
      // Short organic low-latency click/blip
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (type === "success") {
      // High-pitched double chirp (ascending)
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.setValueAtTime(0.06, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (type === "danger") {
      // Warm sliding drop sound
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.18);
      // Lowpass filter to soften the sawtooth
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, now);
      osc.disconnect(gain);
      osc.connect(filter);
      filter.connect(gain);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.185);
    } else if (type === "toggle") {
      // Pleasant popping sound with quick pitch slide
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.065);
    } else if (type === "pop") {
      // Soft round popping bubble sound
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.055);
    }
  } catch (error) {
    // Fail silently if browser blocks autoplay / audio context is not allowed without user gesture
    console.warn("UI Sound blocked or unsupported:", error);
  }
}
