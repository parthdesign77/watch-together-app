import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Activity, Clapperboard, CopyPlus, Play, Radio, Sparkles, Users, Tv, Compass, ShieldAlert, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ContentRail } from "../components/media/ContentRail";
import { HeroShowcase } from "../components/media/HeroShowcase";
import { SearchOverlay } from "../components/media/SearchOverlay";
import { StartTogetherModal } from "../components/room/StartTogetherModal";
import { PrivateJoinModal } from "../components/room/PrivateJoinModal";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useActiveRooms } from "../hooks/useRooms";
import { useStartRoom } from "../hooks/useStartRoom";
import { getAnimeRows, getMovieRows } from "../services/contentService";
import type { ContentItem, WatchRoom } from "../types";
import { useUISound } from "../hooks/useUISound";
import { movieSeeds, animeSeeds } from "../data/catalog";

export function DashboardPage() {
  const { profile } = useAuth();
  const rooms = useActiveRooms(profile);
  const startRoom = useStartRoom();
  const navigate = useNavigate();
  const { play } = useUISound();

  const [startOpen, setStartOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [selectedPrivateRoom, setSelectedPrivateRoom] = useState<WatchRoom | null>(null);
  const [privateJoinOpen, setPrivateJoinOpen] = useState(false);

  const movies = useQuery({ queryKey: ["movieRows"], queryFn: getMovieRows });
  const anime = useQuery({ queryKey: ["animeRows"], queryFn: getAnimeRows });
  const hero = movies.data?.trending?.[0];

  const allCatalogItems = useMemo(() => {
    const list: ContentItem[] = [];
    if (movies.data) {
      list.push(
        ...(movies.data.trending || []),
        ...(movies.data.popular || []),
        ...(movies.data.topRated || []),
        ...(movies.data.upcoming || [])
      );
    }
    if (anime.data) {
      list.push(
        ...(anime.data.top || []),
        ...(anime.data.seasonal || []),
        ...(anime.data.airing || [])
      );
    }
    list.push(...movieSeeds, ...animeSeeds);

    const map = new Map<string, ContentItem>();
    for (const item of list) {
      if (item?.id) map.set(item.id, item);
    }
    return Array.from(map.values());
  }, [movies.data, anime.data]);

  const continueWatching = useMemo(() => {
    if (!profile?.viewingHistory || profile.viewingHistory.length === 0) {
      return [];
    }

    const matched: any[] = [];
    const progressList = [75, 45, 90, 20, 60, 85, 30, 95];
    const uniqueHistoryIds = Array.from(new Set(profile.viewingHistory)).reverse();

    uniqueHistoryIds.forEach((id, index) => {
      const found = allCatalogItems.find((item) => item.id === id);
      if (found) {
        matched.push({
          ...found,
          progress: progressList[index % progressList.length] || 50
        });
      }
    });

    return matched;
  }, [profile?.viewingHistory, allCatalogItems]);

  function handleStartRoomClick(content?: ContentItem) {
    setSelectedContent(content || null);
    setStartOpen(true);
    play("click");
  }

  return (
    <div className="space-y-10 text-white pb-10">
      
      {/* Upper Grid Area */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_390px]">
        {/* Widescreen Hero Feature */}
        <div className="overflow-hidden rounded-[28px] border border-white/5 bg-[#111111] shadow-2xl relative">
          {hero ? (
            <HeroShowcase item={hero} onStartRoom={handleStartRoomClick} />
          ) : (
            <Skeleton className="min-h-[640px] rounded-[28px]" />
          )}
        </div>

        {/* Sidebar Widgets Panel */}
        <div className="space-y-6 flex flex-col">
          <SearchOverlay />

          {/* Quick Start Room Card */}
          <section className="glass rounded-[24px] p-4 sm:p-5 border border-white/5 bg-[#111111]/90 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff3d47] to-cyan" />
            <div className="mb-3.5 sm:mb-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#ff3d47]/10 border border-[#ff3d47]/20 text-[#ff3d47]">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-extrabold text-white">Start Together</h2>
                <p className="text-xs text-neutral-400">Launch an instant synchronized media stream.</p>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-3.5">
              <input
                value={customUrl}
                onChange={(event) => setCustomUrl(event.target.value)}
                placeholder="YouTube, local MP4 file, HLS stream..."
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base md:text-sm text-white outline-none focus:border-[#ff3d47] transition-all duration-300 placeholder-neutral-500"
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="w-full bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white rounded-xl h-11 font-bold flex items-center justify-center gap-2 border-none shadow-glow-sm" onClick={() => handleStartRoomClick()}>
                  <Sparkles className="h-4 w-4" />
                  <span>Launch Party Room</span>
                </Button>
              </motion.div>
            </div>
          </section>

          {/* Luxury Premium Active Rooms Feed */}
          <section className="glass rounded-[24px] p-5 border border-white/5 bg-[#111111]/90 shadow-lg relative flex-1 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-extrabold text-white">Active Parties</h2>
                <Badge className="bg-[#ff3d47]/15 text-[#ff3d47] border border-[#ff3d47]/25 font-bold text-xs px-2 py-0.5 rounded">
                  {rooms.length} Active
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {rooms.length ? (
                rooms.slice(0, 4).map((room) => (
                  <motion.div
                    key={room.id}
                    whileHover={{ x: 4 }}
                    className="w-full rounded-2xl border border-white/5 bg-white/2 p-3.5 text-left flex items-center justify-between gap-3 hover:bg-white/5 transition-all duration-300 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-white group-hover:text-[#ff3d47] transition-colors">{room.roomName}</p>
                        {room.isPrivate && (
                          <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-1 py-0.2 rounded uppercase font-bold flex-shrink-0">
                            Private
                          </Badge>
                        )}
                      </div>
                      
                      {/* Avatar Overlay Cluster */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex -space-x-2.5 overflow-hidden">
                          {Object.values(room.participants || {}).slice(0, 3).map((p, idx) => (
                            <div
                              key={p.uid}
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-[#111111] bg-neutral-800 text-[10px] font-bold text-white overflow-hidden flex items-center justify-center"
                              style={{ backgroundColor: p.avatar ? undefined : (p.avatarColor || "#ff3d47"), zIndex: 10 - idx }}
                            >
                              {p.avatar ? (
                                <img src={p.avatar} alt={p.name || "Guest"} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                (p.name || "Guest").slice(0, 1).toUpperCase()
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-[11px] text-neutral-400 font-semibold font-mono">
                          {Object.keys(room.participants || {}).length} inside{!(room.roomType === "private" || room.isPrivate) && ` · Code ${room.code}`}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="bg-neutral-800 hover:bg-[#ff3d47] text-white hover:text-white rounded-xl h-9 px-3 font-extrabold text-xs transition-all duration-300 border border-white/5 flex-shrink-0"
                      onClick={() => {
                        play("click");
                        if ((room.roomType === "private" || room.isPrivate) && room.hostId !== profile?.uid) {
                          setSelectedPrivateRoom(room);
                          setPrivateJoinOpen(true);
                        } else {
                          navigate(`/room/${room.id}`);
                        }
                      }}
                    >
                      Join
                    </Button>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center flex flex-col items-center justify-center">
                  <Tv className="h-8 w-8 text-neutral-600 mb-2" />
                  <p className="text-xs text-neutral-400">No public watchrooms currently active.</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Be the first to create one!</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Elegant Platform Dashboard Stats */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          ["Platforms Active", rooms.length.toString(), Activity, "text-red-500 bg-red-500/10 border-red-500/20"],
          ["Members Synced", rooms.reduce((sum, room) => sum + Object.keys(room.participants || {}).length, 0).toString(), Users, "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"],
          ["Your Watchlist", profile?.watchlist?.length?.toString() || "0", CopyPlus, "text-purple-500 bg-purple-500/10 border-purple-500/20"],
          ["Stream Channels", "128", Clapperboard, "text-cyan bg-cyan/10 border-cyan/20"]
        ].map(([label, value, Icon, classes]) => (
          <article key={label as string} className="glass rounded-[24px] p-5 border border-white/5 bg-[#111111]/70 backdrop-blur-sm flex items-center gap-4">
            <div className={`p-3 rounded-2xl border flex items-center justify-center ${classes}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white font-mono">{value as string}</p>
              <p className="text-xs text-neutral-400 font-medium">{label as string}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Gorgeous Continue Watching Slider */}
      {continueWatching.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#ff3d47]" />
            <h2 className="font-display text-lg font-extrabold text-white">Continue Watching</h2>
          </div>
          <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
            {continueWatching.map((item: any) => (
              <div
                key={item.id}
                className="group relative rounded-[20px] overflow-hidden bg-[#111111] border border-white/5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#ff3d47]/40 cursor-pointer"
                onClick={() => handleStartRoomClick(item)}
              >
                {/* Cover Art */}
                <div className="aspect-video w-full relative overflow-hidden bg-neutral-900">
                  <img
                    src={item.backdrop || item.poster}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-[#ff3d47] h-10 w-10 rounded-full flex items-center justify-center text-white shadow-lg shadow-[#ff3d47]/35 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Play className="h-5 w-5 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Info & Progress */}
                <div className="p-4 space-y-2">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                  <p className="text-[10px] text-neutral-400 font-medium capitalize">{item.type} · Episode {Math.floor(Math.random() * 20) + 1}</p>
                  
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ff3d47] to-[#ff3d47]/85 rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-neutral-500 font-bold font-mono">
                      <span>{item.progress}% WATCHED</span>
                      <span>RESUME PLAY</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {movies.data ? <ContentRail title="Trending Movies" eyebrow="TMDB-ready" items={movies.data.trending} onStartRoom={handleStartRoomClick} /> : null}
      {anime.data ? <ContentRail title="Trending Anime" eyebrow="Jikan-ready" items={anime.data.top} onStartRoom={handleStartRoomClick} /> : null}

      {/* Discord-style Friend Activity Feed section */}
      {rooms.length > 0 && (
        <section className="glass rounded-[28px] p-6 border border-white/5 bg-[#111111]/85 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-black text-white flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#ff3d47]" />
                <span>Friends Activity Feed</span>
              </h2>
              <p className="text-xs text-neutral-400">See what anime your circle is streaming live and jump straight in.</p>
            </div>
            
            <Button
              className="bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl h-11 px-5 border border-white/5 font-extrabold text-sm"
              onClick={() => handleStartRoomClick()}
            >
              <Play className="h-4 w-4 text-[#ff3d47]" />
              <span>Create Public Party</span>
            </Button>
          </div>

          {/* Interactive Friend Row Cards */}
          <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
            {rooms.slice(0, 3).map((room) => {
              const host = Object.values(room.participants || {}).find(p => p.isHost) || Object.values(room.participants || {})[0] || { name: "Host", avatarColor: "#ff3d47" };
              const participantCount = Object.keys(room.participants || {}).length;

              return (
                <div
                  key={room.id}
                  className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-[#ff3d47]/20 hover:bg-white/5 transition-all duration-300 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-black text-white relative shadow-inner overflow-hidden"
                      style={{ backgroundColor: host.avatar ? undefined : (host.avatarColor || "#ff3d47") }}
                    >
                      {host.avatar ? (
                        <img src={host.avatar} alt={host.name || "Host"} className="h-full w-full object-cover" />
                      ) : (
                        (host.name || "Host").slice(0, 1).toUpperCase()
                      )}
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full ring-2 ring-[#111111]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-extrabold text-white group-hover:text-[#ff3d47] transition-colors truncate">{host.name}</h3>
                      <p className="text-[11px] text-neutral-400 font-semibold truncate">
                        {room.isPlaying ? "Watching" : "Waiting in"} {room.roomName}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-medium font-mono truncate">
                        {participantCount} {participantCount === 1 ? "member" : "members"} synced
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="bg-neutral-850 hover:bg-[#ff3d47] text-white hover:text-white rounded-xl h-8 text-[11px] font-black border border-white/5 transition-all flex-shrink-0"
                    onClick={() => {
                      play("click");
                      if (room.roomType === "private" || room.isPrivate) {
                        setSelectedPrivateRoom(room);
                        setPrivateJoinOpen(true);
                      } else {
                        navigate(`/room/${room.id}`);
                      }
                    }}
                  >
                    Join
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <StartTogetherModal open={startOpen} onClose={() => setStartOpen(false)} defaultVideoUrl={customUrl} selectedContent={selectedContent} />
      <PrivateJoinModal open={privateJoinOpen} room={selectedPrivateRoom} onClose={() => setPrivateJoinOpen(false)} onSuccess={(id) => navigate(`/room/${id}`)} />
    </div>
  );
}
