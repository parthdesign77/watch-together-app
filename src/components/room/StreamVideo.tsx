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
    const video = videoRef.current;
    if (!video || !stream) return;

    // Bind the media stream directly to the video element
    video.srcObject = stream;

    const attemptPlay = () => {
      if (video.paused) {
        video.play().then(() => {
          console.log("[Video] Playback successfully started.");
          cleanupListeners();
        }).catch((err) => {
          console.warn("[Video] Play attempt failed or was interrupted:", err);
        });
      }
    };

    const cleanupListeners = () => {
      window.removeEventListener("click", attemptPlay);
      window.removeEventListener("touchstart", attemptPlay);
    };

    // First attempt immediately
    attemptPlay();

    // Register fallback listeners for user-gesture activation (mobile autoplay bypass)
    window.addEventListener("click", attemptPlay);
    window.addEventListener("touchstart", attemptPlay);

    return () => {
      cleanupListeners();
    };
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
