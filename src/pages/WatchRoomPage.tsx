import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, MonitorUp, Radio, ShieldAlert } from "lucide-react";
import { Navigate, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { AmbientSoundControl } from "../components/room/AmbientSoundControl";
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
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { joinRoomById, updateRoomState, useParticipants, useRoom } from "../hooks/useRooms";
import { useWebRTC } from "../hooks/useWebRTC";
import { useUiStore } from "../store/uiStore";
import { playSound } from "../lib/sounds";

export function WatchRoomPage() {
  const { roomId } = useParams();
  const [params] = useSearchParams();
  const { profile } = useAuth();
  const { room, loading } = useRoom(roomId);
  const participants = useParticipants(room);
  const [inviteOpen, setInviteOpen] = useState(Boolean(params.get("code")));
  const [qualityOpen, setQualityOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const isHost = Boolean(room && profile && room.hostId === profile.uid);
  const webRTC = useWebRTC(room?.id, profile?.uid, participants);

  const remoteScreenStream = useMemo(
    () => webRTC.remoteStreams.find((item) => item.uid === room?.screenShareHost && item.stream.getVideoTracks().length > 0)?.stream || null,
    [room?.screenShareHost, webRTC.remoteStreams]
  );

  const cameraFeeds = useMemo<CameraFeed[]>(() => {
    const feeds: CameraFeed[] = [];
    if (webRTC.cameraStream && profile) {
      feeds.push({ id: `${profile.uid}-local-camera`, name: `${profile.name} camera`, stream: webRTC.cameraStream, muted: true });
    }

    webRTC.remoteStreams
      .filter((item) => item.stream.getVideoTracks().length > 0)
      .filter((item) => item.stream !== remoteScreenStream)
      .filter((item) => room?.participants?.[item.uid]?.isCameraOn || !room?.isScreenSharing)
      .forEach((item) => {
        feeds.push({
          id: `${item.uid}-${item.id}`,
          name: `${room?.participants?.[item.uid]?.name || "Guest"} camera`,
          stream: item.stream
        });
      });

    return feeds;
  }, [profile, remoteScreenStream, room?.isScreenSharing, room?.participants, webRTC.cameraStream, webRTC.remoteStreams]);

  // Clean redirection if the room is ended by the host
  useEffect(() => {
    if (room && room.status === "ended") {
      pushToast({
        title: "Room ended",
        description: "The host has closed this watch room.",
        type: "info"
      });
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
    if (!room || !profile || !joined || webRTC.voiceStream) return;
    void webRTC.startVoice().catch(() => {
      pushToast({ title: "Voice permission needed", description: "Use the Voice button when you are ready to connect your mic.", type: "info" });
    });
  }, [joined, profile, pushToast, room, webRTC]);

  // Auto-enable camera in camera-first rooms (no movie URL loaded initially)
  useEffect(() => {
    if (joined && room && !room.videoUrl && !webRTC.cameraStream) {
      toggleCamera().catch(() => undefined);
    }
  }, [joined, room?.videoUrl]);

  if (!roomId) return <Navigate to="/dashboard" replace />;

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="glass flex items-center gap-3 rounded-lg p-5">
          <Loader2 className="h-5 w-5 animate-spin text-cyan" />
          <span className="font-semibold">Connecting to room...</span>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="glass rounded-lg p-8">
        <ShieldAlert className="h-10 w-10 text-danger" />
        <h1 className="mt-4 font-display text-3xl font-black">Room expired or unavailable</h1>
        <p className="mt-2 text-muted">Ask the host for a new invite link or create a new watch room.</p>
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  const currentRoom = room;
  const currentProfile = profile;
  const remoteAudioStreams = webRTC.remoteStreams.filter((item) => item.stream.getAudioTracks().length > 0);
  const screenShareActive = Boolean(webRTC.screenStream || remoteScreenStream || room.isScreenSharing);
  const cameraOnlyMode = cameraFeeds.length > 0 && !screenShareActive;

  async function shareScreen(mode: "entire-screen" | "window") {
    try {
      await webRTC.startScreenShare(mode, profile?.subscriptionPlan);
      await updateRoomState(currentRoom.id, {
        isScreenSharing: true,
        screenShareHost: currentProfile.uid,
        status: "screen-sharing",
        [`participants.${currentProfile.uid}.isScreenSharing`]: true
      });
      pushToast({
        title: mode === "entire-screen" ? "Entire screen is live" : "Window share is live",
        description: "Friends will receive the HD stream through WebRTC.",
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
      [`participants.${currentProfile.uid}.isScreenSharing`]: false
    });
  }

  async function toggleCamera() {
    try {
      if (webRTC.cameraStream) {
        webRTC.stopCamera();
        await updateRoomState(currentRoom.id, {
          [`participants.${currentProfile.uid}.isCameraOn`]: false
        });
        return;
      }

      await webRTC.startCamera(profile?.subscriptionPlan);
      await updateRoomState(currentRoom.id, {
        [`participants.${currentProfile.uid}.isCameraOn`]: true
      });
      pushToast({ title: "Camera on", description: "Camera fills the room without screen share and becomes PiP during screen share.", type: "success" });
    } catch (error) {
      pushToast({ title: "Camera unavailable", description: error instanceof Error ? error.message : "Check camera permissions.", type: "error" });
    }
  }

  return (
    <div className="space-y-4">
      <RoomControls
        room={room}
        isHost={isHost}
        muted={webRTC.muted}
        onInvite={() => setInviteOpen(true)}
        onStartVoice={() =>
          webRTC
            .startVoice()
            .then(() => pushToast({ title: "Voice connected", description: "Noise suppression and speaking indicators are active.", type: "success" }))
            .catch((error) => pushToast({ title: "Voice unavailable", description: error.message, type: "error" }))
        }
        onToggleMute={webRTC.toggleMute}
        onToggleCamera={toggleCamera}
        onShareScreen={shareScreen}
        onStopScreen={stopScreen}
        onOpenQuality={() => setQualityOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSelector={() => setSelectorOpen(true)}
        hasCameraStream={Boolean(webRTC.cameraStream)}
        hasScreenStream={Boolean(webRTC.screenStream)}
      />

      <div className={`grid gap-4 ${room.theaterMode ? "xl:grid-cols-[1fr_360px]" : "xl:grid-cols-[1fr_380px]"}`}>
        <div className="space-y-4">
          {cameraOnlyMode ? (
            <CameraStage feeds={cameraFeeds} screenShareActive={false} />
          ) : (
            <VideoStage
              room={room}
              isHost={isHost}
              screenStream={webRTC.screenStream}
              remoteScreenStream={remoteScreenStream}
              cameraFeeds={cameraFeeds}
            />
          )}

          <section className="grid gap-4 md:grid-cols-3">
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Radio className="h-5 w-5 text-anime" />
                <div>
                  <p className="text-sm font-bold">Latency Engine</p>
                  <p className="text-xs text-muted">Heartbeat sync · drift correction · adaptive buffering</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MonitorUp className="h-5 w-5 text-cyan" />
                <div>
                  <p className="text-sm font-bold">Screen Share</p>
                  <p className="text-xs text-muted">{room.isScreenSharing ? "HD stream receiving" : "Entire screen or window-only sharing"}</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-movie" />
                <div>
                  <p className="text-sm font-bold">Audio Layers</p>
                  <p className="text-xs text-muted">Content audio · voice layer · ambient layer</p>
                </div>
              </div>
            </div>
          </section>

          {webRTC.screenStream ? (
            <section className="glass rounded-lg p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Your Live Screen</h2>
                <Badge tone="red">LIVE</Badge>
              </div>
              <StreamVideo stream={webRTC.screenStream} muted className="max-h-64 w-full rounded-lg bg-black object-contain" />
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          <ParticipantsPanel participants={participants} />
          <AmbientSoundControl isScreenSharing={screenShareActive} />
          <ChatPanel roomId={room.id} profile={profile} />
        </div>
      </div>

      {remoteAudioStreams.map((item) => (
        <StreamAudio key={`${item.uid}-${item.id}`} stream={item.stream} />
      ))}

      <InviteModal open={inviteOpen} room={room} onClose={() => setInviteOpen(false)} />
      <QualitySelectModal open={qualityOpen} onClose={() => setQualityOpen(false)} room={room} />
      <RoomSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} room={room} isHost={isHost} />
      <MovieSelectorModal open={selectorOpen} onClose={() => setSelectorOpen(false)} room={room} />
    </div>
  );
}
