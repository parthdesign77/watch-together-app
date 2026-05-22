import {
  addDoc,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { useEffect, useMemo, useState, useRef } from "react";
import { ROOM_TTL_MS } from "../lib/constants";
import { db } from "../lib/firebase";
import type { ChatMessage, ContentItem, Participant, UserProfile, WatchRoom } from "../types";

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function participantFromProfile(profile: UserProfile, isHost = false): Participant {
  return {
    uid: profile.uid,
    name: profile.name,
    avatar: profile.avatar,
    avatarColor: profile.avatarColor,
    joinedAt: Date.now(),
    isHost,
    isMuted: false,
    isSpeaking: false,
    isBuffering: false,
    isScreenSharing: false,
    isCameraOn: false,
    connectionQuality: "excellent",
    subscriptionPlan: profile.subscriptionPlan || "free",
    premiumBadge: profile.premiumBadge || false
  };
}

export async function createWatchRoom(
  profile: UserProfile,
  content?: ContentItem,
  videoUrl?: string,
  roomType: "public" | "private" = "private"
) {
  const code = makeRoomCode();
  const now = Date.now();
  const participant = participantFromProfile(profile, true);

  // Dynamic resolution boundaries by subscription plan
  const plan = profile.subscriptionPlan || "free";
  let defaultQuality: "480p" | "720p" | "1080p" | "auto" = "480p";
  let maxQuality: "480p" | "720p" | "1080p" = "480p";
  if (plan === "premium") {
    defaultQuality = "1080p";
    maxQuality = "1080p";
  } else if (plan === "standard") {
    defaultQuality = "720p";
    maxQuality = "720p";
  }

  const room: Omit<WatchRoom, "id"> = {
    code,
    hostId: profile.uid,
    roomName: content ? `${content.title} Watch Party` : `${profile.name}'s Watch Room`,
    videoUrl: videoUrl || "",
    contentType: content?.type || (videoUrl ? (/youtube\.com|youtu\.be/.test(videoUrl) ? "youtube" : "mp4") : "hls"),
    currentTime: 0,
    isPlaying: false,
    isScreenSharing: false,
    screenShareHost: null,
    roomType,
    participants: {
      [profile.uid]: participant
    },
    status: videoUrl ? "paused" : "waiting",
    isPrivate: roomType === "private",
    quality: defaultQuality,
    maxQuality: maxQuality,
    theaterMode: false,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + ROOM_TTL_MS,
    ...(content?.id ? { contentId: content.id } : {}),
    ...(content?.type === "anime" ? { episode: "Episode 1" } : {})
  };

  const ref = await addDoc(collection(db, "rooms"), {
    ...room,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp()
  });

  await updateDoc(doc(db, "users", profile.uid), {
    recentRooms: arrayUnion(ref.id),
    ...(content?.id ? { viewingHistory: arrayUnion(content.id) } : {}),
    updatedAt: serverTimestamp()
  });

  return { id: ref.id, ...room };
}

export async function joinRoomById(roomId: string, profile: UserProfile) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) {
    throw new Error("Room not found.");
  }
  const roomData = roomSnap.data() as WatchRoom;
  
  const isHost = roomData.hostId === profile.uid;
  const isAlreadyParticipant = roomData.participants && !!roomData.participants[profile.uid];
  
  if (isHost || isAlreadyParticipant) {
    await updateDoc(roomRef, {
      [`participants.${profile.uid}`]: participantFromProfile(profile, isHost),
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp()
    });
    await updateDoc(doc(db, "users", profile.uid), {
      recentRooms: arrayUnion(roomId),
      updatedAt: serverTimestamp()
    });
    return;
  }

  const hostId = roomData.hostId;
  const host = roomData.participants?.[hostId];
  const hostPlan = host?.subscriptionPlan || "free";
  
  const participantCount = Object.keys(roomData.participants || {}).length;
  
  let limitValue = 2;
  if (hostPlan === "premium") {
    limitValue = 20;
  } else if (hostPlan === "standard") {
    limitValue = 5;
  }
  
  if (participantCount >= limitValue) {
    throw new Error(
      `This room is at full capacity. The host's ${hostPlan.toUpperCase()} plan allows a maximum of ${limitValue} participants.`
    );
  }

  await updateDoc(roomRef, {
    [`joinRequests.${profile.uid}`]: {
      uid: profile.uid,
      name: profile.name,
      avatar: profile.avatar,
      avatarColor: profile.avatarColor,
      requestedAt: Date.now(),
      status: "pending"
    },
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp()
  });
}

