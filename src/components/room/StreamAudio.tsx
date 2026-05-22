import { useEffect, useRef } from "react";

export function StreamAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement | null>(null);

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

  return <audio ref={ref} autoPlay playsInline style={{ display: "none" }} />;
}

