import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, Clock, Heart, Play, Share2, Sparkles, Star, Users } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { StartTogetherModal } from "../components/room/StartTogetherModal";
import { useAuth } from "../context/AuthContext";
import { allSeeds } from "../data/catalog";
import { useStartRoom } from "../hooks/useStartRoom";
import { toggleWatchlist } from "../hooks/useWatchlist";
import { getAnimeRows, getMovieRows } from "../services/contentService";
import { useUiStore } from "../store/uiStore";
import type { ContentItem } from "../types";

export function DetailPage({ type }: { type: "movie" | "anime" }) {
  const { id } = useParams();
  const { profile } = useAuth();
  const startRoom = useStartRoom();
  const pushToast = useUiStore((state) => state.pushToast);
  const [startOpen, setStartOpen] = useState(false);
  const movieRows = useQuery({ queryKey: ["movieRows"], queryFn: getMovieRows, enabled: type === "movie" });
  const animeRows = useQuery({ queryKey: ["animeRows"], queryFn: getAnimeRows, enabled: type === "anime" });

  const remoteItems: ContentItem[] =
    type === "movie" && movieRows.data
      ? [...movieRows.data.trending, ...movieRows.data.popular, ...movieRows.data.topRated, ...movieRows.data.upcoming]
      : type === "anime" && animeRows.data
        ? [...animeRows.data.top, ...animeRows.data.seasonal, ...animeRows.data.airing]
        : [];

  const item = [...remoteItems, ...allSeeds].find((content) => content.id === id && content.type === type);

  if (!id) return <Navigate to={`/${type === "movie" ? "movies" : "anime"}`} replace />;

  if (!item) {
    return (
      <div className="glass rounded-lg p-8">
        <h1 className="font-display text-3xl font-black">Still loading this title</h1>
        <p className="mt-2 text-muted">If it does not appear, return to the catalog and open another title.</p>
      </div>
    );
  }

  async function save() {
    if (!profile || !item) return;
    await toggleWatchlist(profile, item, "favorite");
    pushToast({ title: "Saved to favorites", description: item.title, type: "success" });
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-lg border border-white/10">
        <img src={item.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/82 to-ink/20" />
        <div className="relative z-10 grid gap-6 p-5 md:grid-cols-[260px_1fr] md:p-8">
          <img src={item.poster} alt={item.title} className="aspect-[2/3] w-full rounded-lg border border-white/10 object-cover shadow-2xl" />
          <div className="flex max-w-4xl flex-col justify-end py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone={item.type === "anime" ? "green" : "orange"}>{item.type}</Badge>
              <Badge tone="purple">
                <Sparkles className="h-3.5 w-3.5" />
                Watch Together Ready
              </Badge>
            </div>
            <h1 className="font-display text-4xl font-black leading-none md:text-6xl">{item.title}</h1>
            <p className="mt-4 text-lg text-slate-200">{item.subtitle}</p>
            <p className="mt-4 max-w-3xl leading-7 text-slate-300">{item.overview}</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-slate-200">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                {item.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan" />
                {item.year}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-anime" />
                {item.runtime || `${item.episodes || 1} episodes`}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {item.genres.map((genre) => (
                <span key={genre} className="rounded-md border border-white/10 bg-white/8 px-3 py-1 text-sm">
                  {genre}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setStartOpen(true)}>
                <Play className="h-5 w-5" />
                Start Room
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setStartOpen(true)}>
                <Users className="h-5 w-5" />
                Watch Together
              </Button>
              <Button variant="ghost" size="lg" onClick={save}>
                <Heart className="h-5 w-5" />
                Add to Watchlist
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                  pushToast({ title: "Link copied", description: "Share this title with friends.", type: "success" });
                }}
              >
                <Share2 className="h-5 w-5" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="glass rounded-lg p-5">
          <h2 className="font-display text-xl font-bold">{type === "anime" ? "Episode Picker" : "Trailer Preview"}</h2>
          <p className="mt-2 text-sm text-muted">
            {type === "anime"
              ? "Sub/dub UI, episode navigation, recommendations, and MAL-style metadata are ready for the room flow."
              : "Trailer rooms use the same synchronized player controls as MP4/HLS watch rooms."}
          </p>
        </article>
        <article className="glass rounded-lg p-5">
          <h2 className="font-display text-xl font-bold">{type === "anime" ? "Studio Info" : "Cast & Crew"}</h2>
          <p className="mt-2 text-sm text-muted">{item.studio || "TMDB/Jikan enrichment can be expanded with cast, characters, studio, and similar-title endpoints."}</p>
        </article>
        <article className="glass rounded-lg p-5">
          <h2 className="font-display text-xl font-bold">Recommendations</h2>
          <p className="mt-2 text-sm text-muted">The dashboard rows and search overlay reuse this title metadata for quick room creation.</p>
        </article>
      </section>

      <StartTogetherModal open={startOpen} onClose={() => setStartOpen(false)} selectedContent={item} />
    </div>
  );
}
