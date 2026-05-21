import {
  addDoc,
  arrayUnion,
  collection,
  deleteField,
  doc,
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
import { useEffect, useMemo, useState } from "react";
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
    connectionQuality: "excellent"
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
  const room: Omit<WatchRoom, "id"> = {
    code,
    hostId: profile.uid,
    roomName: content ? `${content.title} Watch Party` : `${profile.name}'s Watch Room`,
    videoUrl: videoUrl || content?.trailerUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    contentType: content?.type || "hls",
    currentTime: 0,
    isPlaying: false,
    isScreenSharing: false,
    screenShareHost: null,
    roomType,
    participants: {
      [profile.uid]: participant
    },
    status: "waiting",
    isPrivate: roomType === "private",
    quality: profile.subscriptionPlan === "premium" ? "1080p" : "720p",
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
    updatedAt: serverTimestamp()
  });

  return { id: ref.id, ...room };
}

export async function joinRoomById(roomId: string, profile: UserProfile) {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    [`participants.${profile.uid}`]: participantFromProfile(profile),
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp()
  });
  await updateDoc(doc(db, "users", profile.uid), {
    recentRooms: arrayUnion(roomId),
    updatedAt: serverTimestamp()
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
      () => setLoading(false)
    );
  }, [roomId]);

  return { room, loading };
}

export function useActiveRooms(profile?: UserProfile | null) {
  const [rooms, setRooms] = useState<WatchRoom[]>([]);

  useEffect(() => {
    if (!profile) return;

    const activeRoomsQuery = query(collection(db, "rooms"), where(`participants.${profile.uid}.uid`, "==", profile.uid));
    return onSnapshot(activeRoomsQuery, (snapshot) => {
      setRooms(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WatchRoom));
    });
  }, [profile]);

  return rooms;
}

export function usePublicRooms() {
  const [rooms, setRooms] = useState<WatchRoom[]>([]);

  useEffect(() => {
    const publicRoomsQuery = query(collection(db, "rooms"), where("roomType", "==", "public"), orderBy("updatedAt", "desc"), limit(12));
    return onSnapshot(publicRoomsQuery, (snapshot) => {
      setRooms(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WatchRoom));
    });
  }, []);

  return rooms;
}

export function useRoomMessages(roomId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const messagesQuery = query(collection(db, "rooms", roomId, "messages"), orderBy("sentAt", "asc"), limit(100));
    return onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map((message) => ({ id: message.id, ...message.data() }) as ChatMessage));
    });
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
