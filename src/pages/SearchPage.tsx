import { useQuery } from "@tanstack/react-query";
import { Search, History, Trash2, Sparkles, X, Flame } from "lucide-react";
import { FormEvent, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ContentCard } from "../components/media/ContentCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { StartTogetherModal } from "../components/room/StartTogetherModal";
import { searchContent } from "../services/contentService";
import { movieSeeds, animeSeeds } from "../data/catalog";
import type { ContentItem } from "../types";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") || "";
  const [value, setValue] = useState(initial);
  const [startOpen, setStartOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // Load search history from localStorage
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("watch-together-search-history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const searchTerm = useMemo(() => params.get("q") || "", [params]);

  const results = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: () => searchContent(searchTerm),
    enabled: Boolean(searchTerm)
  });

  // Sync state if param changes externally
  useEffect(() => {
    setValue(searchTerm);
  }, [searchTerm]);

  // Save history to localStorage
  const saveHistory = (newHistory: string[]) => {
    setHistory(newHistory);
    localStorage.setItem("watch-together-search-history", JSON.stringify(newHistory));
  };

  const addToHistory = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const filtered = history.filter((t) => t.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...filtered].slice(0, 5);
    saveHistory(updated);
  };

  const removeFromHistory = (termToRemove: string) => {
    const updated = history.filter((t) => t !== termToRemove);
    saveHistory(updated);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const queryStr = value.trim();
    if (queryStr) {
      setParams({ q: queryStr });
      addToHistory(queryStr);
    } else {
      setParams({});
    }
  }

  const handleTagClick = (term: string) => {
    setValue(term);
    setParams({ q: term });
    addToHistory(term);
  };

  // Trending Pill Tags
  const trendingTags = ["Naruto", "Interstellar", "Jujutsu Kaisen", "Demon Slayer", "Sci-Fi", "Action"];

  // Intelligent Suggestions Engine
  const relatedSuggestions = useMemo<ContentItem[]>(() => {
    const query = searchTerm.toLowerCase().trim();
    
    // 1. If searching for Anime or Shonen Action
    const isAnimeOrShonen = 
      query.includes("naruto") ||
      query.includes("boruto") ||
      query.includes("shippuden") ||
      query.includes("anime") ||
      query.includes("shonen") ||
      query.includes("jujutsu") ||
      query.includes("demon") ||
      query.includes("slayer") ||
      query.includes("titan") ||
      query.includes("aot") ||
      query.includes("solo") ||
      query.includes("death note") ||
      query.includes("your name") ||
      (results.data && results.data.some(item => item.type === "anime"));

    // 2. If searching for Blockbuster Sci-Fi / Action Movies
    const isSciFiOrMovie = 
      query.includes("interstellar") ||
      query.includes("inception") ||
      query.includes("dune") ||
      query.includes("dark knight") ||
      query.includes("oppenheimer") ||
      query.includes("movie") ||
      query.includes("sci-fi") ||
      query.includes("action") ||
      query.includes("spider") ||
      (results.data && results.data.some(item => item.type === "movie"));

    // Filter out items already in the results list to avoid duplicate rendering
    const resultIds = new Set(results.data?.map(item => item.id) || []);

    if (isAnimeOrShonen) {
      // Recommend high-quality Action & Shonen Anime seeds
      return animeSeeds
        .filter(item => !resultIds.has(item.id))
        .slice(0, 6);
    } else if (isSciFiOrMovie) {
      // Recommend blockbuster Sci-Fi and Action Movie seeds
      return movieSeeds
        .filter(item => !resultIds.has(item.id))
        .slice(0, 6);
    } else {
      // General/Initial discovery: A curated high-rated mixture
      const mixed = [
        ...movieSeeds.filter(m => ["movie-interstellar", "movie-inception", "movie-dune"].includes(m.id)),
        ...animeSeeds.filter(a => ["anime-jujutsu-kaisen", "anime-demon-slayer", "anime-naruto"].includes(a.id))
      ];
      return mixed
        .filter(item => !resultIds.has(item.id))
        .slice(0, 6);
    }
  }, [searchTerm, results.data]);

  return (
    <div className="space-y-8 pb-12">
      {/* Search Bar Block */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-panel/90 to-panel/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-red-600/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan/90">Synchronized Discovery</span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-white md:text-5xl">Search</h1>
          <p className="mt-2 text-sm text-muted max-w-xl">
            Find action series, movies, and legendary anime across our high-fidelity catalogs. Start a watch room instantly with any title.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Search for Naruto, Interstellar, Jujutsu Kaisen..."
                className="w-full h-12 rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 text-white placeholder:text-muted outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-all duration-300"
              />
              {value && (
                <button
                  type="button"
                  onClick={() => setValue("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="h-12 px-6 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-600/90 text-white font-bold rounded-xl shadow-lg shadow-cyan/20 flex items-center justify-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>

          {/* Search History & Trending */}
          <div className="mt-6 space-y-4 border-t border-white/5 pt-5">
            {/* History Tags */}
            {history.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted min-w-[110px]">
                  <History className="h-3.5 w-3.5" />
                  Recent Searches:
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  {history.map((term, index) => (
                    <div
                      key={`${term}-${index}`}
                      className="group flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-3 pr-2 py-1 text-xs font-medium text-snow transition-all duration-200 cursor-pointer"
                    >
                      <span onClick={() => handleTagClick(term)} className="hover:text-cyan transition-colors">
                        {term}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromHistory(term)}
                        className="text-muted hover:text-red-400 rounded-full p-0.5 hover:bg-white/10 transition-colors"
                        aria-label={`Remove ${term} from history`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-[11px] font-semibold text-red-400 hover:text-red-300 hover:underline ml-2 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Trending Tags */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted min-w-[110px]">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                Trending Now:
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="bg-white/5 hover:bg-cyan/15 hover:border-cyan/30 border border-white/5 rounded-full px-3 py-1 text-xs font-medium text-muted hover:text-cyan transition-all duration-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results Block */}
      <section className="space-y-4">
        {searchTerm && (
          <h2 className="text-xl font-bold flex items-center gap-2 text-snow">
            <span>Results for</span>
            <span className="text-cyan px-2 py-0.5 bg-cyan/10 border border-cyan/20 rounded font-mono text-lg font-semibold">
              "{searchTerm}"
            </span>
          </h2>
        )}

        {results.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        ) : results.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
            {results.data.map((item) => (
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
        ) : searchTerm ? (
          <EmptyState
            icon={Search}
            title="No matches found"
            description="We couldn't find matching titles. Try checking the spelling or try searching one of our trending tags."
          />
        ) : (
          <div className="py-6 flex flex-col items-center justify-center border border-white/5 bg-white/2 rounded-2xl p-8 text-center text-muted">
            <Search className="h-10 w-10 mb-3 text-white/20" />
            <p className="text-sm font-medium">Ready to discover?</p>
            <p className="text-xs text-muted max-w-sm mt-1">Type in a title above or click one of the trending categories to see synched media recommendations.</p>
          </div>
        )}
      </section>

      {/* Suggested Recommendations Rail */}
      <section className="border-t border-white/5 pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan/10 border border-cyan/20">
              <Sparkles className="h-4.5 w-4.5 text-cyan" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-snow">Suggested Related Content</h2>
              <p className="text-xs text-muted">Intelligently curated recommendations based on your preferences</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
          {relatedSuggestions.map((item) => (
            <ContentCard
              key={`suggest-${item.id}`}
              item={item}
              onStartRoom={(content) => {
                setSelectedContent(content);
                setStartOpen(true);
              }}
            />
          ))}
        </div>
      </section>

      {/* Unified Start Together Modal */}
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
