import { useQuery } from "@tanstack/react-query";
import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ContentCard } from "../components/media/ContentCard";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { StartTogetherModal } from "../components/room/StartTogetherModal";
import { getAnimeRows, getMovieRows } from "../services/contentService";
import type { ContentItem } from "../types";

export function CatalogPage({ type }: { type: "movie" | "anime" }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [startOpen, setStartOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const movies = useQuery({ queryKey: ["movieRows"], queryFn: getMovieRows, enabled: type === "movie" });
  const anime = useQuery({ queryKey: ["animeRows"], queryFn: getAnimeRows, enabled: type === "anime" });

  const items = useMemo<ContentItem[]>(() => {
    const rows =
      type === "movie"
        ? movies.data
          ? [...movies.data.trending, ...movies.data.popular, ...movies.data.topRated, ...movies.data.upcoming]
          : []
        : anime.data
          ? [...anime.data.top, ...anime.data.seasonal, ...anime.data.airing]
          : [];
    return rows.filter((item, index, all) => all.findIndex((match) => match.id === item.id) === index);
  }, [anime.data, movies.data, type]);

  const genres = ["All", ...Array.from(new Set(items.flatMap((item) => item.genres))).slice(0, 10)];
  const filtered = items.filter((item) => {
    const matchesQuery = !query || item.title.toLowerCase().includes(query.toLowerCase()) || item.overview.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = genre === "All" || item.genres.includes(genre);
    return matchesQuery && matchesGenre;
  });

  const loading = type === "movie" ? movies.isLoading : anime.isLoading;

  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-6">
        <Badge tone={type === "anime" ? "green" : "orange"}>{type === "movie" ? "TMDB Movies" : "Jikan Anime"}</Badge>
        <h1 className="mt-4 font-display text-4xl font-black">{type === "movie" ? "Trending Movies" : "Trending Anime"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Search, filter, open details, add to watchlist, or start a synchronized room from any title.
        </p>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <label className="flex h-12 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/8 px-3">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${type === "movie" ? "movies" : "anime"}...`}
              className="min-w-0 flex-1 bg-transparent text-base md:text-sm outline-none placeholder:text-muted"
            />
          </label>
          <label className="flex h-12 items-center gap-2 rounded-lg border border-white/10 bg-white/8 px-3">
            <Filter className="h-4 w-4 text-muted" />
            <select value={genre} onChange={(event) => setGenre(event.target.value)} className="bg-transparent text-sm outline-none">
              {genres.map((item) => (
                <option key={item} className="bg-ink" value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[2/3]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
          {filtered.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onStartRoom={(content) => {
                setSelectedContent(content);
                setStartOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="secondary">Load more</Button>
      </div>

      {selectedContent && (
        <StartTogetherModal
          open={startOpen}
          onClose={() => setStartOpen(false)}
          selectedContent={selectedContent}
        />
      )}
    </div>
  );
}
