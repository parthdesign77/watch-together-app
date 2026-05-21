import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Pause, PictureInPicture2, Play, RefreshCw, SkipBack, Volume2, Video, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { updatePlayback } from "../../hooks/useRooms";
import type { WatchRoom, Participant } from "../../types";
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
  participants?: Participant[];
  onVideoEnded?: () => void;
}


function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function youtubeEmbed(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0` : url;
}

export function VideoStage({ room, isHost, screenStream, remoteScreenStream, cameraFeeds = [], participants = [], onVideoEnded }: VideoStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [volume, setVolume] = useState(0.86);
  const [drift, setDrift] = useState(0);
  const [hovered, setHovered] = useState(false);
  const activeScreenStream = screenStream || remoteScreenStream || null;
  const hasVideo = Boolean(room.videoUrl);
  const hasActiveMedia = Boolean(
    activeScreenStream || (hasVideo && room.status !== "waiting" && room.status !== "ended")
  );

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
      ref={stageRef}
      className={
        hasActiveMedia
          ? `relative w-full overflow-hidden rounded-[24px] border border-white/5 bg-[#090909] shadow-2xl transition-all duration-300 ${
              room.theaterMode ? "min-h-[75vh]" : "aspect-video"
            }`
          : "relative w-full flex items-center justify-center transition-all duration-300"
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      

      {activeScreenStream ? (
        <StreamVideo stream={activeScreenStream} muted={true} className="h-full w-full object-contain" />
      ) : (!room.videoUrl || room.status === "waiting" || room.status === "ended") ? (
        <div className="w-full flex items-center justify-center py-4">
          <div className="flex flex-wrap gap-6 items-center justify-center max-w-full mx-auto">
            {participants.map((p) => {
              const feed = cameraFeeds.find((f) => f.id.startsWith(p.uid));
              const isSpeaking = p.isSpeaking;
              
              return (
                <motion.div
                  layout
                  key={p.uid}
                  style={{
                    background: `linear-gradient(to bottom, ${(p.avatarColor || "#ff3d47")}22, #121216)`
                  }}
                  className={`relative flex flex-col items-center justify-center rounded-[36px] overflow-hidden border backdrop-blur-md shadow-2xl transition-all duration-500 ease-out ${
                    feed
                      ? "aspect-video w-full max-w-[320px] sm:max-w-[400px] md:max-w-[480px]"
                      : "aspect-square w-[200px] sm:w-[260px] md:w-[300px]"
                  } ${
                    isSpeaking 
                      ? "border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02]" 
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {feed ? (
                      <motion.div
                        key="camera"
                        initial={{ opacity: 0, scale: 0.95, rotateY: 90 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, scale: 0.95, rotateY: -90 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 w-full h-full rounded-[36px] overflow-hidden"
                      >
                        <StreamVideo stream={feed.stream} muted={feed.muted} className="w-full h-full object-cover" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="avatar"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center space-y-4"
                      >
                        <div
                          className={`relative h-24 w-24 sm:h-28 sm:w-28 rounded-full flex items-center justify-center border-2 bg-neutral-900 text-3xl sm:text-4xl font-black text-white transition-all duration-300 ${
                            isSpeaking 
                              ? "border-emerald-400 ring-4 ring-emerald-500/20 scale-105" 
                              : "border-white/10"
                          }`}
                          style={{ backgroundColor: p.avatar ? undefined : (p.avatarColor || "#ff3d47") }}
                        >
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            p.name.slice(0, 2).toUpperCase()
                          )}
                          {isSpeaking && (
                            <div className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Name tag and microphone status */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#090909]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 max-w-[85%] z-20">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
                      <span className="truncate max-w-[80px]">{p.name}</span>
                      {p.isHost && (
                        <span className="bg-[#ff3d47]/20 text-[#ff3d47] text-[8px] px-1 py-0.2 rounded font-black uppercase tracking-wider border border-[#ff3d47]/30 flex-shrink-0">
                          Host
                        </span>
                      )}
                    </span>
                    {p.isMuted ? (
                      <MicOff className="h-3 w-3 text-red-500 flex-shrink-0" />
                    ) : (
                      <Mic className={`h-3 w-3 flex-shrink-0 ${isSpeaking ? "text-emerald-400 animate-bounce" : "text-neutral-400"}`} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : isYouTube(room.videoUrl) ? (
        <iframe
          title={room.roomName}
          src={youtubeEmbed(room.videoUrl)}
          className="h-full w-full border-none"
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
          onEnded={() => {
            if (isHost) {
              void updatePlayback(room.id, { isPlaying: false, status: "ended" });
            }
            onVideoEnded?.();
          }}
        />
      )}

      {/* Badges Overlays */}
      {hasActiveMedia && (
        <div className="pointer-events-none absolute left-5 top-5 flex flex-wrap gap-2 z-30">
          <Badge className="bg-purple-600 text-white border-none font-bold text-[10px] px-2 py-0.5 rounded">
            {room.quality}
          </Badge>
          {drift > 0.5 ? (
            <Badge className="bg-amber-600 text-white border-none font-bold text-[10px] px-2 py-0.5 rounded">
              Drift {drift.toFixed(1)}s
            </Badge>
          ) : (
            <Badge className="bg-emerald-600 text-white border-none font-bold text-[10px] px-2 py-0.5 rounded">
              IN SYNC
            </Badge>
          )}
        </div>
      )}

      {(activeScreenStream || (hasVideo && room.status !== "waiting")) && cameraFeeds.length ? <CameraStage feeds={cameraFeeds} screenShareActive containerRef={stageRef} /> : null}

      <AnimatePresence>
        {(hovered || !room.isPlaying) && !isYouTube(room.videoUrl) && !activeScreenStream && (room.videoUrl && room.status !== "waiting") ? (
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-5 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff3d47] via-[#ff3d47]/80 to-[#ff3d47]"
                style={{
                  width: `${Math.min(100, ((videoRef.current?.currentTime || room.currentTime) / (videoRef.current?.duration || 1)) * 100)}%`
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="secondary" size="icon" disabled={!isHost} onClick={() => void seekBy(-10)} aria-label="Back 10 seconds" className="bg-neutral-800 hover:bg-neutral-700 text-white border border-white/5 rounded-xl h-10 w-10">
                <SkipBack className="h-4.5 w-4.5" />
              </Button>
              <Button
                disabled={!isHost}
                onClick={() => {
                  if (videoRef.current) {
                    if (room.isPlaying) {
                      videoRef.current.pause();
                    } else {
                      void videoRef.current.play().catch(() => undefined);
                    }
                  } else {
                    void syncPlayback(!room.isPlaying);
                  }
                }}
                className="bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white rounded-xl h-10 px-4 flex items-center gap-1.5 font-bold"
              >
                {room.isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
                {room.isPlaying ? "Pause" : "Play"}
              </Button>
              <Button variant="secondary" onClick={resync} className="bg-neutral-800 hover:bg-neutral-700 text-white border border-white/5 rounded-xl h-10 px-4 flex items-center gap-1.5 font-semibold">
                <RefreshCw className="h-4 w-4" />
                Resync
              </Button>
              
              <label className="ml-auto hidden sm:flex items-center gap-2 text-sm text-neutral-300 bg-neutral-800/80 backdrop-blur px-3 py-1.5 rounded-xl border border-white/5 h-10">
                <Volume2 className="h-4 w-4 text-neutral-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="w-24 accent-[#ff3d47] cursor-pointer"
                />
              </label>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => videoRef.current?.requestPictureInPicture?.()}
                aria-label="Picture in picture"
                className="hover:bg-white/5 text-neutral-300 rounded-xl h-10 w-10 flex items-center justify-center"
              >
                <PictureInPicture2 className="h-4.5 w-4.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => videoRef.current?.requestFullscreen()} aria-label="Fullscreen" className="hover:bg-white/5 text-neutral-300 rounded-xl h-10 w-10 flex items-center justify-center">
                <Maximize2 className="h-4.5 w-4.5" />
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
