import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Pause, PictureInPicture2, Play, RefreshCw, SkipBack, Volume2, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { updatePlayback } from "../../hooks/useRooms";
import type { WatchRoom } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CameraFeed, CameraStage } from "./CameraStage";
import { StreamVideo } from "./StreamVideo";

interface VideoStageProps {
  room: WatchRoom;
  isHost: boolean;
  screenStream?: MediaStream | null;
  remoteScreenStream?: MediaStream | null;
  cameraFeeds?: CameraFeed[];
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function youtubeEmbed(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0` : url;
}

export function VideoStage({ room, isHost, screenStream, remoteScreenStream, cameraFeeds = [] }: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [volume, setVolume] = useState(0.86);
  const [drift, setDrift] = useState(0);
  const [hovered, setHovered] = useState(false);
  const activeScreenStream = screenStream || remoteScreenStream || null;
  const hasVideo = Boolean(room.videoUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeScreenStream || isYouTube(room.videoUrl) || !hasVideo) return;

    let cancelled = false;
    let hls: any = null;

    if (room.videoUrl.endsWith(".m3u8")) {
      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls({ lowLatencyMode: true, enableWorker: true });
          hls.loadSource(room.videoUrl);
          hls.attachMedia(video);

          // Listen to manifest and restrict current quality levels based on subscription limits
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!hls) return;
            const targetHeight = room.quality === "1080p" ? 1080 : room.quality === "720p" ? 720 : 480;
            let bestLevel = 0;
            let closestDiff = Infinity;
            hls.levels.forEach((level: any, idx: number) => {
              if (level.height && level.height <= targetHeight) {
                const diff = targetHeight - level.height;
                if (diff < closestDiff) {
                  closestDiff = diff;
                  bestLevel = idx;
                }
              }
            });
            hls.currentLevel = bestLevel;
          });
        } else {
          video.src = room.videoUrl;
        }
      });

      return () => {
        cancelled = true;
        hls?.destroy();
      };
    }

    video.src = room.videoUrl;
  }, [activeScreenStream, room.videoUrl, room.quality, hasVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isHost || activeScreenStream || isYouTube(room.videoUrl)) return;

    const difference = Math.abs(video.currentTime - room.currentTime);
    setDrift(difference);

    if (difference > 1.4) {
      video.currentTime = room.currentTime;
    }

    if (room.isPlaying && video.paused) {
      void video.play().catch(() => undefined);
    }

    if (!room.isPlaying && !video.paused) {
      video.pause();
    }
  }, [activeScreenStream, isHost, room.currentTime, room.isPlaying, room.videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  async function syncPlayback(isPlaying: boolean) {
    const currentTime = videoRef.current?.currentTime || room.currentTime;
    await updatePlayback(room.id, {
      isPlaying,
      currentTime,
      status: isPlaying ? "watching" : "paused"
    });
  }

  async function resync() {
    const video = videoRef.current;
    if (video) {
      video.currentTime = room.currentTime;
      if (room.isPlaying) await video.play().catch(() => undefined);
    }
  }

  async function seekBy(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime + seconds);
    await updatePlayback(room.id, {
      currentTime: video.currentTime,
      isPlaying: !video.paused,
      status: video.paused ? "paused" : "watching"
    });
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl ${
        room.theaterMode ? "min-h-[72vh]" : "aspect-video"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {activeScreenStream ? (
        <StreamVideo stream={activeScreenStream} muted={Boolean(screenStream)} className="h-full w-full object-contain" />
      ) : !hasVideo ? (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center select-none bg-black/60 bg-radial-dots">
          <div className="h-16 w-16 rounded-full bg-red-600/10 text-red-500 flex items-center justify-center animate-pulse mb-4 border border-red-500/20">
            <Video className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="font-display text-xl font-bold text-snow">Camera Sync Mode</h3>
          <p className="text-xs text-muted max-w-sm mt-2">
            No movie is playing yet. {isHost ? "Choose a movie using the 'Select Movie' button, or turn on your camera!" : "Wait for the host to select a movie, or turn on your camera to chat!"}
          </p>
        </div>
      ) : isYouTube(room.videoUrl) ? (
        <iframe
          title={room.roomName}
          src={youtubeEmbed(room.videoUrl)}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          playsInline
          onPlay={() => isHost && void syncPlayback(true)}
          onPause={() => isHost && void syncPlayback(false)}
          onSeeking={() => isHost && void updatePlayback(room.id, { currentTime: videoRef.current?.currentTime || 0 })}
        />
      )}

      <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
        <Badge tone={room.isScreenSharing ? "red" : room.isPlaying ? "green" : "cyan"}>
          {room.isScreenSharing ? "LIVE SCREEN" : room.status}
        </Badge>
        <Badge tone="purple">{room.quality}</Badge>
        {drift > 0.5 ? <Badge tone="orange">Drift {drift.toFixed(1)}s</Badge> : <Badge tone="green">In sync</Badge>}
        <Badge tone="muted">Audio layers: content + voice</Badge>
        <Badge tone="muted">Adaptive bitrate</Badge>
      </div>

      {activeScreenStream && cameraFeeds.length ? <CameraStage feeds={cameraFeeds} screenShareActive /> : null}

      <AnimatePresence>
        {(hovered || !room.isPlaying) && !isYouTube(room.videoUrl) && !activeScreenStream ? (
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 to-transparent p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/18">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan via-premium to-movie"
                style={{
                  width: `${Math.min(100, ((videoRef.current?.currentTime || room.currentTime) / (videoRef.current?.duration || 1)) * 100)}%`
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="icon" disabled={!isHost} onClick={() => void seekBy(-10)} aria-label="Back 10 seconds">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button disabled={!isHost} onClick={() => void syncPlayback(!room.isPlaying)}>
                {room.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                {room.isPlaying ? "Pause" : "Play"}
              </Button>
              <Button variant="secondary" onClick={resync}>
                <RefreshCw className="h-4 w-4" />
                Resync
              </Button>
              <label className="ml-auto flex items-center gap-2 text-sm text-muted">
                <Volume2 className="h-4 w-4" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="w-28 accent-cyan"
                />
              </label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => videoRef.current?.requestPictureInPicture?.()}
                aria-label="Picture in picture"
              >
                <PictureInPicture2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => videoRef.current?.requestFullscreen()} aria-label="Fullscreen">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