export async function approveJoinRequest(
  roomId: string,
  requestUser: { uid: string; name: string; avatar: string; avatarColor: string; subscriptionPlan?: string }
) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return;
  const roomData = roomSnap.data() as WatchRoom;

  const participant: Participant = {
    uid: requestUser.uid,
    name: requestUser.name,
    avatar: requestUser.avatar,
    avatarColor: requestUser.avatarColor,
    joinedAt: Date.now(),
    isHost: false,
    isMuted: false,
    isSpeaking: false,
    isBuffering: false,
    isScreenSharing: false,
    isCameraOn: false,
    connectionQuality: "excellent",
    subscriptionPlan: (requestUser.subscriptionPlan || "free") as any
  };

  await updateDoc(roomRef, {
    [`participants.${requestUser.uid}`]: participant,
    [`joinRequests.${requestUser.uid}`]: deleteField(),
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp()
  });

  await updateDoc(doc(db, "users", requestUser.uid), {
    recentRooms: arrayUnion(roomId),
    updatedAt: serverTimestamp()
  });
}

export async function rejectJoinRequest(roomId: string, userId: string) {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    [`joinRequests.${userId}.status`]: "rejected",
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp()
  });
}

export async function cancelJoinRequest(roomId: string, userId: string) {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    [`joinRequests.${userId}`]: deleteField(),
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp()
  });
}

export async function joinRoomByCode(code: string, profile: UserProfile) {
  const rooms = await getDocs(query(collection(db, "rooms"), where("code", "==", code.trim().toUpperCase()), limit(1)));
  if (rooms.empty) {
    throw new Error("No room found for that invite code.");
  }
  const roomId = rooms.docs[0].id;
  await joinRoomById(roomId, profile);
  return roomId;
}

export async function resolveRoomLink(link: string) {
  const trimmed = link.trim();
  if (!trimmed) throw new Error("Paste a room invite link first.");

  try {
    const url = new URL(trimmed, window.location.origin);
    const parts = url.pathname.split("/").filter(Boolean);
    const roomIndex = parts.indexOf("room");
    if (roomIndex >= 0 && parts[roomIndex + 1]) {
      return parts[roomIndex + 1];
    }
  } catch {
    // Fall through to the direct id path below.
  }

  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  throw new Error("That invite link does not look like a Watch Together room URL.");
}

export async function leaveRoom(roomId: string, uid: string) {
  await updateDoc(doc(db, "rooms", roomId), {
    [`participants.${uid}`]: deleteField(),
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp()
  });
}

export function useRoom(roomId?: string) {
  const [room, setRoom] = useState<WatchRoom | null>(null);
  const [loading, setLoading] = useState(Boolean(roomId));

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    return onSnapshot(
      doc(db, "rooms", roomId),
      (snapshot) => {
        setRoom(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as WatchRoom) : null);
        setLoading(false);
      },
      (error) => {
        console.warn("[useRoom] onSnapshot error:", error);
        setLoading(false);
      }
    );
  }, [roomId]);

  return { room, loading };
}

export function useActiveRooms(profile?: UserProfile | null) {
  const [rooms, setRooms] = useState<WatchRoom[]>([]);

  useEffect(() => {
    if (!profile) return;

    // Retrieve all active watch rooms on the platform so everyone can see and join
    const activeRoomsQuery = query(
      collection(db, "rooms"),
      where("status", "in", ["waiting", "watching", "paused", "screen-sharing"])
    );
    return onSnapshot(
      activeRoomsQuery,
      (snapshot) => {
        setRooms(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WatchRoom));
      },
      (error) => {
        console.warn("[useActiveRooms] onSnapshot error:", error);
      }
    );
  }, [profile]);

  return rooms;
}

export function usePublicRooms() {
  const [rooms, setRooms] = useState<WatchRoom[]>([]);

  useEffect(() => {
    const publicRoomsQuery = query(collection(db, "rooms"), where("roomType", "==", "public"), orderBy("updatedAt", "desc"), limit(12));
    return onSnapshot(
      publicRoomsQuery,
      (snapshot) => {
        setRooms(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WatchRoom));
      },
      (error) => {
        console.warn("[usePublicRooms] onSnapshot error:", error);
      }
    );
  }, []);

  return rooms;
}

