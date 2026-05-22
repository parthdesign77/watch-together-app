import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2, Pause, PictureInPicture2, Play, RefreshCw, SkipBack, Volume2, Video, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { updatePlayback } from "../../hooks/useRooms";
import type { WatchRoom, Participant } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CameraFeed, CameraStage } from "./CameraStage";
import { StreamVideo } from "./StreamVideo";
import { useUISound } from "../../hooks/useUISound";
import { useAuth } from "../../context/AuthContext";

interface VideoStageProps {
  room: WatchRoom;
  isHost: boolean;
  screenStream?: MediaStream | null;
  remoteScreenStream?: MediaStream | null;
  cameraFeeds?: CameraFeed[];
  participants?: Participant[];
  onVideoEnded?: () => void;
  cinemaMode?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isMobile?: boolean;
}


function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function youtubeEmbed(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0` : url;
}

export function VideoStage({ room, isHost, screenStream, remoteScreenStream, cameraFeeds = [], participants = [], onVideoEnded, cinemaMode = false, isFullscreen = false, onToggleFullscreen, isMobile = false }: VideoStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { play } = useUISound();
  const { profile } = useAuth();
  const [volume, setVolume] = useState(0.86);
  const [screenShareVolume, setScreenShareVolume] = useState(0.86);
  const [drift, setDrift] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [objectFit, setObjectFit] = useState<'contain' | 'cover'>('contain');
  const lastTap = useRef<number>(0);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("label") || target.closest("a")) {
      return;
    }
    
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setObjectFit((prev) => (prev === 'contain' ? 'cover' : 'contain'));
      setShowZoomIndicator(true);
      play("select");
    }
    lastTap.current = now;
  };

  useEffect(() => {
    if (showZoomIndicator) {
      const timer = setTimeout(() => setShowZoomIndicator(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showZoomIndicator, objectFit]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu]);
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
              room.theaterMode 
                ? "min-h-[75vh]" 
                : (activeScreenStream || cinemaMode)
                  ? "h-full flex-1 min-h-0" 
                  : "aspect-video"
            }`
          : "relative w-full min-h-[50vh] flex items-center justify-center py-12 transition-all duration-300"
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleDoubleTap}
    >
      

      {activeScreenStream ? (
        <div
          className="relative h-full w-full"
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
            play("click");
          }}
        >
          <StreamVideo
            stream={activeScreenStream}
            muted={Boolean(screenStream)}
            volume={Boolean(screenStream) ? 0 : screenShareVolume}
            className={`h-full w-full ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
          />
          {hovered && (
            <div className="absolute right-5 bottom-5 z-30 flex items-center gap-2.5">
              {!screenStream && (
                <label className="flex items-center gap-2 text-sm text-neutral-300 bg-[#090909]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 h-10 shadow-lg select-none">
                  <Volume2 className="h-4 w-4 text-neutral-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={screenShareVolume}
                    onChange={(event) => setScreenShareVolume(Number(event.target.value))}
                    className="w-24 accent-[#ff3d47] cursor-pointer"
                  />
                </label>
              )}
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
                  play("click");
                  if (onToggleFullscreen) {
                    onToggleFullscreen();
                  } else if (stageRef.current) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => undefined);
                    } else {
                      stageRef.current.requestFullscreen().catch((err) => {
                        console.error("Failed to enter fullscreen:", err);
                      });
                    }
                  }
                }}
                className="bg-black/60 hover:bg-[#ff3d47] text-white border border-white/10 rounded-xl h-10 w-10 flex items-center justify-center backdrop-blur-md shadow-lg transition-all"
                aria-label="Fullscreen screen share"
              >
                {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
              </Button>
            </div>
          )}
        </div>
      ) : (!room.videoUrl || room.status === "waiting" || room.status === "ended") ? (
        <div className="w-full flex items-center justify-center py-4">
          <div className="flex flex-wrap gap-3 sm:gap-6 items-center justify-center w-full max-w-full mx-auto">
            {participants.map((p) => {
              const isLocal = profile && p.uid === profile.uid;
              const isSharing = p.isScreenSharing;
              const screenFeed = isSharing ? (isLocal ? screenStream : (p.uid === room.screenShareHost ? remoteScreenStream : null)) : null;
              
              const feed = cameraFeeds.find((f) => f.id.startsWith(p.uid));
              const isSpeaking = p.isSpeaking;
              
              return (
                <motion.div
                  key={p.uid}
                  style={{
                    background: `linear-gradient(to bottom, ${(p.avatarColor || "#ff3d47")}22, #121216)`
                  }}
                  className={`participant-card relative flex flex-col items-center justify-center rounded-[20px] sm:rounded-[36px] overflow-hidden border backdrop-blur-md shadow-2xl transition-[border-color,box-shadow] duration-200 ${
                    (feed || screenFeed)
                      ? "aspect-video w-full max-w-[92%] sm:w-[400px] md:w-[480px]"
                      : "aspect-square w-[46%] max-w-[180px] sm:w-[260px] md:w-[300px]"
                  } ${
                    isSpeaking 
                      ? "speaking border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {screenFeed ? (
                      <motion.div
                        key="screen"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 w-full h-full rounded-[inherit] overflow-hidden bg-black"
                      >
                        <StreamVideo stream={screenFeed} muted={true} className="w-full h-full object-contain animate-fade-in" />
                      </motion.div>
                    ) : feed ? (
                      <motion.div
                        key="camera"
                        initial={{ opacity: 0, scale: 0.95, rotateY: 90 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, scale: 0.95, rotateY: -90 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 w-full h-full rounded-[inherit] overflow-hidden"
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
                          className={`relative h-16 w-16 sm:h-28 sm:w-28 rounded-full flex items-center justify-center border-2 bg-neutral-900 text-xl sm:text-4xl font-black text-white transition-all duration-300 ${
                            isSpeaking 
                              ? "border-emerald-400 ring-4 ring-emerald-500/20" 
                              : "border-white/10"
                          }`}
                          style={{ backgroundColor: p.avatar ? undefined : (p.avatarColor || "#ff3d47") }}
                        >
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name || "Guest"} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            (p.name || "Guest").slice(0, 2).toUpperCase()
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
 
                  {/* Name tag and microphone status */}
                  <div className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 flex items-center gap-1.5 sm:gap-2 bg-[#090909]/85 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/5 max-w-[88%] z-20">
                    <span className="text-[10px] sm:text-[11px] font-bold text-white flex items-center gap-1 sm:gap-1.5 truncate">
                      <span className="truncate max-w-[50px] sm:max-w-[80px]">{p.name}</span>
                      {p.isHost && (
                        <span className="bg-[#ff3d47]/20 text-[#ff3d47] text-[8px] px-1 py-0.2 rounded font-black uppercase tracking-wider border border-[#ff3d47]/30 flex-shrink-0">
                          Host
                        </span>
                      )}
                    </span>
                    {p.isMuted ? (
                      <MicOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500 flex-shrink-0" />
                    ) : (
                      <Mic className={`h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 ${isSpeaking ? "text-emerald-400" : "text-neutral-400"}`} />
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
          className={`h-full w-full ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
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

      {(!activeScreenStream && hasVideo && room.status !== "waiting" && cameraFeeds.length && (room.isPlaying || !cinemaMode)) ? (
        <CameraStage 
          feeds={cameraFeeds} 
          participants={participants} 
          screenShareActive={false} 
          containerRef={stageRef} 
          variant={room.isPlaying ? "pip" : "floating"}
          isFullscreen={isFullscreen}
        />
      ) : null}

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
              <Button variant="secondary" size="icon" disabled={!isHost} onClick={() => { play("click"); void seekBy(-10); }} aria-label="Back 10 seconds" className="bg-neutral-800 hover:bg-neutral-700 text-white border border-white/5 rounded-xl h-10 w-10">
                <SkipBack className="h-4.5 w-4.5" />
              </Button>
              <Button
                disabled={!isHost}
                onClick={() => {
                  play("click");
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
              <Button variant="secondary" onClick={() => { play("click"); void resync(); }} className="bg-neutral-800 hover:bg-neutral-700 text-white border border-white/5 rounded-xl h-10 px-4 flex items-center gap-1.5 font-semibold">
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
                onClick={() => {
                  play("click");
                  videoRef.current?.requestPictureInPicture?.();
                }}
                aria-label="Picture in picture"
                className="hover:bg-white/5 text-neutral-300 rounded-xl h-10 w-10 flex items-center justify-center"
              >
                <PictureInPicture2 className="h-4.5 w-4.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { play("click"); if (onToggleFullscreen) onToggleFullscreen(); else videoRef.current?.requestFullscreen(); }} aria-label="Fullscreen" className="hover:bg-white/5 text-neutral-300 rounded-xl h-10 w-10 flex items-center justify-center">
                {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Zoom / Aspect Ratio Overlay Pill */}
      <AnimatePresence>
        {showZoomIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: "-50%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.85, y: "-50%", x: "-50%" }}
            className="absolute top-1/2 left-1/2 z-50 pointer-events-none bg-black/90 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-2"
          >
            <div className="h-2 w-2 rounded-full bg-[#ff3d47] animate-ping" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              {objectFit === "cover" ? "Filled Screen (Zoom)" : "Original Aspect"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Context Menu Popup */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              top: `${Math.min(contextMenu.y, window.innerHeight - 240)}px`,
              left: `${Math.min(contextMenu.x, window.innerWidth - 280)}px`,
            }}
            className="fixed z-[999] w-[260px] glass rounded-2xl border border-white/10 bg-[#111111]/90 backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-3.5 select-none"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ff3d47]">
                Screenshare Config
              </span>
              <span className="text-[9px] font-medium text-neutral-400">
                Right-Click Menu
              </span>
            </div>

            {/* Volume Adjustment */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-neutral-300">
                Stream Volume
              </span>
              {screenStream ? (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 text-[11px] text-neutral-400">
                  <MicOff className="h-3.5 w-3.5 text-[#ff3d47]" />
                  <span>Local Screenshare (Muted)</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-3 py-2">
                  <button
                    onClick={() => {
                      play("click");
                      setScreenShareVolume((v) => (v > 0 ? 0 : 0.8));
                    }}
                    className="text-neutral-400 hover:text-white transition cursor-pointer"
                  >
                    <Volume2 className="h-4 w-4 text-[#ff3d47]" />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={screenShareVolume}
                    onChange={(e) => setScreenShareVolume(Number(e.target.value))}
                    className="w-full h-1 rounded-full bg-neutral-800 accent-[#ff3d47] cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-neutral-300 w-8 text-right">
                    {Math.round(screenShareVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Aspect Ratio Control */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-neutral-300">
                Aspect Display Mode
              </span>
              <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => {
                    play("click");
                    setObjectFit("contain");
                  }}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                    objectFit === "contain"
                      ? "bg-[#ff3d47] text-white shadow-md border border-[#ff3d47]"
                      : "text-neutral-400 hover:text-white bg-transparent border border-transparent"
                  }`}
                >
                  Fit Content
                </button>
                <button
                  onClick={() => {
                    play("click");
                    setObjectFit("cover");
                  }}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                    objectFit === "cover"
                      ? "bg-[#ff3d47] text-white shadow-md border border-[#ff3d47]"
                      : "text-neutral-400 hover:text-white bg-transparent border border-transparent"
                  }`}
                >
                  Fill Screen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
