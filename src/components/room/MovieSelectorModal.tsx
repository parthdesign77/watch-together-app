import { useQuery } from "@tanstack/react-query";
import { Film, Play, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { updateRoomState } from "../../hooks/useRooms";
import { playSound } from "../../lib/sounds";
import { getAnimeRows, getMovieRows } from "../../services/contentService";
import type { WatchRoom, ContentItem } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface MovieSelectorModalProps {
  open: boolean;
  onClose: () => void;
  room: WatchRoom;
}

export function MovieSelectorModal({ open, onClose, room }: MovieSelectorModalProps) {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const movies = useQuery({ queryKey: ["movieRows"], queryFn: getMovieRows });
  const anime = useQuery({ queryKey: ["animeRows"], queryFn: getAnimeRows });

  const allItems = useMemo<ContentItem[]>(() => {
    if (!movies.data || !anime.data) return [];
    
    // Flatten rows into a unique set of content
    const items: Record<string, ContentItem> = {};
    const movieItems = Object.values(movies.data).flat() as ContentItem[];
    movieItems.forEach((m) => {
      if (m?.id) items[m.id] = m;
    });
    const animeItems = Object.values(anime.data).flat() as ContentItem[];
    animeItems.forEach((a) => {
      if (a?.id) items[a.id] = a;
    });

    return Object.values(items);
  }, [movies.data, anime.data]);

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return allItems.slice(0, 16); // return top 16 if blank
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.overview?.toLowerCase().includes(term)
    );
  }, [allItems, search]);

  async function handleSelectMovie(item: ContentItem) {
    playSound("success");
    try {
      await updateRoomState(room.id, {
        videoUrl: item.trailerUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        roomName: `${item.title} Watch Party`,
        contentType: item.type,
        contentId: item.id,
        currentTime: 0,
        isPlaying: true,
        status: "watching",
        ...(item.type === "anime" ? { episode: "Episode 1" } : {})
      });
      if (profile) {
        await updateDoc(doc(db, "users", profile.uid), {
          viewingHistory: arrayUnion(item.id)
        });
      }
      onClose();
    } catch (error) {
      console.error("Select movie error:", error);
    }
  }

  return (
    <Modal open={open} title="Select Movie or Anime" onClose={onClose}>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search movie, anime, genres..."
            className="h-12 w-full rounded-lg border border-white/10 bg-white/8 pl-10 pr-4 text-sm outline-none focus:border-red-500"
          />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-red-200">
              {search ? `Search Results (${filteredItems.length})` : "Trending Media"}
            </h3>
          </div>

          <div className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectMovie(item)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-left transition hover:border-red-500/50 hover:bg-red-500/10 flex gap-3 items-center group"
                >
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="h-16 w-12 rounded object-cover border border-white/10 group-hover:scale-105 transition"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate text-sm font-bold text-snow">{item.title}</p>
                      <Badge tone={item.type === "anime" ? "purple" : "cyan"}>
                        {item.type.toUpperCase()}
                      </Badge>
                      {item.rating && (
                        <span className="text-[10px] text-amber-400 font-black">★ {item.rating.toFixed(1)}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted truncate mt-1">
                      {item.overview || "Jump straight into watch party playback controls."}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <Play className="h-4 w-4 fill-current" />
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-muted">
                <Film className="h-8 w-8 mx-auto mb-2 text-muted" />
                <p>No titles match your search criteria. Try general tags.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
