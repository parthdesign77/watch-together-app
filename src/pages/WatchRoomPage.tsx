import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Loader2, MessageSquare, MonitorUp, Radio, ShieldAlert, MicOff, Tv, Users } from "lucide-react";
import { Navigate, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CameraFeed, CameraStage } from "../components/room/CameraStage";
import { ChatPanel } from "../components/room/ChatPanel";
import { InviteModal } from "../components/room/InviteModal";
import { ParticipantsPanel } from "../components/room/ParticipantsPanel";
import { RoomControls } from "../components/room/RoomControls";
import { StreamAudio } from "../components/room/StreamAudio";
import { StreamVideo } from "../components/room/StreamVideo";
import { VideoStage } from "../components/room/VideoStage";
import { QualitySelectModal } from "../components/room/QualitySelectModal";
import { RoomSettingsModal } from "../components/room/RoomSettingsModal";
import { MovieSelectorModal } from "../components/room/MovieSelectorModal";
import { LeaveRoomModal } from "../components/room/LeaveRoomModal";
import { ReadyCheckModal } from "../components/room/ReadyCheckModal";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import {
  joinRoomById,
  updateRoomState,
  useParticipants,
  useRoom,
  sendRoomReaction,
  useRoomReactions,
  startReadyCheck,
  leaveRoom,
  endRoom
} from "../hooks/useRooms";
import { useWebRTC } from "../hooks/useWebRTC";
import { useUiStore } from "../store/uiStore";
import { useUISound } from "../hooks/useUISound";

interface ActivityLogItem {
  id: string;
  text: string;
  timestamp: number;
}

