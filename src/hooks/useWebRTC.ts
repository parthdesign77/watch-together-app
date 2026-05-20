import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { turnServers } from "../lib/constants";
import { db } from "../lib/firebase";
import type { Participant } from "../types";

type SignalType = "offer" | "answer" | "candidate";

interface SignalPayload {
  type: SignalType;
  from: string;
  to: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  createdAt: number;
}

export interface RemoteStream {
  uid: string;
  id: string;
  stream: MediaStream;
}

export function useWebRTC(roomId: string | undefined, uid: string | undefined, participants: Participant[]) {
  const [voiceStream, setVoiceStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const peers = useRef<Record<string, RTCPeerConnection>>({});
  const localStreams = useRef<MediaStream[]>([]);
  const processedSignals = useRef<Set<string>>(new Set());
  const analyserCleanup = useRef<(() => void) | null>(null);

  const sendSignal = useCallback(
    async (payload: Omit<SignalPayload, "createdAt">) => {
      if (!roomId) return;
      await addDoc(collection(db, "rooms", roomId, "signals"), {
        ...payload,
        createdAt: Date.now(),
        createdAtServer: serverTimestamp()
      });
    },
    [roomId]
  );

  const createPeer = useCallback(
    (remoteUid: string) => {
      if (!roomId || !uid) throw new Error("Missing room or user for peer setup.");
      if (peers.current[remoteUid]) return peers.current[remoteUid];

      const peer = new RTCPeerConnection({ iceServers: turnServers });
      peers.current[remoteUid] = peer;

      localStreams.current.forEach((stream) => {
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      });

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          void sendSignal({
            type: "candidate",
            from: uid,
            to: remoteUid,
            candidate: event.candidate.toJSON()
          });
        }
      };

      peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        setRemoteStreams((current) => {
          const withoutExisting = current.filter((item) => !(item.uid === remoteUid && item.id === stream.id));
          return [...withoutExisting, { uid: remoteUid, id: stream.id, stream }];
        });
      };

      peer.onconnectionstatechange = () => {
        if (["closed", "failed", "disconnected"].includes(peer.connectionState)) {
          setRemoteStreams((current) => current.filter((item) => item.uid !== remoteUid));
        }
      };

      return peer;
    },
    [roomId, sendSignal, uid]
  );

  const broadcastOffers = useCallback(async () => {
    if (!uid) return;
    const remotes = participants.filter((participant) => participant.uid !== uid);
    await Promise.all(
      remotes.map(async (participant) => {
        const peer = createPeer(participant.uid);
        const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await peer.setLocalDescription(offer);
        await sendSignal({ type: "offer", from: uid, to: participant.uid, sdp: offer });
      })
    );
  }, [createPeer, participants, sendSignal, uid]);

  const addLocalStream = useCallback(
    (stream: MediaStream) => {
      localStreams.current = [...localStreams.current.filter((item) => item.id !== stream.id), stream];
      Object.values(peers.current).forEach((peer) => {
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      });
      void broadcastOffers();
    },
    [broadcastOffers]
  );

  const startVoice = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    setVoiceStream(stream);
    addLocalStream(stream);
    setMuted(false);

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 256;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const volume = data.reduce((sum, value) => sum + value, 0) / data.length;
      setSpeaking(volume > 18 && !muted);
      raf = requestAnimationFrame(tick);
    };
    tick();

    analyserCleanup.current = () => {
      cancelAnimationFrame(raf);
      void audioContext.close();
    };
  }, [addLocalStream, muted]);

  const startCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 60 }
      },
      audio: false
    });
    setCameraStream(stream);
    addLocalStream(stream);
  }, [addLocalStream]);

  const stopCamera = useCallback(() => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  }, [cameraStream]);

  const startScreenShare = useCallback(async (mode: "entire-screen" | "window" = "entire-screen") => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: mode === "entire-screen" ? "monitor" : "window",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 60 }
      } as MediaTrackConstraints,
      audio: true
    });
    setScreenStream(stream);
    addLocalStream(stream);
    stream.getVideoTracks()[0]?.addEventListener("ended", () => {
      setScreenStream(null);
    });
  }, [addLocalStream]);

  const stopScreenShare = useCallback(() => {
    screenStream?.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
  }, [screenStream]);

  const toggleMute = useCallback(() => {
    setMuted((nextMuted) => {
      const shouldMute = !nextMuted;
      voiceStream?.getAudioTracks().forEach((track) => {
        track.enabled = !shouldMute;
      });
      return shouldMute;
    });
  }, [voiceStream]);

  useEffect(() => {
    if (!roomId || !uid) return;

    const signalsQuery = query(collection(db, "rooms", roomId, "signals"), where("to", "==", uid), orderBy("createdAt", "asc"));
    return onSnapshot(signalsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added" || processedSignals.current.has(change.doc.id)) return;
        processedSignals.current.add(change.doc.id);

        const signal = change.doc.data() as SignalPayload;
        const peer = createPeer(signal.from);

        void (async () => {
          if (signal.type === "offer" && signal.sdp) {
            await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await sendSignal({ type: "answer", from: uid, to: signal.from, sdp: answer });
          }

          if (signal.type === "answer" && signal.sdp && !peer.currentRemoteDescription) {
            await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }

          if (signal.type === "candidate" && signal.candidate) {
            await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        })();
      });
    });
  }, [createPeer, roomId, sendSignal, uid]);

  useEffect(() => {
    if (!roomId || !uid) return;
    void updateDoc(doc(db, "rooms", roomId), {
      [`participants.${uid}.isMuted`]: muted,
      [`participants.${uid}.isSpeaking`]: speaking
    }).catch(() => undefined);
  }, [muted, roomId, speaking, uid]);

  useEffect(() => {
    return () => {
      analyserCleanup.current?.();
      localStreams.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
      Object.values(peers.current).forEach((peer) => peer.close());
    };
  }, []);

  return {
    voiceStream,
    cameraStream,
    screenStream,
    remoteStreams,
    muted,
    speaking,
    startVoice,
    startCamera,
    stopCamera,
    startScreenShare,
    stopScreenShare,
    toggleMute,
    broadcastOffers
  };
}
