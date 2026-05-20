import { useEffect, useRef } from "react";

export function StreamAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline />;
}
