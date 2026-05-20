import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Activity, Clapperboard, CopyPlus, Play, Radio, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContentRail } from "../components/media/ContentRail";
import { HeroShowcase } from "../components/media/HeroShowcase";
import { SearchOverlay } from "../components/media/SearchOverlay";
import { StartTogetherModal } from "../components/room/StartTogetherModal";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useActiveRooms } from "../hooks/useRooms";
import { useStartRoom } from "../hooks/useStartRoom";
import { getAnimeRows, getMovieRows } from "../services/contentService";

export function DashboardPage() {
  const { profile } = useAuth();
  const rooms = useActiveRooms(profile);
  const startRoom = useStartRoom();
  const navigate = useNavigate();
  const [startOpen, setStartOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const movies = useQuery({ queryKey: ["movieRows"], queryFn: getMovieRows });
  const anime = useQuery({ queryKey: ["animeRows"], queryFn: getAnimeRows });
  const hero = movies.data?.trending?.[0];
  const continueWatching = useMemo(() => [...(movies.data?.popular || []), ...(anime.data?.top || [])].slice(0, 8), [anime.data, movies.data]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div>{hero ? <HeroShowcase item={hero} onStartRoom={startRoom} /> : <Skeleton className="min-h-[640px]" />}</div>
        <div className="space-y-4">
          <SearchOverlay />

          <section className="glass rounded-lg p-4">
            <div className="mb-4 flex items-center gap-3">
              <Radio className="h-5 w-5 text-cyan" />
              <div>
                <h2 className="font-display text-lg font-bold">Start Together</h2>
                <p className="text-xs text-muted">Create public/private rooms or join by link/code.</p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                value={customUrl}
                onChange={(event) => setCustomUrl(event.target.value)}
                placeholder="Optional YouTube, MP4, or HLS URL"
                className="h-12 w-full rounded-lg border border-white/10 bg-white/8 px-3 text-sm outline-none focus:border-cyan"
              />
              <Button className="w-full" onClick={() => setStartOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Start Together
              </Button>
            </div>
          </section>

          <section className="glass rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Active Rooms</h2>
              <Badge tone="cyan">{rooms.length}</Badge>
            </div>
            <div className="space-y-3">
              {rooms.length ? (
                rooms.slice(0, 4).map((room) => (
                  <button
                    key={room.id}
                    className="w-full rounded-lg border border-white/10 bg-white/6 p-3 text-left transition hover:border-cyan/40 hover:bg-white/10"
                    onClick={() => navigate(`/room/${room.id}`)}
                  >
                    <p className="truncate text-sm font-bold">{room.roomName}</p>
                    <p className="mt-1 text-xs text-muted">
                      {room.code} · {Object.keys(room.participants || {}).length} online · {room.roomType || (room.isPrivate ? "private" : "public")}
                    </p>
                  </button>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-muted">No active rooms yet. Start one from a title or URL.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Realtime rooms", rooms.length.toString(), Activity],
          ["Friends synced", rooms.reduce((sum, room) => sum + Object.keys(room.participants || {}).length, 0).toString(), Users],
          ["Watchlist ready", profile?.watchlist?.length?.toString() || "0", CopyPlus],
          ["Streaming modes", "8", Clapperboard]
        ].map(([label, value, Icon]) => (
          <article key={label as string} className="glass rounded-lg p-4">
            <Icon className="h-6 w-6 text-cyan" />
            <p className="mt-4 text-3xl font-black">{value as string}</p>
            <p className="text-sm text-muted">{label as string}</p>
          </article>
        ))}
      </section>

      {movies.data ? <ContentRail title="Trending Movies" eyebrow="TMDB-ready" items={movies.data.trending} onStartRoom={startRoom} /> : null}
      {anime.data ? <ContentRail title="Trending Anime" eyebrow="Jikan-ready" items={anime.data.top} onStartRoom={startRoom} /> : null}
      <ContentRail title="Continue Watching" eyebrow="Progress sync" items={continueWatching} onStartRoom={startRoom} />

      <section className="glass rounded-lg p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-black">Friends Watching</h2>
            <p className="mt-1 text-sm text-muted">Rooms show live presence, host crown, buffering state, camera state, and voice quality.</p>
          </div>
          <Button onClick={() => setStartOpen(true)}>
            <Play className="h-4 w-4" />
            Start Together
          </Button>
        </div>
      </section>

      <StartTogetherModal open={startOpen} onClose={() => setStartOpen(false)} defaultVideoUrl={customUrl} />
    </div>
  );
}
