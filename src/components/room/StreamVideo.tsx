import { useEffect, useRef } from "react";

interface StreamVideoProps {
  stream: MediaStream | null;
  muted?: boolean;
  volume?: number;
  className?: string;
}

export function StreamVideo({ stream, muted = false, volume = 1.0, className = "" }: StreamVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Bind the media stream directly to the video element
      videoRef.current.srcObject = stream;
      
      if (stream) {
        // Explicitly trigger play to kick off rendering safely
        videoRef.current.play().catch((err) => {
          console.warn("[Video] AutoPlay failed or was interrupted:", err);
        });
      }
    }
  }, [stream]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
      style={{ width: "100%", height: "100%", display: "block", backgroundColor: "#000" }}
    />
  );
}