export function WatchRoomPage() {
  const { roomId } = useParams();
  const [params] = useSearchParams();
  const { profile } = useAuth();
  const { room, loading } = useRoom(roomId);
  const participants = useParticipants(room);
  const { play } = useUISound();

  interface FullscreenReactionParticle {
    id: string;
    emoji: string;
    x: number;
    delay: number;
    duration: number;
    scale: number;
    rotateStart: number;
    rotateEnd: number;
  }

  const [fullscreenReactions, setFullscreenReactions] = useState<FullscreenReactionParticle[]>([]);

  const handleReactionTrigger = useCallback((reaction: { emoji: string; userName: string; id: string }) => {
    const particleCount = 5;
    const particles = Array.from({ length: particleCount }).map((_, idx) => {
      return {
        id: `${reaction.id}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        emoji: reaction.emoji,
        x: 10 + Math.random() * 80,
        delay: idx * 0.1,
        duration: 2.2 + Math.random() * 1.2,
        scale: 0.9 + Math.random() * 0.8,
        rotateStart: Math.random() * 120 - 60,
        rotateEnd: Math.random() * 360 - 180
      };
    });

    play("select");

    setFullscreenReactions((prev) => [...prev, ...particles]);

    setTimeout(() => {
      setFullscreenReactions((prev) => prev.filter((p) => !particles.some((pt) => pt.id === p.id)));
    }, 5000);
  }, [play]);

  useRoomReactions(room?.id, handleReactionTrigger);
  
  const [inviteOpen, setInviteOpen] = useState(Boolean(params.get("code")));
  const [qualityOpen, setQualityOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  
  const [joined, setJoined] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");

  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!mediaContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      mediaContainerRef.current.requestFullscreen().catch((err) => {
        console.error("Failed to enter fullscreen:", err);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement === mediaContainerRef.current;
      setIsFullscreen(isCurrentlyFullscreen);
      if (isCurrentlyFullscreen) {
        play("fullscreen-enter");
      } else {
        play("fullscreen-exit");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [play]);
  
  const voicePrompted = useRef(false);
  const prevRoomRef = useRef<any>(null);
  
  const isExitingRef = useRef(false);
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  
  const isHost = Boolean(room && profile && room.hostId === profile.uid);
  const webRTC = useWebRTC(room?.id, profile?.uid, participants);

  const remoteScreenStream = useMemo(() => {
    if (!room?.screenShareHost) return null;
    const hostParticipant = room.participants?.[room.screenShareHost];
    if (hostParticipant?.screenStreamId) {
      const match = webRTC.remoteStreams.find(
        (item) => item.uid === room.screenShareHost && item.id === hostParticipant.screenStreamId
      );
      if (match) return match.stream;
    }
    return (
      webRTC.remoteStreams.find((item) => {
        if (item.uid !== room.screenShareHost) return false;
        if (item.stream.getVideoTracks().length === 0) return false;
        if (hostParticipant?.cameraStreamId && item.id === hostParticipant.cameraStreamId) return false;
        return true;
      })?.stream || null
    );
  }, [room?.screenShareHost, room?.participants, webRTC.remoteStreams]);

  const cameraFeeds = useMemo<CameraFeed[]>(() => {
    const feeds: CameraFeed[] = [];
    if (webRTC.cameraStream && profile) {
      feeds.push({ id: `${profile.uid}-local-camera`, name: `${profile.name} camera`, stream: webRTC.cameraStream, muted: true });
    }

    webRTC.remoteStreams
      .filter((item) => item.stream.getVideoTracks().length > 0)
      .filter((item) => {
        const participant = room?.participants?.[item.uid];
        if (!participant) return false;
        if (participant.screenStreamId && item.id === participant.screenStreamId) {
          return false;
        }
        if (item.stream === remoteScreenStream) {
          return false;
        }
        return participant.isCameraOn || !room?.isScreenSharing;
      })
      .forEach((item) => {
        feeds.push({
          id: `${item.uid}-${item.id}`,
          name: `${room?.participants?.[item.uid]?.name || "Guest"} camera`,
          stream: item.stream
        });
      });

    return feeds;
  }, [profile, remoteScreenStream, room?.isScreenSharing, room?.participants, webRTC.cameraStream, webRTC.remoteStreams]);

  // Prevent accidental back gestures / tab closures / browser back button navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Push a dummy state so that there is something to pop when browser back is pressed
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Show confirmation modal
      setLeaveModalOpen(true);
      // Push state again so the user stays on the current URL
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Safe cleanup of WebRTC streams on unmount to prevent visual and page crashes
  useEffect(() => {
    return () => {
      cleanupWebRTC();
    };
  }, []);

  // Escape key to exit Cinema Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && cinemaMode) {
        setCinemaMode(false);
        play("click");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cinemaMode, play]);

  // Listen for platform room actions and log events to screen
  useEffect(() => {
    if (!room) return;
    const prev = prevRoomRef.current;
    if (prev) {
      const newLogs: string[] = [];
      if (prev.isPlaying !== room.isPlaying) {
        newLogs.push(room.isPlaying ? "Playback started" : "Playback paused");
      }
      if (prev.quality !== room.quality) {
        newLogs.push(`Quality changed to ${room.quality}`);
      }
      if (prev.isScreenSharing !== room.isScreenSharing) {
        if (room.isScreenSharing) {
          const hostName = room.participants?.[room.screenShareHost || ""]?.name || "Someone";
          newLogs.push(`${hostName} started screen sharing`);
          play("start");
        } else {
          newLogs.push("Screen sharing stopped");
          play("leave");
        }
      }
      // Participant join/leave detector
      const prevUids = Object.keys(prev.participants || {});
      const currUids = Object.keys(room.participants || {});
      if (currUids.length > prevUids.length) {
        const joinedUid = currUids.find((u) => !prevUids.includes(u));
        const name = room.participants[joinedUid || ""]?.name || "A friend";
        newLogs.push(`${name} joined the room`);
        play("join");
      } else if (currUids.length < prevUids.length) {
        const leftUid = prevUids.find((u) => !currUids.includes(u));
        const name = prev.participants[leftUid || ""]?.name || "A friend";
        newLogs.push(`${name} left the room`);
        play("leave");
      }

      if (newLogs.length > 0) {
        newLogs.forEach((text) => {
          const id = Math.random().toString(36).substring(2, 9);
          setActivityLog((prevLog) => [...prevLog, { id, text, timestamp: Date.now() }]);
          setTimeout(() => {
            setActivityLog((prevLog) => prevLog.filter((l) => l.id !== id));
          }, 3500);
        });
      }
    }
    prevRoomRef.current = room;
  }, [room, play]);

  // Clean redirection if the room is ended by the host
  useEffect(() => {
    if (room && room.status === "ended") {
      pushToast({
        title: "Room ended",
        description: "The host has closed this watch room.",
        type: "info"
      });
      isExitingRef.current = true;
      cleanupWebRTC();
      navigate("/dashboard");
    }
  }, [room, navigate, pushToast]);

  useEffect(() => {
    if (!room || !profile || joined) return;
    if (!room.participants?.[profile.uid]) {
      void joinRoomById(room.id, profile)
        .then(() => {
          setJoined(true);
          pushToast({ title: "Joined synchronized room", description: "Playback, chat history, and participant state restored.", type: "success" });
        })
        .catch((error) => pushToast({ title: "Could not join room", description: error.message, type: "error" }));
    } else {
      setJoined(true);
    }
  }, [joined, profile, pushToast, room]);

  useEffect(() => {
    if (!room || !profile || !joined || webRTC.voiceStream || voicePrompted.current) return;
    voicePrompted.current = true;
    void webRTC.startVoice().catch(() => {
      // Suppress irritating recurring notifications, display single polite console info log
      console.info("Voice connection waiting for mic button click.");
    });
  }, [joined, profile, room, webRTC]);

  // Auto-enable camera in camera-first rooms (no movie URL loaded initially)
  useEffect(() => {
    if (joined && room && !room.videoUrl && !webRTC.cameraStream) {
      toggleCamera().catch(() => undefined);
    }
  }, [joined, room?.videoUrl]);

  // Auto-sync Firestore when local screen sharing stops natively (e.g. via browser UI)
  useEffect(() => {
    if (isExitingRef.current) return;
    if (!webRTC.screenStream && room?.isScreenSharing && profile && room?.screenShareHost === profile.uid) {
      void updateRoomState(room.id, {
        isScreenSharing: false,
        screenShareHost: null,
        status: room.videoUrl ? (room.isPlaying ? "watching" : "paused") : "waiting",
        [`participants.${profile.uid}.isScreenSharing`]: false,
        [`participants.${profile.uid}.screenStreamId`]: null
      });
      pushToast({
        title: "Screen sharing stopped",
        description: "Your screenshare stream has ended.",
        type: "info"
      });
    }
  }, [webRTC.screenStream, room?.isScreenSharing, room?.screenShareHost, room?.id, room?.videoUrl, room?.isPlaying, profile, pushToast]);

  // If someone else takes over screen sharing, stop our own local screen share stream
  useEffect(() => {
    if (webRTC.screenStream && room?.isScreenSharing && room?.screenShareHost !== profile?.uid) {
      webRTC.stopScreenShare();
      pushToast({
        title: "Screen sharing stopped",
        description: "Someone else started sharing their screen.",
        type: "info"
      });
    }
  }, [room?.isScreenSharing, room?.screenShareHost, profile?.uid, webRTC, pushToast]);

  if (!roomId) return <Navigate to="/dashboard" replace />;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#090909]">
        <div className="glass flex items-center gap-3 rounded-[20px] p-6 border border-white/5 bg-[#111111]">
          <Loader2 className="h-5 w-5 animate-spin text-[#ff3d47]" />
          <span className="font-bold text-white text-sm">Synchronizing theater feed...</span>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#090909]">
        <div className="glass rounded-[28px] p-8 border border-white/5 bg-[#111111] max-w-md text-center">
          <ShieldAlert className="h-12 w-12 text-[#ff3d47] mx-auto mb-4" />
          <h1 className="font-display text-2xl font-black text-white">Room Expired or Unavailable</h1>
          <p className="mt-2 text-sm text-neutral-400">Ask the host for a new invite link or spin up a new private room from your dashboard.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 bg-[#ff3d47] text-white rounded-xl h-11 px-6 font-bold hover:bg-[#ff3d47]/90 border-none transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  const currentRoom = room;
  const currentProfile = profile;
  const remoteAudioStreams = webRTC.remoteStreams.filter((item) => item.stream.getAudioTracks().length > 0);
  const screenShareActive = Boolean(webRTC.screenStream || remoteScreenStream || room.isScreenSharing);
  const cameraOnlyMode = cameraFeeds.length > 0 && !screenShareActive;

  function cleanupWebRTC() {
    try {
      webRTC.stopCamera();
      webRTC.stopScreenShare();
    } catch (e) {
      console.warn("Error cleaning up WebRTC on exit", e);
    }
  }

  async function handleConfirmLeave() {
    isExitingRef.current = true;
    cleanupWebRTC();
    if (isHost) {
      await endRoom(currentRoom.id);
    } else {
      await leaveRoom(currentRoom.id, currentProfile.uid);
    }
    navigate("/dashboard");
  }

  async function shareScreen(mode: "entire-screen" | "window") {
    try {
      const stream = await webRTC.startScreenShare(mode, profile?.subscriptionPlan);
      const updates: any = {
        isScreenSharing: true,
        screenShareHost: currentProfile.uid,
        status: "screen-sharing",
        [`participants.${currentProfile.uid}.isScreenSharing`]: true,
        [`participants.${currentProfile.uid}.screenStreamId`]: stream.id
      };
      if (currentRoom.screenShareHost && currentRoom.screenShareHost !== currentProfile.uid) {
        updates[`participants.${currentRoom.screenShareHost}.isScreenSharing`] = false;
        updates[`participants.${currentRoom.screenShareHost}.screenStreamId`] = null;
      }
      await updateRoomState(currentRoom.id, updates);
      pushToast({
        title: "Entire screen shared",
        description: "High-quality screen stream propagating successfully.",
        type: "success"
      });
    } catch (error) {
      pushToast({ title: "Screen share cancelled", description: error instanceof Error ? error.message : "Try again.", type: "error" });
    }
  }

  async function stopScreen() {
    webRTC.stopScreenShare();
    await updateRoomState(currentRoom.id, {
      isScreenSharing: false,
      screenShareHost: null,
      status: currentRoom.videoUrl ? (currentRoom.isPlaying ? "watching" : "paused") : "waiting",
      [`participants.${currentProfile.uid}.isScreenSharing`]: false,
      [`participants.${currentProfile.uid}.screenStreamId`]: null
    });
  }

  async function toggleCamera() {
    try {
      if (webRTC.cameraStream) {
        webRTC.stopCamera();
        await updateRoomState(currentRoom.id, {
          [`participants.${currentProfile.uid}.isCameraOn`]: false,
          [`participants.${currentProfile.uid}.cameraStreamId`]: null
        });
        return;
      }

      const stream = await webRTC.startCamera(profile?.subscriptionPlan);
      await updateRoomState(currentRoom.id, {
        [`participants.${currentProfile.uid}.isCameraOn`]: true,
        [`participants.${currentProfile.uid}.cameraStreamId`]: stream.id
      });
      pushToast({ title: "Camera connected", description: "Your feed will float as picture-in-picture during active shares.", type: "success" });
    } catch (error) {
      pushToast({ title: "Camera unavailable", description: error instanceof Error ? error.message : "Check camera permissions.", type: "error" });
    }
  }

  // Reaction Sender
  const handleSendReaction = (emoji: string) => {
    if (profile) {
      void sendRoomReaction(room.id, emoji, profile.name);
    }
  };

  // Ready Check Trigger
  const handleTriggerReadyCheck = () => {
    const uids = Object.keys(room.participants || {});
    void startReadyCheck(room.id, uids);
  };

  // Switch Room back to Normal Voice/Camera Stage (Turn off Video)
  const handleSwitchToNormalVC = async () => {
    play("click");
    try {
      await updateRoomState(room.id, {
        videoUrl: "",
        contentId: "",
        isPlaying: false,
        status: "waiting",
        currentTime: 0
      });
      pushToast({
        title: "Switched to Normal VC",
        description: "The movie was turned off. Enjoy standard voice and camera chat!",
        type: "info"
      });
    } catch (error) {
      pushToast({
        title: "Failed to switch mode",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        type: "error"
      });
    }
  };

  return (
    <div className={`bg-[#090909] text-white p-3 sm:p-5 flex flex-col gap-3 sm:gap-5 overflow-x-hidden relative ${
      cinemaMode ? "h-screen max-h-screen overflow-hidden" : "min-h-screen xl:h-screen xl:max-h-screen xl:overflow-hidden"
    }`}>
      
      {/* Floating Exit Cinema Mode Button (Always visible in Cinema Mode) */}
      <AnimatePresence>
        {cinemaMode && (
          <motion.button
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-5 left-1/2 z-50 glass rounded-full px-5 py-2.5 border border-[#ff3d47]/30 bg-black/80 hover:bg-[#ff3d47]/20 text-[#ff3d47] hover:text-white text-xs font-extrabold flex items-center gap-2 shadow-[0_0_15px_rgba(255,61,71,0.25)] transition-all duration-300 active:scale-95 cursor-pointer"
            onClick={() => {
              play("click");
              setCinemaMode(false);
            }}
          >
            <Tv className="h-4.5 w-4.5" />
            <span>Exit Cinema Mode</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Invisible Top Hover Trigger for Cinema Mode */}
      {cinemaMode && (
        <div
          className="fixed top-0 left-0 right-0 h-4 z-40 bg-transparent"
          onMouseEnter={() => setHeaderHovered(true)}
        />
      )}

      {/* Sliding Header Controls (Hidden when in Cinema Mode unless top-hovered) */}
      <div
        onMouseEnter={() => cinemaMode && setHeaderHovered(true)}
        onMouseLeave={() => cinemaMode && setHeaderHovered(false)}
        className={`transition-all duration-500 ease-in-out z-40 ${
          cinemaMode
            ? `fixed top-0 left-0 right-0 p-5 bg-[#090909]/95 backdrop-blur-lg border-b border-white/5 transform shadow-2xl ${
                headerHovered ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
              }`
            : "relative w-full"
        }`}
      >
        <RoomControls
          room={room}
          isHost={isHost}
          muted={webRTC.muted}
          onInvite={() => setInviteOpen(true)}
          onStartVoice={() =>
            webRTC
              .startVoice()
              .then(() => pushToast({ title: "Voice connected", description: "Speaking indicators are now active.", type: "success" }))
              .catch((error) => pushToast({ title: "Voice unavailable", description: error.message, type: "error" }))
          }
          onToggleMute={webRTC.toggleMute}
          onToggleCamera={toggleCamera}
          onShareScreen={shareScreen}
          onStopScreen={stopScreen}
          onOpenQuality={() => setQualityOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenSelector={() => setSelectorOpen(true)}
          onLeaveRoom={() => setLeaveModalOpen(true)}
          onSendReaction={handleSendReaction}
          onTriggerReadyCheck={handleTriggerReadyCheck}
          hasCameraStream={Boolean(webRTC.cameraStream)}
          hasScreenStream={Boolean(webRTC.screenStream)}
          cinemaMode={cinemaMode}
          onToggleCinemaMode={() => setCinemaMode(!cinemaMode)}
          onTurnOffVideo={handleSwitchToNormalVC}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col xl:flex-row gap-5 flex-1 min-h-0 transition-all duration-500">
        
        {/* Widescreen Video Stage Container */}
        <div
          ref={mediaContainerRef}
          className={`flex-1 min-h-0 flex flex-col gap-4 relative transition-all duration-500 ${
            isFullscreen ? "p-5 bg-[#090909] w-full h-full justify-between" : ""
          }`}
        >
          
          {/* Room Synced Notification Overlay */}
          <div className="absolute top-5 left-5 z-40 space-y-2 pointer-events-none max-w-sm">
            <AnimatePresence>
              {activityLog.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#111111]/90 backdrop-blur-md text-white/90 text-xs font-bold px-3.5 py-2.5 rounded-2xl border border-white/10 shadow-lg flex items-center gap-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ff3d47] animate-pulse" />
                  <span>{log.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Mini Circular Participant Bubbles (Top-right corner in Cinema Mode) */}
          {cinemaMode && room.videoUrl && (
            <div className="absolute top-5 right-5 z-40 flex items-center gap-2 bg-[#111111]/85 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/5 shadow-2xl">
              {participants.map((p) => (
                <button
                  key={p.uid}
                  onClick={() => {
                    setCinemaMode(false);
                    play("click");
                  }}
                  className={`relative h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/15 cursor-pointer hover:scale-105 transition-all duration-300 ${
                    p.isSpeaking ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-black" : ""
                  }`}
                  style={{ backgroundColor: p.avatar ? undefined : (p.avatarColor || "#ff3d47") }}
                  title={`Click to exit Cinema mode - ${p.name}`}
                >
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name || "Guest"} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    (p.name || "Guest").slice(0, 2).toUpperCase()
                  )}
                  {p.isMuted && (
                    <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-0.5 border border-black shadow">
                      <MicOff className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Core Media Display */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <VideoStage
              room={room}
              isHost={isHost}
              screenStream={webRTC.screenStream}
              remoteScreenStream={remoteScreenStream}
              cameraFeeds={cameraFeeds}
              participants={participants}
              onVideoEnded={() => setCinemaMode(false)}
              cinemaMode={cinemaMode}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          </div>

          {/* Bottom Row: Camera list during screen sharing or Cinema Mode (always visible without scrolling) */}
          {(screenShareActive || (cinemaMode && cameraFeeds.length > 0)) ? (
            <div className="w-full flex-shrink-0">
              <CameraStage
                feeds={cameraFeeds}
                participants={participants}
                screenShareActive={screenShareActive}
                variant="bottom-bar"
                isFullscreen={isFullscreen}
              />
            </div>
          ) : (
            !cinemaMode && (
              <section className="grid gap-4 md:grid-cols-3 flex-shrink-0">
                <div className="glass rounded-[20px] p-4 bg-[#111111]/60 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Radio className="h-5 w-5 text-[#ff3d47]" />
                    <div>
                      <p className="text-sm font-bold text-white">Latency Engine</p>
                      <p className="text-xs text-neutral-400">Heartbeat sync · drift correction</p>
                    </div>
                  </div>
                </div>
                <div className="glass rounded-[20px] p-4 bg-[#111111]/60 border border-white/5">
                  <div className="flex items-center gap-3">
                    <MonitorUp className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Screen Share</p>
                      <p className="text-xs text-neutral-400">{room.isScreenSharing ? "HD Stream receiving" : "Entire screen sharing"}</p>
                    </div>
                  </div>
                </div>
                <div className="glass rounded-[20px] p-4 bg-[#111111]/60 border border-white/5">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Audio Channels</p>
                      <p className="text-xs text-neutral-400">Movie audio + low latency voice</p>
                    </div>
                  </div>
                </div>
              </section>
            )
          )}
        </div>

        {/* Sidebar Panel (Hidden when Cinema Mode is active) */}
        {!cinemaMode && (
          <div className="flex flex-col w-full xl:w-[380px] h-full gap-4 flex-shrink-0">
            {/* Glassmorphic Tab Switcher (Visible only on screens < xl) */}
            <div className="flex xl:hidden bg-[#111111]/80 border border-white/5 rounded-2xl p-1 gap-1 shadow-glow-sm">
              <button
                onClick={() => {
                  play("click");
                  setActiveTab("chat");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-[#ff3d47] text-white shadow-glow-sm"
                    : "text-neutral-400 hover:text-white bg-transparent"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Live Chat</span>
              </button>
              <button
                onClick={() => {
                  play("click");
                  setActiveTab("participants");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "participants"
                    ? "bg-[#ff3d47] text-white shadow-glow-sm"
                    : "text-neutral-400 hover:text-white bg-transparent"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Participants</span>
                <span className="bg-white/10 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {participants.length}
                </span>
              </button>
            </div>

            {/* Desktop stacked layout (Visible only on xl screens) */}
            <div className="xl:flex hidden flex-col gap-4 w-full h-full min-h-0 pr-1">
              <div className="flex-shrink-0">
                <ParticipantsPanel participants={participants} />
              </div>
              <div className="flex-1 min-h-0">
                <ChatPanel roomId={room.id} profile={profile} />
              </div>
            </div>

            {/* Mobile/Tablet tabbed layout (Visible only on screens < xl) */}
            <div className="xl:hidden block w-full">
              {activeTab === "chat" ? (
                <ChatPanel roomId={room.id} profile={profile} />
              ) : (
                <ParticipantsPanel participants={participants} />
              )}
            </div>
          </div>
        )}
      </div>

      {remoteAudioStreams.map((item) => (
        <StreamAudio key={`${item.uid}-${item.id}`} stream={item.stream} />
      ))}

      {/* Synchronized modals */}
      <InviteModal open={inviteOpen} room={room} onClose={() => setInviteOpen(false)} />
      <QualitySelectModal open={qualityOpen} onClose={() => setQualityOpen(false)} room={room} />
      <RoomSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} room={room} isHost={isHost} />
      <MovieSelectorModal open={selectorOpen} onClose={() => setSelectorOpen(false)} room={room} />
      
      {/* Leave confirmation modal */}
      <LeaveRoomModal
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onConfirm={handleConfirmLeave}
        isHost={isHost}
      />

      {/* Ready check prompt modal */}
      <ReadyCheckModal
        open={Boolean(room.readyCheck && room.readyCheck.active)}
        room={room}
        userId={profile.uid}
        isHost={isHost}
        participants={participants}
      />

      {/* Full-Screen Viewport Reaction Particle Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {fullscreenReactions.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}%`,
              "--rotate-start": `${p.rotateStart}deg`,
              "--rotate-end": `${p.rotateEnd}deg`,
              "--emoji-scale": p.scale,
              animation: `emoji-float-up ${p.duration}s cubic-bezier(0.1, 0.8, 0.3, 1) ${p.delay}s forwards`
            } as React.CSSProperties}
            className="fullscreen-emoji-particle flex items-center justify-center select-none pointer-events-none"
          >
            <span className="text-5xl md:text-6xl select-none filter drop-shadow-md">{p.emoji}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
