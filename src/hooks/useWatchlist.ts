import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import type { ContentItem, UserProfile, WatchlistEntry } from "../types";

export function useWatchlist(profile?: UserProfile | null) {
  const [items, setItems] = useState<WatchlistEntry[]>([]);

  useEffect(() => {
    if (!profile) {
      setItems([]);
      return;
    }

    const watchlistQuery = query(collection(db, "watchlists"), where("userId", "==", profile.uid));
    return onSnapshot(watchlistQuery, (snapshot) => {
      setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WatchlistEntry));
    });
  }, [profile]);

  return items;
}

export async function toggleWatchlist(profile: UserProfile, content: ContentItem, status: WatchlistEntry["status"] = "watch_later") {
  const id = `${profile.uid}_${content.id}`;
  const ref = doc(db, "watchlists", id);
  await setDoc(
    ref,
    {
      id,
      userId: profile.uid,
      contentType: content.type,
      contentId: content.id,
      title: content.title,
      poster: content.poster,
      status,
      progress: 0,
      addedAt: Date.now(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function removeWatchlistEntry(id: string) {
  await deleteDoc(doc(db, "watchlists", id));
}

export async function setWatchProgress(id: string, progress: number) {
  await updateDoc(doc(db, "watchlists", id), {
    progress,
    updatedAt: serverTimestamp()
  });
}
