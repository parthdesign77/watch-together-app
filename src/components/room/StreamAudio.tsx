import { useEffect, useRef } from "react";
import { useUiStore } from "../../store/uiStore";

export function StreamAudio({ stream, uid }: { stream: MediaStream | null; uid?: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const audioOutputDeviceId = useUiStore((state) => state.audioOutputDeviceId);
  const masterVolume = useUiStore((state) => state.masterVolume);
  const participantVolume = useUiStore((state) => (uid ? state.participantVolumes[uid] : undefined) ?? 1);
  const deafened = useUiStore((state) => state.deafened);

  useEffect(() => {
    const audioElement = ref.current;
    if (!audioElement || !stream) return;

    // Only assign srcObject if the underlying tracks have actually changed, to prevent audio silencing or autoplay blockage
    const currentStream = audioElement.srcObject as MediaStream | null;
    let isSame = false;
    if (currentStream && stream) {
      const currentTracks = currentStream.getTracks();
      const newTracks = stream.getTracks();
      if (currentTracks.length === newTracks.length) {
        isSame = currentTracks.every((track, i) => track === newTracks[i]);
      }
    }

    if (!isSame) {
      console.log("[Audio] Re-binding srcObject to stream", stream.id);
      audioElement.srcObject = stream;
    }

    const playAudio = () => {
      audioElement.play().catch((error) => {
        if (
          error.name === "NotAllowedError" ||
          error.name === "NotSupportedError" ||
          error.name === "AbortError"
        ) {
          console.warn(`[Autoplay Blocked] Audio silenced for participant ${uid || "remote"}. Awaiting user interaction.`);

          // Define user gesture unlock triggers
          const unlockAudio = () => {
            audioElement.play()
              .then(() => {
                console.log(`[Autoplay Recovered] Audio recovered for participant ${uid || "remote"}`);
                cleanupInteractionListeners();
              })
              .catch((err) => console.error("Interaction recovery failed:", err));
          };

          const cleanupInteractionListeners = () => {
            document.removeEventListener("click", unlockAudio);
            document.removeEventListener("keydown", unlockAudio);
            document.removeEventListener("touchstart", unlockAudio);
          };

          // Listen for any safe user actions anywhere on the document (passive true for smooth scroll)
          document.addEventListener("click", unlockAudio, { passive: true });
          document.addEventListener("keydown", unlockAudio, { passive: true });
          document.addEventListener("touchstart", unlockAudio, { passive: true });
        } else {
          console.error("[Audio] General play error:", error);
        }
      });
    };

    playAudio();

    return () => {
      audioElement.srcObject = null;
    };
  }, [stream, uid]);

  // Handle master volume and individual participant volumes dynamically
  useEffect(() => {
    if (ref.current) {
      ref.current.volume = deafened ? 0 : masterVolume * participantVolume;
      ref.current.muted = deafened; // Explicit iOS Webkit & Android Chrome mute override
    }
  }, [masterVolume, participantVolume, deafened]);

  // Handle custom audio output device selection (Speakers, Headphones)
  useEffect(() => {
    const audioElement = ref.current as any;
    if (audioElement && audioOutputDeviceId && stream) {
      if (typeof audioElement.setSinkId === "function") {
        audioElement.setSinkId(audioOutputDeviceId).catch((err: any) => {
          console.error("Error setting sink ID (audio output device):", err);
        });
      }
    }
  }, [audioOutputDeviceId, stream]);

  return (
    <audio
      ref={ref}
      autoPlay
      playsInline
      style={{
        position: "absolute",
        opacity: 0,
        pointerEvents: "none",
        width: 0,
        height: 0
      }}
    />
  );
}
