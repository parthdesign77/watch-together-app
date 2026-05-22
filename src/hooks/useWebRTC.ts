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
import { useUiStore } from "../store/uiStore";
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
  const audioInputDeviceId = useUiStore((state) => state.audioInputDeviceId);
  const noiseSuppressionEnabled = useUiStore((state) => state.noiseSuppressionEnabled);

  const [voiceStream, setVoiceStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const peers = useRef<Record<string, RTCPeerConnection>>({});
  const localStreams = useRef<MediaStream[]>([]);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const processedSignals = useRef<Set<string>>(new Set());
  const analyserCleanup = useRef<(() => void) | null>(null);
  const candidateQueue = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const negotiationState = useRef<Record<string, { makingOffer: boolean; ignoreOffer: boolean }>>({});

  const participantsRef = useRef(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const peerJoinedAt = useRef<Record<string, number>>({});

  const processQueuedCandidates = useCallback(async (remoteUid: string) => {
    const peer = peers.current[remoteUid];
    if (!peer || !peer.remoteDescription) return;
    const queue = candidateQueue.current[remoteUid] || [];
    candidateQueue.current[remoteUid] = [];
    for (const candidate of queue) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Error adding queued ICE candidate:", err);
      }
    }
  }, []);

  const sendSignal = useCallback(
    async (payload: Omit<SignalPayload, "createdAt">) => {
      if (!roomId) return;
      const receiverJoinedAt = participantsRef.current.find((p) => p.uid === payload.to)?.joinedAt || 0;
      await addDoc(collection(db, "rooms", roomId, "signals"), {
        ...payload,
        receiverJoinedAt,
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
      negotiationState.current[remoteUid] = { makingOffer: false, ignoreOffer: false };

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

      peer.onnegotiationneeded = async () => {
        try {
          negotiationState.current[remoteUid].makingOffer = true;
          const offer = await peer.createOffer();
          if (peer.signalingState !== "stable") return;
          await peer.setLocalDescription(offer);
          await sendSignal({
            type: "offer",
            from: uid,
            to: remoteUid,
            sdp: peer.localDescription!
          });
        } catch (err) {
          console.error("Error in onnegotiationneeded:", err);
        } finally {
          negotiationState.current[remoteUid].makingOffer = false;
        }
      };

      peer.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        
        event.track.onended = () => {
          console.log(`Track ${event.track.id} (${event.track.kind}) ended for peer ${remoteUid}`);
          setRemoteStreams((current) => {
            return current.filter((item) => {
              if (item.uid === remoteUid && item.id === stream.id) {
                // Only keep remote streams that have at least one active track
                return item.stream.getTracks().some((t) => t.readyState === "live");
              }
              return true;
            });
          });
        };

        setRemoteStreams((current) => {
          const exists = current.some((item) => item.uid === remoteUid && item.id === stream.id);
          if (exists) return current;
          return [...current, { uid: remoteUid, id: stream.id, stream }];
        });
      };

      peer.onconnectionstatechange = () => {
        if (["closed", "failed", "disconnected"].includes(peer.connectionState)) {
          console.log(`Connection state with ${remoteUid} changed to ${peer.connectionState}. Cleaning up.`);
          try {
            peer.close();
          } catch (e) {}
          if (peers.current[remoteUid] === peer) {
            delete peers.current[remoteUid];
            delete candidateQueue.current[remoteUid];
            delete negotiationState.current[remoteUid];
            delete peerJoinedAt.current[remoteUid];
          }
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
        const senders = peer.getSenders();
        stream.getTracks().forEach((track) => {
          const alreadyAdded = senders.some((s) => s.track?.id === track.id);
          if (!alreadyAdded) {
            try {
              peer.addTrack(track, stream);
            } catch (e) {
              console.warn("Error adding track to peer:", e);
            }
          }
        });
      });
      void broadcastOffers();
    },
    [broadcastOffers]
  );

  const removeLocalStream = useCallback(
    (stream: MediaStream) => {
      localStreams.current = localStreams.current.filter((item) => item.id !== stream.id);
      const trackIds = new Set(stream.getTracks().map((t) => t.id));
      Object.values(peers.current).forEach((peer) => {
        peer.getSenders().forEach((sender) => {
          if (sender.track && trackIds.has(sender.track.id)) {
            try {
              peer.removeTrack(sender);
            } catch (e) {
              console.warn("Error removing track from peer:", e);
            }
          }
        });
      });
      void broadcastOffers();
    },
    [broadcastOffers]
  );

  const startVoice = useCallback(async () => {
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((track) => track.stop());
      removeLocalStream(voiceStreamRef.current);
      analyserCleanup.current?.();
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: audioInputDeviceId && audioInputDeviceId !== "default" ? { exact: audioInputDeviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: noiseSuppressionEnabled,
        autoGainControl: true
      }
    });
    voiceStreamRef.current = stream;
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
      const isTrackMuted = stream.getAudioTracks().some((t) => !t.enabled);
      setSpeaking(volume > 18 && !isTrackMuted);
      raf = requestAnimationFrame(tick);
    };
    tick();

    analyserCleanup.current = () => {
      cancelAnimationFrame(raf);
      void audioContext.close();
    };
  }, [addLocalStream, removeLocalStream, audioInputDeviceId, noiseSuppressionEnabled]);

  useEffect(() => {
    if (voiceStreamRef.current) {
      void startVoice();
    }
  }, [audioInputDeviceId, noiseSuppressionEnabled, startVoice]);

  const startCamera = useCallback(async (plan?: string) => {
    let videoConstraints: MediaTrackConstraints = {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 24, max: 30 }
    };

    if (plan === "premium") {
      videoConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 60 }
      };
    } else if (plan === "standard") {
      videoConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 60 }
      };
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });
    } catch (err) {
      console.warn("Camera failed with preferred constraints, retrying with flexible defaults...", err);
      try {
        // Retry with highly standard lenient constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
      } catch (err2) {
        console.warn("Camera failed with lenient constraints, trying fallback to any video capture...", err2);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
    }

    setCameraStream(stream);
    addLocalStream(stream);
    return stream;
  }, [addLocalStream]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      removeLocalStream(cameraStream);
      setCameraStream(null);
    }
  }, [cameraStream, removeLocalStream]);

  const startScreenShare = useCallback(async (mode: "entire-screen" | "window" = "entire-screen", plan?: string) => {
    let videoConstraints: MediaTrackConstraints = {
      displaySurface: mode === "entire-screen" ? "monitor" : "window",
      width: { ideal: 854 },
      height: { ideal: 480 },
      frameRate: { ideal: 15, max: 30 }
    };

    if (plan === "premium") {
      videoConstraints = {
        displaySurface: mode === "entire-screen" ? "monitor" : "window",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 60 }
      };
    } else if (plan === "standard") {
      videoConstraints = {
        displaySurface: mode === "entire-screen" ? "monitor" : "window",
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 60 }
      };
    }

    let stream: MediaStream;
    try {
      // Attempt 1: High-fidelity flat audio profile for screenshare system/movie audio
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: videoConstraints,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } as any
      });
    } catch (e) {
      console.warn("Failed screen share with high-fidelity audio, trying standard audio...", e);
      try {
        // Attempt 2: Standard audio
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: videoConstraints,
          audio: true
        });
      } catch (e2) {
        console.warn("Failed screen share with standard audio, trying video-only fallback...", e2);
        // Attempt 3: Video-only fallback to guarantee screenshare opens successfully
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: videoConstraints,
          audio: false
        });
      }
    }

    setScreenStream(stream);
    addLocalStream(stream);

    stream.getVideoTracks()[0]?.addEventListener("ended", () => {
      stream.getTracks().forEach((track) => track.stop());
      removeLocalStream(stream);
      setScreenStream(null);
    });
    return stream;
  }, [addLocalStream, removeLocalStream]);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      removeLocalStream(screenStream);
      setScreenStream(null);
    }
  }, [screenStream, removeLocalStream]);

  const toggleMute = useCallback((forceState?: boolean) => {
    setMuted((nextMuted) => {
      const shouldMute = forceState !== undefined ? forceState : !nextMuted;
      voiceStream?.getAudioTracks().forEach((track) => {
        track.enabled = !shouldMute;
      });
      return shouldMute;
    });
  }, [voiceStream]);

  useEffect(() => {
    if (!roomId || !uid) return;

    const signalsQuery = query(collection(db, "rooms", roomId, "signals"), where("to", "==", uid), orderBy("createdAt", "asc"));
    return onSnapshot(
      signalsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;

          if (processedSignals.current.has(change.doc.id)) return;
          processedSignals.current.add(change.doc.id);

          const signal = change.doc.data() as SignalPayload & { receiverJoinedAt?: number };

          // Filter out signaling documents older than 1 minute to avoid processing old session data
          const signalAge = Date.now() - signal.createdAt;
          if (signalAge > 60000) return;

          // Ignore signals targeted to an older session of this user
          const localParticipant = participantsRef.current.find((p) => p.uid === uid);
          const localJoinedAt = localParticipant?.joinedAt || 0;
          if (signal.receiverJoinedAt && localJoinedAt && signal.receiverJoinedAt !== localJoinedAt) {
            console.log(`Ignoring signal from ${signal.from} with receiverJoinedAt ${signal.receiverJoinedAt} because our localJoinedAt is ${localJoinedAt}`);
            return;
          }

          const peer = createPeer(signal.from);
          const neg = negotiationState.current[signal.from] || { makingOffer: false, ignoreOffer: false };

          void (async () => {
            if (signal.type === "offer" && signal.sdp) {
              try {
                const isPolite = uid > signal.from;
                const offerCollision = neg.makingOffer || peer.signalingState !== "stable";

                neg.ignoreOffer = !isPolite && offerCollision;
                if (neg.ignoreOffer) {
                  console.log("Collision: impolite peer ignoring offer from", signal.from);
                  return;
                }

                if (offerCollision) {
                  console.log("Collision: polite peer rolling back for", signal.from);
                  await peer.setLocalDescription({ type: "rollback" });
                }

                await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                await sendSignal({
                  type: "answer",
                  from: uid,
                  to: signal.from,
                  sdp: peer.localDescription!
                });
                await processQueuedCandidates(signal.from);
              } catch (err) {
                console.error("Error processing SDP offer:", err);
              }
            }

            if (signal.type === "answer" && signal.sdp) {
              try {
                await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                await processQueuedCandidates(signal.from);
              } catch (err) {
                console.error("Error setting remote description for answer:", err);
              }
            }

            if (signal.type === "candidate" && signal.candidate) {
              try {
                if (peer.remoteDescription) {
                  await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } else {
                  if (!candidateQueue.current[signal.from]) {
                    candidateQueue.current[signal.from] = [];
                  }
                  candidateQueue.current[signal.from].push(signal.candidate);
                }
              } catch (err) {
                if (!neg.ignoreOffer) {
                  console.warn("Error processing ICE candidate:", err);
                }
              }
            }
          })();
        });
      },
      (error) => {
        console.warn("[useWebRTC] signalsQuery onSnapshot error:", error);
      }
    );
  }, [createPeer, processQueuedCandidates, roomId, sendSignal, uid]);

  useEffect(() => {
    if (!roomId || !uid) return;
    void updateDoc(doc(db, "rooms", roomId), {
      [`participants.${uid}.isMuted`]: muted,
      [`participants.${uid}.isSpeaking`]: speaking
    }).catch(() => undefined);
  }, [muted, roomId, speaking, uid]);

  // Synchronize peer connections and remote streams with current participants
  const participantsKey = participants
    .map((p) => `${p.uid}:${p.joinedAt}`)
    .sort()
    .join(",");

  useEffect(() => {
    if (!uid) return;

    const currentRemoteUids = new Set(participants.map((p) => p.uid).filter((id) => id !== uid));

    // Close and clean up connections for participants who left or rejoined (joinedAt changed)
    Object.keys(peers.current).forEach((remoteUid) => {
      const participant = participants.find((p) => p.uid === remoteUid);
      const wasRejoined = participant && peerJoinedAt.current[remoteUid] !== participant.joinedAt;

      if (!currentRemoteUids.has(remoteUid) || wasRejoined) {
        console.log(`Cleaning up WebRTC peer connection for user ${remoteUid} (left or rejoined)`);
        try {
          peers.current[remoteUid].close();
        } catch (e) {
          console.warn(`Error closing peer connection for ${remoteUid}:`, e);
        }
        delete peers.current[remoteUid];
        delete candidateQueue.current[remoteUid];
        delete peerJoinedAt.current[remoteUid];
      }
    });

    // Clean up corresponding remote streams
    setRemoteStreams((current) => current.filter((item) => currentRemoteUids.has(item.uid) && peerJoinedAt.current[item.uid] !== undefined));

    // Track the active peer joinedAt timestamps
    const remotesToConnect = participants.filter((p) => p.uid !== uid);
    remotesToConnect.forEach((p) => {
      peerJoinedAt.current[p.uid] = p.joinedAt;
    });

    // Re-negotiate/connect to current participants in the room
    if (currentRemoteUids.size > 0) {
      void broadcastOffers();
    }
  }, [participantsKey, uid, broadcastOffers]);

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
