import { useEffect, useRef } from "react";

interface StreamVideoProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}

export function StreamVideo({ stream, muted = false, className = "" }: StreamVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}
