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
  const deafened = useUiStore((state) => state.deafened);

  const [voiceStream, setVoiceStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [muted, setMuted] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  // Automatically mute the microphone and disable tracks whenever deafened is activated
  useEffect(() => {
    if (deafened) {
      setMuted(true);
      const stream = voiceStreamRef.current;
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      const processedStream = processedVoiceStreamRef.current;
      if (processedStream) {
        processedStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
    }
  }, [deafened]);
  const peers = useRef<Record<string, RTCPeerConnection>>({});
  const localStreams = useRef<MediaStream[]>([]);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const processedVoiceStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const processedSignals = useRef<Set<string>>(new Set());
  const analyserCleanup = useRef<(() => void) | null>(null);
  const candidateQueue = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const negotiationPending = useRef<Record<string, boolean>>({});
  const negotiationState = useRef<Record<string, { makingOffer: boolean; ignoreOffer: boolean }>>({});
  const negotiateHandlers = useRef<Record<string, () => Promise<void>>>({});
  const mutedRef = useRef(false);
  const lastAudioDeviceId = useRef<string | undefined>(undefined);
  const lastNoiseSuppression = useRef<boolean>(false);
  const sessionStartTime = useRef(Date.now() - 5000);

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
      if (!remoteUid || remoteUid === "undefined") {
        console.warn(`[WebRTC] Cannot create PeerConnection for invalid/undefined remote user: ${remoteUid}`);
        return null;
      }
      if (peers.current[remoteUid]) return peers.current[remoteUid];

      console.log(`[WebRTC] Creating PeerConnection for remote user: ${remoteUid}`);
      const peer = new RTCPeerConnection({ iceServers: turnServers });
      peers.current[remoteUid] = peer;
      negotiationState.current[remoteUid] = { makingOffer: false, ignoreOffer: false };
      negotiationPending.current[remoteUid] = false;

      localStreams.current.forEach((stream) => {
        stream.getTracks().forEach(async (track) => {
          const senders = peer.getSenders();
          const alreadyAdded = senders.some((s) => s.track?.id === track.id);
          if (!alreadyAdded) {
            console.log(`[Track Add] Adding local track: kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState} to peer ${remoteUid}`);
            const sender = peer.addTrack(track, stream);
            
            // Apply screen-share bitrate and framerate constraints to new peers
            if (sender && track.kind === "video" && stream === screenStreamRef.current) {
              try {
                const params = sender.getParameters();
                if (!params.encodings) {
                  params.encodings = [{}];
                }
                const ourParticipant = participantsRef.current.find(p => p.uid === uid);
                const myPlan = ourParticipant?.subscriptionPlan || "free";
                const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
                
                let maxBitrate = 800000;
                if (myPlan === "premium") {
                  maxBitrate = isMobileDevice ? 1500000 : 6000000;
                } else if (myPlan === "standard") {
                  maxBitrate = isMobileDevice ? 1000000 : 2500000;
                } else {
                  maxBitrate = isMobileDevice ? 600000 : 800000;
                }
                
                params.encodings[0].maxBitrate = maxBitrate;
                
                // Mobile-specific encoder scaling and framerate optimizations
                if (isMobileDevice) {
                  if (myPlan === "premium") {
                    params.encodings[0].scaleResolutionDownBy = 1.2;
                    params.encodings[0].maxFramerate = 24;
                  } else if (myPlan === "standard") {
                    params.encodings[0].scaleResolutionDownBy = 1.6;
                    params.encodings[0].maxFramerate = 20;
                  } else {
                    params.encodings[0].scaleResolutionDownBy = 2.2;
                    params.encodings[0].maxFramerate = 15;
                  }
                  console.log(`[WebRTC Mobile] Optimized screen-share encodings on peer init: scale=${params.encodings[0].scaleResolutionDownBy}, fps=${params.encodings[0].maxFramerate}`);
                }
                
                await sender.setParameters(params);
                console.log(`[WebRTC] Enforced screen-share maxBitrate: ${maxBitrate} bps for new peer ${remoteUid}`);
              } catch (bitrateErr) {
                console.warn("[WebRTC] Failed to set screen share bitrate parameters on new peer:", bitrateErr);
              }
            }
          }
        });
      });

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`[ICE] Local candidate found for peer ${remoteUid}: ${event.candidate.candidate}`);
          void sendSignal({
            type: "candidate",
            from: uid,
            to: remoteUid,
            candidate: event.candidate.toJSON()
          });
        }
      };

      peer.oniceconnectionstatechange = () => {
        console.log(`[ICE Connection] Connection with peer ${remoteUid} changed to: ${peer.iceConnectionState}`);
      };

      const negotiate = async () => {
        try {
          const isPolite = uid > remoteUid;
          if (!isPolite && !peer.remoteDescription) {
            console.log(`[Negotiation] Impolite peer skipping negotiation during initial setup.`);
            negotiationPending.current[remoteUid] = true;
            return;
          }

          console.log(`[Negotiation] Starting negotiation for peer ${remoteUid}, signalingState=${peer.signalingState}`);
          if (peer.signalingState !== "stable") {
            console.log(`[Negotiation] Peer signaling state is ${peer.signalingState}, queueing negotiation.`);
            negotiationPending.current[remoteUid] = true;
            return;
          }
          negotiationState.current[remoteUid].makingOffer = true;
          const offer = await peer.createOffer();
          if (peer.signalingState !== "stable") {
            console.log(`[Negotiation] Signaling state changed during createOffer to ${peer.signalingState}, queueing.`);
            negotiationPending.current[remoteUid] = true;
            return;
          }
          console.log(`[Negotiation] Setting local description and sending offer to ${remoteUid}`);
          await peer.setLocalDescription(offer);
          await sendSignal({
            type: "offer",
            from: uid,
            to: remoteUid,
            sdp: {
              type: peer.localDescription!.type,
              sdp: peer.localDescription!.sdp
            }
          });
        } catch (err) {
          console.error(`Error in negotiation with ${remoteUid}:`, err);
        } finally {
          negotiationState.current[remoteUid].makingOffer = false;
        }
      };

      negotiateHandlers.current[remoteUid] = negotiate;

      peer.onsignalingstatechange = () => {
        console.log(`[Signaling] Signaling state with peer ${remoteUid} changed to: ${peer.signalingState}`);
        if (peer.signalingState === "stable" && negotiationPending.current[remoteUid]) {
          console.log(`[Signaling] Peer ${remoteUid} is now stable. Running queued negotiation.`);
          negotiationPending.current[remoteUid] = false;
          void negotiate();
        }
      };

      peer.onnegotiationneeded = () => {
        console.log(`[Negotiation] Negotiation needed triggered for peer ${remoteUid}`);
        void negotiate();
      };

      peer.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        console.log(`[Track Recv] Received track from ${remoteUid}: kind=${event.track.kind}, enabled=${event.track.enabled}, readyState=${event.track.readyState}, streamId=${stream.id}`);
        
        // Optimize WebRTC playout jitter buffer for ultra-low latency audio
        const receiver = event.receiver;
        if (receiver) {
          try {
            if ("jitterBufferTarget" in receiver) {
              (receiver as any).jitterBufferTarget = 0; // 0ms target (low latency)
              console.log(`[WebRTC] Set jitterBufferTarget to 0ms for ${remoteUid} (${event.track.kind})`);
            } else if ("playoutDelayHint" in receiver) {
              (receiver as any).playoutDelayHint = 0; // 0 seconds target
              console.log(`[WebRTC] Set playoutDelayHint to 0s for ${remoteUid} (${event.track.kind})`);
            }
          } catch (e) {
            console.warn("[WebRTC] Failed to set receiver delay hint:", e);
          }
        }

        event.track.onended = () => {
          console.log(`[Track Ended] Track ${event.track.id} (${event.track.kind}) ended for peer ${remoteUid}`);
          setRemoteStreams((current) => {
            return current.filter((item) => {
              if (item.uid === remoteUid && item.id === stream.id) {
                const hasActive = item.stream.getTracks().some((t) => t.readyState === "live");
                console.log(`[Track Ended] Checking remaining tracks for stream ${stream.id}: hasActive=${hasActive}`);
                return hasActive;
              }
              return true;
            });
          });
        };

        setRemoteStreams((current) => {
          const streamIndex = current.findIndex((item) => item.uid === remoteUid && item.id === stream.id);
          if (streamIndex > -1) {
            console.log(`[Track Recv] Stream ${stream.id} already exists. Updating tracks to force React re-render.`);
            const updated = [...current];
            updated[streamIndex] = {
              ...updated[streamIndex],
              stream: new MediaStream(stream.getTracks())
            };
            return updated;
          }
          console.log(`[Track Recv] Adding new remote stream ${stream.id} for user ${remoteUid}`);
          return [...current, { uid: remoteUid, id: stream.id, stream: new MediaStream(stream.getTracks()) }];
        });
      };

      peer.onconnectionstatechange = () => {
        console.log(`[Connection State] Peer ${remoteUid} changed connectionState to: ${peer.connectionState}`);
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
            delete negotiateHandlers.current[remoteUid];
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
    const remotes = participantsRef.current.filter(
      (participant) => participant.uid && participant.uid !== "undefined" && participant.uid !== uid
    );
    await Promise.all(
      remotes.map(async (participant) => {
        // Enforce signaling collision logic:
        // Only initiate offer if our uid > participant's uid
        if (uid < participant.uid) {
          console.log(`[WebRTC] Skipping initiating offer to ${participant.uid} (waiting for polite peer signaling)`);
          return;
        }
        const peer = createPeer(participant.uid);
        if (!peer) return;
        if (peer.connectionState === "connected" || peer.connectionState === "connecting") {
          const handler = negotiateHandlers.current[participant.uid];
          if (handler) void handler();
          return;
        }

        console.log(`[WebRTC] Initiating offer to ${participant.uid}`);
        const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await peer.setLocalDescription(offer);
        await sendSignal({
          type: "offer",
          from: uid,
          to: participant.uid,
          sdp: {
            type: offer.type,
            sdp: offer.sdp
          }
        });
      })
    );
  }, [createPeer, sendSignal, uid]);

  const addLocalStream = useCallback(
    (stream: MediaStream, plan?: string) => {
      localStreams.current = [...localStreams.current.filter((item) => item.id !== stream.id), stream];
      
      const ourParticipant = participantsRef.current.find(p => p.uid === uid);
      const myPlan = plan || ourParticipant?.subscriptionPlan || "free";

      Object.values(peers.current).forEach(async (peer) => {
        const senders = peer.getSenders();
        for (const track of stream.getTracks()) {
          let sender = senders.find((s) => s.track?.id === track.id);
          if (!sender) {
            try {
              sender = peer.addTrack(track, stream);
            } catch (e) {
              console.warn("Error adding track to peer:", e);
            }
          }
          
          if (sender && track.kind === "video" && stream === screenStreamRef.current) {
            try {
              const params = sender.getParameters();
              if (!params.encodings) {
                params.encodings = [{}];
              }
              const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
              
              let maxBitrate = 800000;
              if (myPlan === "premium") {
                maxBitrate = isMobileDevice ? 1500000 : 6000000;
              } else if (myPlan === "standard") {
                maxBitrate = isMobileDevice ? 1000000 : 2500000;
              } else {
                maxBitrate = isMobileDevice ? 600000 : 800000;
              }
              
              params.encodings[0].maxBitrate = maxBitrate;
              
              // Mobile-specific encoder scaling and framerate optimizations
              if (isMobileDevice) {
                if (myPlan === "premium") {
                  params.encodings[0].scaleResolutionDownBy = 1.2;
                  params.encodings[0].maxFramerate = 24;
                } else if (myPlan === "standard") {
                  params.encodings[0].scaleResolutionDownBy = 1.6;
                  params.encodings[0].maxFramerate = 20;
                } else {
                  params.encodings[0].scaleResolutionDownBy = 2.2;
                  params.encodings[0].maxFramerate = 15;
                }
                console.log(`[WebRTC Mobile] Optimized screen-share encodings for mobile: scale=${params.encodings[0].scaleResolutionDownBy}, fps=${params.encodings[0].maxFramerate}`);
              }
              
              await sender.setParameters(params);
              console.log(`[WebRTC] Enforced screen-share maxBitrate: ${maxBitrate} bps for peer`);
            } catch (bitrateErr) {
              console.warn("[WebRTC] Failed to set screen share bitrate parameters:", bitrateErr);
            }
          }
        }
      });
    },
    [uid]
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
    },
    []
  );

  // Warm up permissions and query media device capabilities on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          console.log("[WebRTC] Devices warmed up/enumerated successfully:", devices.length);
        })
        .catch((err) => {
          console.warn("[WebRTC] Devices warming failed:", err);
        });
    }
  }, []);

  const startVoice = useCallback(async () => {
    // Prevent duplicate initialization: reuse track if audio settings did not change and track is live
    const deviceChanged = lastAudioDeviceId.current !== audioInputDeviceId || lastNoiseSuppression.current !== noiseSuppressionEnabled;
    if (!deviceChanged && voiceStreamRef.current && voiceStreamRef.current.getAudioTracks().some(t => t.readyState === "live")) {
      console.log("[WebRTC] Reusing active voice track");
      setMuted(false);
      return;
    }
    
    lastAudioDeviceId.current = audioInputDeviceId;
    lastNoiseSuppression.current = noiseSuppressionEnabled;

    if (processedVoiceStreamRef.current) {
      processedVoiceStreamRef.current.getTracks().forEach((track) => track.stop());
      removeLocalStream(processedVoiceStreamRef.current);
      processedVoiceStreamRef.current = null;
    }
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((track) => track.stop());
      removeLocalStream(voiceStreamRef.current);
      voiceStreamRef.current = null;
    }
    analyserCleanup.current?.();

    console.log("[WebRTC] Starting voice capture...");
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
    let stream: MediaStream;
    try {
      if (isMobileDevice) {
        console.log("[WebRTC] Mobile device detected during capture - using direct robust constraints");
        const constraints = { 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Force AudioContext to wake up (Android Chrome security requirement)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
              console.log("AudioContext woken up!");
          }
        }

        // Play audio on the hidden audio element
        const audio = document.getElementById('myAudioElement') as HTMLAudioElement | null;
        if (audio) {
          audio.srcObject = stream;
          audio.muted = true; // MUST be muted or browser blocks auto-play
          await audio.play().catch((playErr) => {
            console.warn("Failed to play on myAudioElement:", playErr);
          });
          console.log("Mic stream successfully started!");
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: audioInputDeviceId && audioInputDeviceId !== "default" ? { exact: audioInputDeviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: noiseSuppressionEnabled,
            autoGainControl: true,
            latency: 0,
            channelCount: 1
          }
        } as any);
      }
    } catch (err) {
      console.warn("[WebRTC] getUserMedia with full constraints failed, trying robust mobile fallback...", err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: audioInputDeviceId && audioInputDeviceId !== "default" ? audioInputDeviceId : undefined,
            echoCancellation: true,
            noiseSuppression: noiseSuppressionEnabled,
            autoGainControl: true
          }
        });
      } catch (err2) {
        console.warn("[WebRTC] Fallback constraints failed, trying absolute bare minimum...", err2);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
      }
    }
    voiceStreamRef.current = stream;
    let processedStream: MediaStream = stream;
    let analyser: AnalyserNode | null = null;
    let audioContext: AudioContext | null = null;

    try {
      if (isMobileDevice) {
        console.log("[WebRTC] Mobile device detected: Completely bypassing Web Audio Graph to avoid WebKit silencing/routing issues.");
        processedStream = stream;
        processedVoiceStreamRef.current = null;
        analyser = null;
      } else {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContext = new AudioContextClass();
          if (audioContext.state === "suspended") {
            void audioContext.resume();
          }
          
          const source = audioContext.createMediaStreamSource(stream);
          analyser = audioContext.createAnalyser();

          if (noiseSuppressionEnabled) {
            console.log("[WebRTC] Applying Krisp AI Noise Cancellation filter graph...");
            
            const highpass = audioContext.createBiquadFilter();
            highpass.type = "highpass";
            highpass.frequency.value = 150; // Cut low-end hums/AC noise

            const lowpass = audioContext.createBiquadFilter();
            lowpass.type = "lowpass";
            lowpass.frequency.value = 4000; // Cut high-frequency hiss

            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.value = -30; // Threshold in dB
            compressor.knee.value = 10;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003; // Attack in seconds
            compressor.release.value = 0.15; // Release in seconds

            const destination = audioContext.createMediaStreamDestination();

            // Connect graph: source -> highpass -> lowpass -> compressor -> destination & analyser
            source.connect(highpass);
            highpass.connect(lowpass);
            lowpass.connect(compressor);
            compressor.connect(destination);
            compressor.connect(analyser);

            processedStream = destination.stream;
            processedVoiceStreamRef.current = processedStream;
          } else {
            source.connect(analyser);
            processedStream = stream;
            processedVoiceStreamRef.current = null;
          }
        }
      }
    } catch (audioGraphError) {
      console.error("[WebRTC] Failed to initialize AudioContext audio graph, falling back to raw stream:", audioGraphError);
      processedStream = stream;
      processedVoiceStreamRef.current = null;
      analyser = null;
    }

    setVoiceStream(processedStream);
    addLocalStream(processedStream);
    setMuted(false);

    let raf = 0;
    let speakingTimer: any = null;
    let currentSpeaking = false;

    if (analyser) {
      analyser.fftSize = 256;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(data);
        const volume = data.reduce((sum, value) => sum + value, 0) / data.length;
        
        // Check track enabled state on the processed stream
        const isTrackMuted = processedStream.getAudioTracks().some((t) => !t.enabled);
        
        const threshold = 18;
        const isAboveThreshold = volume > threshold && !isTrackMuted;

        if (isAboveThreshold) {
          if (!currentSpeaking) {
            currentSpeaking = true;
            setSpeaking(true);
          }
          if (speakingTimer) {
            clearTimeout(speakingTimer);
            speakingTimer = null;
          }
        } else {
          if (currentSpeaking && !speakingTimer) {
            speakingTimer = setTimeout(() => {
              currentSpeaking = false;
              setSpeaking(false);
              speakingTimer = null;
            }, 350);
          }
        }
        raf = requestAnimationFrame(tick);
      };
      tick();

      analyserCleanup.current = () => {
        cancelAnimationFrame(raf);
        if (speakingTimer) clearTimeout(speakingTimer);
        if (audioContext) {
          void audioContext.close().catch((err) => console.warn("Error closing AudioContext:", err));
        }
      };
    } else {
      analyserCleanup.current = () => {};
    }
  }, [addLocalStream, removeLocalStream, audioInputDeviceId, noiseSuppressionEnabled]);

  useEffect(() => {
    if (voiceStreamRef.current) {
      void startVoice();
    }
  }, [audioInputDeviceId, noiseSuppressionEnabled, startVoice]);

  const startCamera = useCallback(async (plan?: string) => {
    // Prevent duplicate camera initialization
    if (cameraStreamRef.current && cameraStreamRef.current.getVideoTracks().some(t => t.readyState === "live")) {
      console.log("[WebRTC] Reusing active camera track");
      return cameraStreamRef.current;
    }

    const ourParticipant = participantsRef.current.find((p) => p.uid === uid);
    const connectionQuality = ourParticipant?.connectionQuality || "excellent";

    console.log(`[WebRTC] Starting camera. Plan: ${plan || "free"}, connectionQuality: ${connectionQuality}`);
    
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
    let videoConstraints: MediaTrackConstraints;

    if (isMobileDevice) {
      if (connectionQuality === "poor") {
        console.log("[WebRTC] Mobile & Poor connection quality: enforcing low-latency 480p fallback");
        videoConstraints = {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 20, max: 24 }
        };
      } else {
        if (plan === "premium" || plan === "standard") {
          console.log("[WebRTC] Mobile with stable connection and premium/standard plan: scaling up to 720p constraints");
          videoConstraints = {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 24, max: 30 }
          };
        } else {
          console.log("[WebRTC] Mobile free plan: capped at 480p");
          videoConstraints = {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24, max: 30 }
          };
        }
      }
    } else {
      // Desktop clients
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
          frameRate: { ideal: 30, max: 30 }
        };
      } else {
        videoConstraints = {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24, max: 30 }
        };
      }
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

    cameraStreamRef.current = stream;
    setCameraStream(stream);

    addLocalStream(stream, plan);
    return stream;
  }, [addLocalStream, uid]);

  const stopCamera = useCallback(() => {
    console.log("[WebRTC] Stopping camera stream...");
    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      removeLocalStream(stream);
      cameraStreamRef.current = null;
      setCameraStream(null);
    }
  }, [removeLocalStream]);

  const stopScreenShare = useCallback(() => {
    console.log("[WebRTC] Stopping screen share...");
    const stream = screenStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      removeLocalStream(stream);
      screenStreamRef.current = null;
      setScreenStream(null);
    }
  }, [removeLocalStream]);

  const startScreenShare = useCallback(async (mode: "entire-screen" | "window" = "entire-screen", plan?: string) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error("Screen sharing is not supported by your current browser or mobile device. Please use a modern desktop browser (Chrome, Firefox, Safari) or a supporting mobile browser.");
    }
    
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    console.log(`[WebRTC] Starting screen share with mode: ${mode}, plan tier: ${plan || "free"}, isMobile: ${isMobileDevice}`);
    
    let videoConstraints: MediaTrackConstraints;
    if (isMobileDevice) {
      // Mobile screen shares are optimized for CPU, bandwidth, and battery: ideal 480p, capped at 720p, frameRate 20-24
      videoConstraints = {
        width: { ideal: 854, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 20, max: 24 }
      };
    } else if (plan === "premium") {
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
        frameRate: { ideal: 30, max: 30 }
      };
    } else {
      videoConstraints = {
        displaySurface: mode === "entire-screen" ? "monitor" : "window",
        width: { ideal: 854 },
        height: { ideal: 480 },
        frameRate: { ideal: 15, max: 30 }
      };
    }

    let stream: MediaStream;
    if (isMobileDevice) {
      console.log("[WebRTC] Mobile device detected. Using highly compatible constraints for screen share with native system sound options.");
      try {
        // Chrome on Android supports system audio via audio: true, without desktop-only constraints like selfBrowserSurface
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: videoConstraints,
          audio: true
        } as any);
      } catch (err: any) {
        if (err && err.name === "NotAllowedError") {
          console.log("[WebRTC] User cancelled mobile screen share picker.");
          throw err;
        }
        console.warn("[WebRTC] Mobile screen share with audio failed, retrying video-only fallback...", err);
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: videoConstraints,
          audio: false
        } as any);
      }
    } else if (isIOS) {
      console.log("[WebRTC] iOS detected. Requesting video-only screen share to bypass Apple sandbox constraints cleanly.");
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: videoConstraints,
        audio: false
      } as any);
    } else {
      try {
        // Use noise suppression and echo cancellation to prevent screeching/howling feedback loops,
        // while keeping autoGainControl false to prevent silence from being boosted into an irritating static hiss.
        // We also exclude self browser tab surface to prevent mirroring and loopbacks.
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: videoConstraints,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false
          } as any,
          selfBrowserSurface: "exclude",
          systemAudio: "include"
        } as any);
      } catch (e: any) {
        if (e && e.name === "NotAllowedError") {
          console.log("[WebRTC] User cancelled desktop screen share picker.");
          throw e;
        }
        console.warn("Failed screen share with high-fidelity audio, trying standard audio...", e);
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: videoConstraints,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: false
            } as any,
            selfBrowserSurface: "exclude"
          } as any);
        } catch (e2: any) {
          if (e2 && e2.name === "NotAllowedError") {
            console.log("[WebRTC] User cancelled secondary desktop screen share picker.");
            throw e2;
          }
          console.warn("Failed screen share with standard audio, trying video-only fallback...", e2);
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: videoConstraints,
            audio: false,
            selfBrowserSurface: "exclude"
          } as any);
        }
      }
    }

    screenStreamRef.current = stream;
    setScreenStream(stream);

    const screenTrack = stream.getVideoTracks()[0];
    if (screenTrack) {
      if ("contentHint" in screenTrack) {
        screenTrack.contentHint = "motion";
        console.log("[WebRTC] Configured screen video track contentHint to 'motion' for smooth playback.");
      }
      screenTrack.addEventListener("ended", () => {
        console.log("[WebRTC] Screen track ended natively.");
        stopScreenShare();
      });
    }

    addLocalStream(stream);
    return stream;
  }, [addLocalStream, stopScreenShare]);

  const toggleMute = useCallback((forceState?: boolean) => {
    const isStreamActive = voiceStreamRef.current && voiceStreamRef.current.getAudioTracks().some((t) => t.readyState === "live");
    if (!isStreamActive) {
      console.log("[WebRTC] toggleMute clicked while mic stream is uninitialized or inactive. Requesting user permission and starting capture.");
      void startVoice();
      return;
    }

    setMuted((nextMuted) => {
      const shouldMute = forceState !== undefined ? forceState : !nextMuted;
      
      const stream = voiceStreamRef.current;
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !shouldMute;
          console.log(`[Audio Mute] Raw audio track ${track.id} enabled state set to: ${!shouldMute}`);
        });
      }
      
      const processedStream = processedVoiceStreamRef.current;
      if (processedStream) {
        processedStream.getAudioTracks().forEach((track) => {
          track.enabled = !shouldMute;
          console.log(`[Audio Mute] Processed audio track ${track.id} enabled state set to: ${!shouldMute}`);
        });
      }
      
      return shouldMute;
    });
  }, [startVoice]);

  useEffect(() => {
    if (!roomId || !uid) return;

    const signalsQuery = query(
      collection(db, "rooms", roomId, "signals"),
      where("to", "==", uid),
      where("createdAt", ">=", sessionStartTime.current),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(
      signalsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;

          if (processedSignals.current.has(change.doc.id)) return;
          processedSignals.current.add(change.doc.id);

          const signal = change.doc.data() as SignalPayload & { receiverJoinedAt?: number };

          // Filter out signaling documents older than 10 minutes to avoid processing old session data, checking absolute difference for system clock skew protection
          const signalAge = Math.abs(Date.now() - signal.createdAt);
          if (signalAge > 600000) return;

          // Ignore signals targeted to an older session of this user
          const localParticipant = participantsRef.current.find((p) => p.uid === uid);
          const localJoinedAt = localParticipant?.joinedAt || 0;
          if (signal.receiverJoinedAt && localJoinedAt && signal.receiverJoinedAt !== localJoinedAt) {
            console.log(`Ignoring signal from ${signal.from} with receiverJoinedAt ${signal.receiverJoinedAt} because our localJoinedAt is ${localJoinedAt}`);
            return;
          }

          // Ignore stale signals created before we joined the session
          if (localJoinedAt && signal.createdAt < localJoinedAt) {
            console.log(`Ignoring stale signal created at ${signal.createdAt} before we joined at ${localJoinedAt}`);
            return;
          }

          // Ignore signals from users not in the participants list
          const remoteParticipant = participantsRef.current.find((p) => p.uid === signal.from);
          if (!remoteParticipant) {
            console.log(`Ignoring signal from ${signal.from} because they are not in the participants list.`);
            return;
          }

          if (!signal.from || signal.from === "undefined") {
            console.warn("[WebRTC] Received signal from invalid/undefined sender:", signal.from);
            return;
          }

          const peer = createPeer(signal.from);
          if (!peer) return;

          const neg = negotiationState.current[signal.from] || { makingOffer: false, ignoreOffer: false };

          void (async () => {
            if (signal.type === "offer" && signal.sdp) {
              try {
                const isPolite = uid > signal.from;
                const offerCollision = neg.makingOffer || peer.signalingState === "have-local-offer";

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
                  sdp: {
                    type: peer.localDescription!.type,
                    sdp: peer.localDescription!.sdp
                  }
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
      [`participants.${uid}.isSpeaking`]: speaking,
      [`participants.${uid}.isDeafened`]: deafened,
      [`participants.${uid}.voiceStreamId`]: voiceStream ? voiceStream.id : null
    }).catch(() => undefined);
  }, [muted, roomId, speaking, uid, voiceStream, deafened]);

  // Synchronize peer connections and remote streams with current participants
  const participantsKey = participants
    .filter((p) => p.uid && p.uid !== "undefined")
    .map((p) => `${p.uid}:${p.joinedAt}:${p.isCameraOn ? 1 : 0}:${p.isMuted ? 1 : 0}:${p.isScreenSharing ? 1 : 0}:${p.voiceStreamId || ""}:${p.cameraStreamId || ""}:${p.screenStreamId || ""}`)
    .sort()
    .join(",");

  useEffect(() => {
    if (!uid) return;

    const currentRemoteUids = new Set(
      participants
        .map((p) => p.uid)
        .filter((id) => id && id !== "undefined" && id !== uid)
    );

    // Close and clean up connections for participants who left or rejoined (joinedAt changed)
    Object.keys(peers.current).forEach((remoteUid) => {
      // Guard against invalid key in the peers map
      if (!remoteUid || remoteUid === "undefined") {
        console.warn(`[WebRTC] Cleaning up peer connection for invalid key: ${remoteUid}`);
        try {
          peers.current[remoteUid].close();
        } catch (e) {}
        delete peers.current[remoteUid];
        delete candidateQueue.current[remoteUid];
        delete negotiationState.current[remoteUid];
        delete peerJoinedAt.current[remoteUid];
        delete negotiateHandlers.current[remoteUid];
        return;
      }

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
        delete negotiateHandlers.current[remoteUid];
      }
    });

    // Clean up corresponding remote streams
    setRemoteStreams((current) =>
      current.filter(
        (item) =>
          item.uid &&
          item.uid !== "undefined" &&
          currentRemoteUids.has(item.uid) &&
          peerJoinedAt.current[item.uid] !== undefined
      )
    );

    // Track the active peer joinedAt timestamps
    const remotesToConnect = participants.filter((p) => p.uid && p.uid !== "undefined" && p.uid !== uid);
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
      negotiateHandlers.current = {};
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
