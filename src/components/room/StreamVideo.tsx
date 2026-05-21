import { useEffect, useRef } from "react";

interface StreamVideoProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}

export function StreamVideo({ stream, muted = false, className = "" }: StreamVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      if (stream) {
        ref.current.play().catch((err) => {
          console.warn("StreamVideo autoplay failed or was interrupted:", err);
        });
      }
    }
  }, [stream]);

  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}