export function useRoomMessages(roomId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const messagesQuery = query(collection(db, "rooms", roomId, "messages"), orderBy("sentAt", "asc"), limit(100));
    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(snapshot.docs.map((message) => ({ id: message.id, ...message.data() }) as ChatMessage));
      },
      (error) => {
        console.warn("[useRoomMessages] onSnapshot error:", error);
      }
    );
  }, [roomId]);

  return messages;
}

export function useParticipants(room?: WatchRoom | null) {
  return useMemo(() => Object.values(room?.participants || {}).sort((a, b) => a.joinedAt - b.joinedAt), [room]);
}

export async function updatePlayback(roomId: string, updates: Partial<Pick<WatchRoom, "currentTime" | "isPlaying" | "status">>) {
  await updateDoc(doc(db, "rooms", roomId), {
    ...updates,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp()
  });
}

export async function updateRoomState(roomId: string, updates: Partial<WatchRoom> & Record<string, unknown>) {
  await updateDoc(doc(db, "rooms", roomId), {
    ...updates,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp()
  });
}

export async function sendRoomMessage(roomId: string, profile: UserProfile, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  await addDoc(collection(db, "rooms", roomId, "messages"), {
    roomId,
    userId: profile.uid,
    userName: profile.name,
    userAvatar: profile.avatar,
    text: trimmed,
    reactions: {},
    sentAt: Date.now(),
    sentAtServer: serverTimestamp()
  });
}

export async function addMessageReaction(roomId: string, message: ChatMessage, emoji: string, uid: string) {
  const current = message.reactions?.[emoji] || [];
  const next = current.includes(uid) ? current.filter((item) => item !== uid) : [...current, uid];

  await setDoc(
    doc(db, "rooms", roomId, "messages", message.id),
    {
      reactions: {
        ...message.reactions,
        [emoji]: next
      }
    },
    { merge: true }
  );
}

export async function endRoom(roomId: string) {
  await updateRoomState(roomId, {
    status: "ended",
    updatedAt: Date.now()
  });
}

export async function sendRoomReaction(roomId: string, emoji: string, userName: string) {
  await addDoc(collection(db, "rooms", roomId, "reactions"), {
    emoji,
    userName,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp()
  });
}

export function useRoomReactions(
  roomId?: string,
  onReactionTrigger?: (reaction: { emoji: string; userName: string; id: string }) => void
) {
  const triggerRef = useRef(onReactionTrigger);
  useEffect(() => {
    triggerRef.current = onReactionTrigger;
  }, [onReactionTrigger]);

  useEffect(() => {
    if (!roomId) return;
    const now = Date.now();
    const q = query(
      collection(db, "rooms", roomId, "reactions"),
      orderBy("createdAt", "desc"),
      limit(15)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (data.createdAt && data.createdAt > now - 3000) {
              triggerRef.current?.({
                id: change.doc.id,
                emoji: data.emoji,
                userName: data.userName || "Someone"
              });
            }
          }
        });
      },
      (error) => {
        console.warn("[useRoomReactions] onSnapshot error:", error);
      }
    );
  }, [roomId]);
}

export async function startReadyCheck(roomId: string, participants: string[]) {
  console.log("[useRooms] starting ready check for room:", roomId, "participants:", participants);
  const status: Record<string, boolean> = {};
  participants.forEach((uid) => {
    status[uid] = false;
  });

  await updateRoomState(roomId, {
    readyCheck: {
      active: true,
      status,
      startedAt: Date.now()
    }
  });
}

export async function setReadyStatus(roomId: string, uid: string, isReady: boolean) {
  console.log("[useRooms] setting ready status for room:", roomId, "user:", uid, "isReady:", isReady);
  await updateDoc(doc(db, "rooms", roomId), {
    [`readyCheck.status.${uid}`]: isReady
  });
}

export async function cancelReadyCheck(roomId: string) {
  console.log("[useRooms] cancelling ready check for room:", roomId);
  await updateDoc(doc(db, "rooms", roomId), {
    readyCheck: deleteField()
  });
}
