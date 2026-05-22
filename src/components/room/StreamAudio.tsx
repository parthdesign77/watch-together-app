import { useEffect, useRef } from "react";
import { useUiStore } from "../../store/uiStore";

export function StreamAudio({ stream, uid }: { stream: MediaStream; uid?: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const audioOutputDeviceId = useUiStore((state) => state.audioOutputDeviceId);
  const masterVolume = useUiStore((state) => state.masterVolume);
  const participantVolume = useUiStore((state) => (uid ? state.participantVolumes[uid] : undefined) ?? 1);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      
      const playAudio = () => {
        ref.current?.play().catch((err) => {
          console.warn("Autoplay blocked for audio stream:", err);
          const retryPlay = () => {
            ref.current?.play().then(() => {
              document.removeEventListener("click", retryPlay);
              document.removeEventListener("keydown", retryPlay);
            }).catch(e => console.error("Retry play failed:", e));
          };
          document.addEventListener("click", retryPlay);
          document.addEventListener("keydown", retryPlay);
        });
      };
      
      playAudio();
    }
  }, [stream]);

  useEffect(() => {
    if (ref.current) {
      ref.current.volume = masterVolume * participantVolume;
    }
  }, [masterVolume, participantVolume]);

  useEffect(() => {
    const audioElement = ref.current as any;
    if (audioElement && audioOutputDeviceId) {
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

