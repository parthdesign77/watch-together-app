import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Loader2, MessageSquare, MonitorUp, Radio, ShieldAlert, MicOff, Tv, Users, Sliders, Crown, Mic, Volume2, Copy, Check, Lock, Film, Share2, VideoOff } from "lucide-react";
import { Navigate, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CameraFeed, CameraStage } from "../components/room/CameraStage";
import { ChatPanel } from "../components/room/ChatPanel";
import { InviteModal } from "../components/room/InviteModal";
import { ParticipantsPanel } from "../components/room/ParticipantsPanel";
import { RoomControls } from "../components/room/RoomControls";
import { MobileControls } from "../components/room/MobileControls";
import { StreamAudio } from "../components/room/StreamAudio";
import { StreamVideo } from "../components/room/StreamVideo";
import { VideoStage } from "../components/room/VideoStage";
import { QualitySelectModal } from "../components/room/QualitySelectModal";
import { RoomSettingsModal } from "../components/room/RoomSettingsModal";
import { MovieSelectorModal } from "../components/room/MovieSelectorModal";
import { LeaveRoomModal } from "../components/room/LeaveRoomModal";
import { ReadyCheckModal } from "../components/room/ReadyCheckModal";
import { DeviceSettingsModal } from "../components/room/DeviceSettingsModal";
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
  endRoom,
  useRoomMessages,
  approveJoinRequest,
  rejectJoinRequest
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
  const messages = useRoomMessages(room?.id);
  const { play } = useUISound();

  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenCount, setLastSeenCount] = useState(0);

  interface ChatToast {
    id: string;
    userName: string;
    text: string;
  }
  const [cinemaChatToasts, setCinemaChatToasts] = useState<ChatToast[]>([]);

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
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
    const particleCount = isMobileDevice ? 2 : 5;
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
  const [deviceSettingsOpen, setDeviceSettingsOpen] = useState(false);
  
  const [joined, setJoined] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
  const [mobileParticipantsOpen, setMobileParticipantsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => {
    if (!mobileOptionsOpen) return;
    navigator.mediaDevices.enumerateDevices().then((list) => {
      setDevices(list);
    }).catch(err => console.warn(err));
  }, [mobileOptionsOpen]);

  const audioInputDeviceId = useUiStore((state) => state.audioInputDeviceId);
  const audioOutputDeviceId = useUiStore((state) => state.audioOutputDeviceId);
  const noiseSuppressionEnabled = useUiStore((state) => state.noiseSuppressionEnabled);
  const masterVolume = useUiStore((state) => state.masterVolume);
  const participantVolumes = useUiStore((state) => state.participantVolumes);
  
  const setAudioInputDeviceId = useUiStore((state) => state.setAudioInputDeviceId);
  const setAudioOutputDeviceId = useUiStore((state) => state.setAudioOutputDeviceId);
  const setNoiseSuppressionEnabled = useUiStore((state) => state.setNoiseSuppressionEnabled);
  const setMasterVolume = useUiStore((state) => state.setMasterVolume);
  const setParticipantVolume = useUiStore((state) => state.setParticipantVolume);

  const microphones = devices.filter((d) => d.kind === "audioinput");
  const speakers = devices.filter((d) => d.kind === "audiooutput");
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
    const hostStreams = webRTC.remoteStreams.filter(
      (item) => item.uid === room.screenShareHost && item.stream.getVideoTracks().length > 0
    );
    if (hostStreams.length === 0) return null;
    
    const hostParticipant = room.participants?.[room.screenShareHost];
    if (hostParticipant?.screenStreamId) {
      const match = hostStreams.find((s) => s.id === hostParticipant.screenStreamId);
      if (match) return match.stream;
    }
    if (hostStreams.length === 1) return hostStreams[0].stream;
    if (hostParticipant?.cameraStreamId) {
      const nonCamera = hostStreams.find((s) => s.id !== hostParticipant.cameraStreamId);
      if (nonCamera) return nonCamera.stream;
    }
    return hostStreams[0].stream;
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
        return participant.isCameraOn === true;
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
    const isHostUser = room.hostId === profile.uid;
    const isPart = room.participants && !!room.participants[profile.uid];

    if (!isHostUser && !isPart) {
      const request = room.joinRequests?.[profile.uid];
      if (!request) {
        void joinRoomById(room.id, profile)
          .catch((error) => pushToast({ title: "Could not request to join room", description: error.message, type: "error" }));
      }
    } else {
      setJoined(true);
      pushToast({ title: "Joined synchronized room", description: "Playback, chat history, and participant state restored.", type: "success" });
    }
  }, [joined, profile, pushToast, room]);

  useEffect(() => {
    if (!room || !profile || !joined || webRTC.voiceStream || voicePrompted.current) return;

    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
    if (isMobileDevice) {
      console.log("[WatchRoom] Mobile device detected - skipping auto voice prompt until user gesture");
      return;
    }

    voicePrompted.current = true;
    void webRTC.startVoice().catch(() => {
      // Suppress irritating recurring notifications, display single polite console info log
      console.info("Voice connection waiting for mic button click.");
    });
  }, [joined, profile, room, webRTC]);

  const localParticipant = useMemo(() => {
    return participants.find((p) => p.uid === profile?.uid);
  }, [participants, profile?.uid]);
  const isHandRaised = localParticipant?.isHandRaised || false;

  const handleToggleHandRaise = useCallback(async () => {
    if (!room || !profile) return;
    const nextHand = !isHandRaised;
    await updateRoomState(room.id, {
      [`participants.${profile.uid}.isHandRaised`]: nextHand
    });
    play("click");
  }, [room, profile, isHandRaised, play]);

  const pushToTalkEnabled = useUiStore((state) => state.pushToTalkEnabled);

  useEffect(() => {
    if (!pushToTalkEnabled || !joined || !room || !profile) return;

    // Default mic to muted when PTT is active
    webRTC.toggleMute(true);

    let isSpacePressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const active = document.activeElement;
        const isInput = active && (
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.hasAttribute("contenteditable") ||
          active.getAttribute("role") === "textbox"
        );
        if (isInput) return;

        e.preventDefault();
        if (!isSpacePressed) {
          isSpacePressed = true;
          webRTC.toggleMute(false);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const active = document.activeElement;
        const isInput = active && (
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.hasAttribute("contenteditable") ||
          active.getAttribute("role") === "textbox"
        );
        if (isInput) return;

        e.preventDefault();
        if (isSpacePressed) {
          isSpacePressed = false;
          webRTC.toggleMute(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      webRTC.toggleMute(false);
    };
  }, [pushToTalkEnabled, joined, room?.id, profile, webRTC]);

  useEffect(() => {
    if (activeTab === "chat" && !cinemaMode) {
      setLastSeenCount(messages.length);
    }
  }, [messages.length, activeTab, cinemaMode]);

  useEffect(() => {
    if (activeTab === "chat" && !cinemaMode) {
      setUnreadCount(0);
    } else {
      setUnreadCount(Math.max(0, messages.length - lastSeenCount));
    }
  }, [messages.length, lastSeenCount, activeTab, cinemaMode]);

  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const newMessages = messages.slice(prevMessageCountRef.current);
      if (prevMessageCountRef.current > 0) {
        newMessages.forEach((msg) => {
          if (msg.userId !== profile?.uid) {
            if (cinemaMode) {
              const id = Math.random().toString(36).substring(2, 9);
              setCinemaChatToasts((prev) => [...prev, { id, userName: msg.userName, text: msg.text }]);
              setTimeout(() => {
                setCinemaChatToasts((prev) => prev.filter((t) => t.id !== id));
              }, 4000);
            }
          }
        });
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, cinemaMode, profile?.uid]);

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
      <div className="grid min-h-screen place-items-center bg-[#090909] text-white">
        <img 
          src="/logo.png" 
          alt="Watch Together" 
          className="h-16 w-auto object-contain animate-rotate-logo" 
        />
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

  const isParticipant = Boolean(room?.participants?.[profile?.uid]);

  if (!isHost && !isParticipant) {
    const myRequest = room.joinRequests?.[profile.uid];
    const requestStatus = myRequest?.status || "pending";

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#090909]">
        <div className="glass rounded-[28px] p-8 border border-white/5 bg-[#111111] max-w-md text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#ff3d47]/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#ff3d47]/20 rounded-full blur-[80px]" />

          <div className="relative z-10">
            {requestStatus === "pending" ? (
              <>
                <img 
                  src="/logo.png" 
                  alt="Watch Together" 
                  className="h-20 w-auto object-contain mx-auto mb-6 animate-rotate-logo" 
                />
                <h1 className="font-display text-2xl font-black text-white mb-2">Awaiting Host Approval</h1>
                <p className="mt-2 text-sm text-neutral-400 mb-6">
                  Your request to join the room is pending. Please wait for the host to accept your entry.
                </p>
                <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 border border-white/5 bg-white/5 backdrop-blur-md text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-[#ff3d47] animate-ping" />
                  <span className="text-xs font-semibold tracking-wider">Awaiting response...</span>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="h-16 w-16 text-[#ff3d47] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,61,71,0.4)]" />
                <h1 className="font-display text-2xl font-black text-white mb-2">Request Rejected</h1>
                <p className="mt-2 text-sm text-neutral-400 mb-6">
                  The host has declined your request to join this private watch party.
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white rounded-xl h-11 px-6 font-bold border-none transition-all duration-300 shadow-[0_4px_20px_rgba(255,61,71,0.3)]"
                >
                  Return to Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentRoom = room;
  const currentProfile = profile;
  const remoteAudioStreams = webRTC.remoteStreams.filter((item) => {
    if (item.stream.getAudioTracks().length === 0) return false;
    const hostParticipant = room?.participants?.[item.uid];
    if (hostParticipant && hostParticipant.screenStreamId === item.id) {
      return false; // Exclude screenshare from general background audio playback
    }
    return true;
  });
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

  function handleConfirmLeave() {
    isExitingRef.current = true;
    cleanupWebRTC();
    if (isHost) {
      endRoom(currentRoom.id).catch((err) => {
        console.error("Failed to end room in background:", err);
      });
    } else {
      leaveRoom(currentRoom.id, currentProfile.uid).catch((err) => {
        console.error("Failed to leave room in background:", err);
      });
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

  const pendingRequests = useMemo(() => {
    if (!room?.joinRequests) return [];
    return Object.values(room.joinRequests).filter((req) => req.status === "pending");
  }, [room?.joinRequests]);

  const handleApproveRequest = async (reqUser: any) => {
    play("click");
    try {
      await approveJoinRequest(room.id, reqUser);
      pushToast({
        title: "Request Approved",
        description: `${reqUser.name} has been admitted to the room.`,
        type: "success"
      });
    } catch (err) {
      pushToast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "Failed to approve request.",
        type: "error"
      });
    }
  };

  const handleRejectRequest = async (userId: string, userName: string) => {
    play("click");
    try {
      await rejectJoinRequest(room.id, userId);
      pushToast({
        title: "Request Rejected",
        description: `Rejected entry request from ${userName}.`,
        type: "info"
      });
    } catch (err) {
      pushToast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "Failed to reject request.",
        type: "error"
      });
    }
  };

  return (
    <div className={`bg-[#090909] text-white p-3 sm:p-5 flex flex-col gap-3 sm:gap-5 overflow-x-hidden relative ${
      cinemaMode ? "h-[100dvh] max-h-[100dvh] overflow-hidden" : "min-h-[100dvh] xl:h-screen xl:max-h-screen xl:overflow-hidden"
    } ${isMobile ? "pb-24" : ""}`}>
      
      {/* Floating Host Approval Banner/Toast Panel */}
      {isHost && pendingRequests.length > 0 && (
        <div className="fixed top-6 right-6 z-50 w-80 max-w-sm flex flex-col gap-3 pointer-events-auto">
          <AnimatePresence>
            {pendingRequests.map((req) => (
              <motion.div
                key={req.uid}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="glass rounded-2xl border border-white/10 bg-[#111111]/95 backdrop-blur-md shadow-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm border border-white/10 shadow-inner"
                    style={{ backgroundColor: req.avatarColor || "#ff3d47" }}
                  >
                    {req.avatar ? (
                      <img src={req.avatar} alt={req.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      req.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Join Request</p>
                    <p className="text-sm font-extrabold text-white truncate">{req.name}</p>
                  </div>
                </div>
                
                <p className="text-xs text-neutral-400">
                  Wants to join your private watch party.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveRequest(req)}
                    className="flex-1 bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white rounded-xl h-9 text-xs font-extrabold border-none transition-all cursor-pointer shadow-[0_2px_10px_rgba(255,61,71,0.25)] font-sans"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req.uid, req.name)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl h-9 text-xs font-extrabold border border-white/5 hover:border-white/10 transition-all cursor-pointer font-sans"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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
          onOpenDeviceSettings={() => setDeviceSettingsOpen(true)}
          isHandRaised={isHandRaised}
          onToggleHandRaise={handleToggleHandRaise}
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
              isMobile={isMobile}
            />
          </div>

          {/* Bottom Row: Camera list during screen sharing or Cinema Mode (always visible without scrolling) */}
          {(screenShareActive || (cinemaMode && cameraFeeds.length > 0)) && !room.isPlaying && (
            <div className="w-full flex-shrink-0">
              <CameraStage
                feeds={cameraFeeds}
                participants={participants}
                screenShareActive={screenShareActive}
                variant="bottom-bar"
                isFullscreen={isFullscreen}
              />
            </div>
          )}
        </div>

        {/* Sidebar Panel (Hidden when Cinema Mode is active or on Mobile) */}
        {!cinemaMode && !isMobile && (
          <div className="flex flex-col w-full lg:w-[380px] xl:w-[380px] h-full gap-4 flex-shrink-0">
            {/* Glassmorphic Tab Switcher (Visible only on screens < xl) */}
            <div className="flex xl:hidden bg-[#111111]/80 border border-white/5 rounded-2xl p-1 gap-1 shadow-glow-sm">
              <button
                onClick={() => {
                  play("click");
                  setActiveTab("chat");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
                  activeTab === "chat"
                    ? "bg-[#ff3d47] text-white shadow-glow-sm"
                    : "text-neutral-400 hover:text-white bg-transparent"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Live Chat</span>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-cyan text-black font-black text-[9px] h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center border border-black shadow"
                  >
                    {unreadCount}
                  </motion.span>
                )}
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
                <ChatPanel roomId={room.id} profile={profile} messages={messages} participants={participants} />
              </div>
            </div>

            {/* Mobile/Tablet tabbed layout (Visible only on screens < xl) */}
            <div className="xl:hidden block w-full">
              {activeTab === "chat" ? (
                <ChatPanel roomId={room.id} profile={profile} messages={messages} participants={participants} />
              ) : (
                <ParticipantsPanel participants={participants} />
              )}
            </div>
          </div>
        )}
      </div>

      {remoteAudioStreams.map((item) => (
        <StreamAudio key={`${item.uid}-${item.id}`} stream={item.stream} uid={item.uid} />
      ))}

      {/* Synchronized modals */}
      <InviteModal open={inviteOpen} room={room} onClose={() => setInviteOpen(false)} />
      <QualitySelectModal open={qualityOpen} onClose={() => setQualityOpen(false)} room={room} />
      <RoomSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} room={room} isHost={isHost} />
      <MovieSelectorModal open={selectorOpen} onClose={() => setSelectorOpen(false)} room={room} />
      <DeviceSettingsModal open={deviceSettingsOpen} onClose={() => setDeviceSettingsOpen(false)} />
      
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

      {/* Premium Cinema Mode Floating Chat Toasts */}
      <div className="fixed bottom-24 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {cinemaMode && cinemaChatToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.95, x: 20 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-3.5 border border-cyan/20 bg-black/85 text-white shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col gap-1 min-w-[200px]"
            >
              <span className="text-[11px] font-black text-cyan uppercase tracking-wider">{toast.userName}</span>
              <p className="text-xs text-slate-200 break-words leading-relaxed font-medium">
                {toast.text.startsWith("http") && (toast.text.includes(".gif") || toast.text.includes(".png") || toast.text.includes(".jpg") || toast.text.includes(".webp")) ? (
                  <span className="italic text-neutral-400">Sent a sticker</span>
                ) : (
                  toast.text
                )}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Controls Tray */}
      {isMobile && (
        <MobileControls
          room={room}
          isHost={isHost}
          muted={webRTC.muted}
          hasCameraStream={Boolean(webRTC.cameraStream)}
          hasScreenStream={Boolean(webRTC.screenStream)}
          isHandRaised={isHandRaised}
          unreadCount={unreadCount}
          participantsCount={participants.length}
          onStartVoice={() =>
            webRTC.startVoice()
              .then(() => pushToast({ title: "Voice connected", description: "Speaking indicators are now active.", type: "success" }))
              .catch((error) => pushToast({ title: "Voice unavailable", description: error.message, type: "error" }))
          }
          onToggleMute={webRTC.toggleMute}
          onToggleCamera={toggleCamera}
          onShareScreen={shareScreen}
          onStopScreen={stopScreen}
          onToggleHandRaise={handleToggleHandRaise}
          onOpenChat={() => {
            setMobileChatOpen(true);
            setMobileParticipantsOpen(false);
            setMobileOptionsOpen(false);
          }}
          onOpenParticipants={() => {
            setMobileParticipantsOpen(true);
            setMobileChatOpen(false);
            setMobileOptionsOpen(false);
          }}
          onOpenOptions={() => {
            setMobileOptionsOpen(true);
            setMobileChatOpen(false);
            setMobileParticipantsOpen(false);
          }}
          onLeaveRoom={() => setLeaveModalOpen(true)}
          onSendReaction={handleSendReaction}
        />
      )}

      {/* Mobile Live Chat slide-up panel */}
      <AnimatePresence>
        {isMobile && mobileChatOpen && (
          <ChatPanel
            roomId={room.id}
            profile={profile}
            messages={messages}
            participants={participants}
            isMobileView={true}
            onClose={() => setMobileChatOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Participants slide-up sheet */}
      <AnimatePresence>
        {isMobile && mobileParticipantsOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileParticipantsOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm pointer-events-auto"
            />
            
            {/* Slide up sheet */}
            <motion.aside
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.1, bottom: 1 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 200) {
                  setMobileParticipantsOpen(false);
                }
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md max-h-[85vh] bg-[#0c0c0e]/95 border-t border-white/10 rounded-t-[28px] flex flex-col relative overflow-hidden pointer-events-auto shadow-[0_-15px_40px_rgba(0,0,0,0.8)] pb-safe-bottom"
            >
              {/* Drag Handle */}
              <div className="flex-shrink-0 pt-3 pb-1 cursor-row-resize">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />
              </div>

              <div className="flex items-center justify-between border-b border-white/10 px-5 pb-3 pt-2">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">Participants</h2>
                  <p className="text-xs text-neutral-400">Manage audio levels & statuses</p>
                </div>
                <button
                  onClick={() => setMobileParticipantsOpen(false)}
                  className="text-xs text-neutral-400 hover:text-white px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition font-bold"
                >
                  Done
                </button>
              </div>
              
              <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-none">
                <ParticipantsPanel participants={participants} />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Options slide-up sheet */}
      <AnimatePresence>
        {isMobile && mobileOptionsOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOptionsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />
            
            {/* Slide up sheet */}
            <motion.aside
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.1, bottom: 1 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 200) {
                  setMobileOptionsOpen(false);
                }
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md max-h-[85vh] bg-[#0c0c0e]/95 border-t border-white/10 rounded-t-[28px] flex flex-col relative overflow-hidden pointer-events-auto shadow-[0_-15px_40px_rgba(0,0,0,0.8)] pb-safe-bottom"
            >
              {/* Drag Handle */}
              <div className="flex-shrink-0 pt-3 pb-1 cursor-row-resize">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />
              </div>

              <div className="flex items-center justify-between border-b border-white/10 px-5 pb-3 pt-2">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">Room Settings</h2>
                  <p className="text-xs text-neutral-400">Configure your call & theater options</p>
                </div>
                <button
                  onClick={() => setMobileOptionsOpen(false)}
                  className="text-xs text-neutral-400 hover:text-white px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition font-bold"
                >
                  Done
                </button>
              </div>
              
              <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-6 scrollbar-none">
                {/* Host & Actions Panel */}
                <section className="space-y-2.5">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => {
                        play("click");
                        setMobileOptionsOpen(false);
                        setInviteOpen(true);
                      }}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all text-left"
                    >
                      <Share2 className="h-4.5 w-4.5 text-[#ff3d47]" />
                      <span>Invite Friends</span>
                    </button>

                    {isHost && (
                      <button
                        onClick={() => {
                          play("click");
                          setMobileOptionsOpen(false);
                          setSelectorOpen(true);
                        }}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all text-left"
                      >
                        <Film className="h-4.5 w-4.5 text-[#ff3d47]" />
                        <span>Select Movie</span>
                      </button>
                    )}

                    {isHost && room.videoUrl && (
                      <button
                        onClick={() => {
                          setMobileOptionsOpen(false);
                          void handleSwitchToNormalVC();
                        }}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-red-400 text-xs font-bold transition-all text-left"
                      >
                        <VideoOff className="h-4.5 w-4.5" />
                        <span>Switch VC Mode</span>
                      </button>
                    )}

                    {isHost && (
                      <button
                        onClick={() => {
                          play("click");
                          setMobileOptionsOpen(false);
                          handleTriggerReadyCheck();
                        }}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-white/5 bg-[#ff3d47]/10 border-[#ff3d47]/20 text-[#ff3d47] text-xs font-bold transition-all text-left"
                      >
                        <Check className="h-4.5 w-4.5" />
                        <span>Ready Check</span>
                      </button>
                    )}
                  </div>
                </section>

                {/* Video Streaming Quality */}
                <section className="space-y-2.5">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Streaming Quality</h3>
                  <button
                    onClick={() => {
                      play("click");
                      setMobileOptionsOpen(false);
                      setQualityOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders className="h-4.5 w-4.5 text-[#ff3d47]" />
                      <span>Quality & Audio Tracks</span>
                    </div>
                    <span className="text-xs text-neutral-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                      {room.quality || "480p"}
                    </span>
                  </button>
                </section>

                {/* Master Volume Slider Control */}
                <section className="space-y-2.5">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Master Volume</h3>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-3">
                    <div className="flex justify-between items-center text-xs text-neutral-400">
                      <div className="flex items-center gap-2 text-white font-bold">
                        <Volume2 className="h-4 w-4 text-[#ff3d47]" />
                        <span>Volume Level</span>
                      </div>
                      <span className="font-mono">{Math.round(masterVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={masterVolume}
                      onChange={(e) => setMasterVolume(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full bg-neutral-800 accent-[#ff3d47] cursor-pointer"
                    />
                  </div>
                </section>

                {/* Speaker / Output Audio Device Selection */}
                <section className="space-y-2.5">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Speaker / Audio Output</h3>
                  <div className="relative">
                    <select
                      value={audioOutputDeviceId}
                      onChange={(e) => setAudioOutputDeviceId(e.target.value)}
                      className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-[#ff3d47] transition cursor-pointer"
                    >
                      <option value="default" className="bg-[#111] text-white">Default Speaker</option>
                      {speakers.map((device) => (
                        <option key={device.deviceId} value={device.deviceId} className="bg-[#111] text-white">
                          {device.label || `Speaker (${device.deviceId.slice(0, 5)})`}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Volume2 className="h-4 w-4" />
                    </div>
                  </div>
                </section>

                {/* Noise Suppression Toggle */}
                <section className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-[#ff3d47]" />
                      Krisp AI Noise Cancellation
                    </h4>
                    <p className="text-[11px] text-neutral-400 max-w-xs leading-relaxed">
                      Uses advanced voice filtering algorithms to eliminate background hums, fan whirring, and transient noises.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNoiseSuppressionEnabled(!noiseSuppressionEnabled)}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    style={{ backgroundColor: noiseSuppressionEnabled ? "#ff3d47" : "#262626" }}
                  >
                    <span
                      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      style={{ transform: noiseSuppressionEnabled ? "translateX(20px)" : "translateX(0px)" }}
                    />
                  </button>
                </section>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
