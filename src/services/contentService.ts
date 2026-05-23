import axios from "axios";
import { animeSeeds, movieSeeds } from "../data/catalog";
import type { ContentItem } from "../types";
import { startMeasure } from "../utils/performance";

const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || "https://api.themoviedb.org/3";
const JIKAN_BASE_URL = import.meta.env.VITE_JIKAN_BASE_URL || "https://api.jikan.moe/v4";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const tmdbImage = (path?: string | null, size = "w780") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : movieSeeds[0].backdrop;

function mapMovie(movie: any): ContentItem {
  return {
    id: `movie-${movie.id}`,
    sourceId: movie.id,
    type: "movie",
    title: movie.title || movie.name,
    subtitle: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "Trending now",
    overview: movie.overview || "A cinematic title ready to start in a synchronized watch room.",
    poster: tmdbImage(movie.poster_path, "w500"),
    backdrop: tmdbImage(movie.backdrop_path, "w1280"),
    rating: Number(movie.vote_average || 0),
    year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "2026",
    genres: ["Movie"],
    runtime: "Feature"
  };
}

function mapAnime(anime: any): ContentItem {
  return {
    id: `anime-${anime.mal_id}`,
    sourceId: anime.mal_id,
    type: "anime",
    title: anime.title_english || anime.title,
    subtitle: anime.studios?.[0]?.name || anime.status || "Anime",
    overview: anime.synopsis || "A top anime title ready for a synchronized watch room.",
    poster: anime.images?.jpg?.large_image_url || anime.images?.webp?.large_image_url || animeSeeds[0].poster,
    backdrop: anime.images?.jpg?.large_image_url || animeSeeds[0].backdrop,
    rating: Number(anime.score || 0),
    year: anime.year?.toString() || anime.aired?.prop?.from?.year?.toString() || "Anime",
    genres: anime.genres?.slice(0, 4).map((genre: any) => genre.name) || ["Anime"],
    studio: anime.studios?.[0]?.name,
    episodes: anime.episodes
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes fresh timer

const memoryCache = {
  movieRows: null as CacheEntry<any> | null,
  animeRows: null as CacheEntry<any> | null,
  search: new Map<string, CacheEntry<ContentItem[]>>()
};

export async function getMovieRows() {
  const endMeasure = startMeasure("getMovieRows");
  try {
    const now = Date.now();
    if (memoryCache.movieRows && now - memoryCache.movieRows.timestamp < CACHE_TTL) {
      return memoryCache.movieRows.data;
    }

    if (!TMDB_API_KEY) {
      const data = {
        trending: movieSeeds,
        popular: [...movieSeeds].reverse(),
        topRated: movieSeeds.slice(1),
        upcoming: movieSeeds.slice(0, 4)
      };
      memoryCache.movieRows = { data, timestamp: now };
      return data;
    }

    const client = axios.create({
      baseURL: TMDB_BASE_URL,
      params: { api_key: TMDB_API_KEY }
    });

    const [trending, popular, topRated, upcoming] = await Promise.all([
      client.get("/trending/movie/week"),
      client.get("/movie/popular"),
      client.get("/movie/top_rated"),
      client.get("/movie/upcoming")
    ]);

    const data = {
      trending: trending.data.results.map(mapMovie),
      popular: popular.data.results.map(mapMovie),
      topRated: topRated.data.results.map(mapMovie),
      upcoming: upcoming.data.results.map(mapMovie)
    };

    memoryCache.movieRows = { data, timestamp: now };
    return data;
  } finally {
    endMeasure();
  }
}

export async function getAnimeRows() {
  const endMeasure = startMeasure("getAnimeRows");
  try {
    const now = Date.now();
    if (memoryCache.animeRows && now - memoryCache.animeRows.timestamp < CACHE_TTL) {
      return memoryCache.animeRows.data;
    }

    try {
      const client = axios.create({ baseURL: JIKAN_BASE_URL });
      const [top, seasonal, airing] = await Promise.all([
        client.get("/top/anime", { params: { limit: 12 } }),
        client.get("/seasons/now", { params: { limit: 12 } }),
        client.get("/top/anime", { params: { filter: "airing", limit: 12 } })
      ]);

      const data = {
        top: top.data.data.map(mapAnime),
        seasonal: seasonal.data.data.map(mapAnime),
        airing: airing.data.data.map(mapAnime)
      };

      memoryCache.animeRows = { data, timestamp: now };
      return data;
    } catch {
      const data = {
        top: animeSeeds,
        seasonal: [...animeSeeds].reverse(),
        airing: animeSeeds.slice(0, 4)
      };
      // Cache the fallback with a 1 minute window to allow fast recovery if network heals
      memoryCache.animeRows = { data, timestamp: now - (CACHE_TTL - 60000) };
      return data;
    }
  } finally {
    endMeasure();
  }
}

export async function searchContent(query: string) {
  const endMeasure = startMeasure("searchContent");
  try {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const now = Date.now();
    const cached = memoryCache.search.get(normalized);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const local = [...movieSeeds, ...animeSeeds].filter((item) =>
      [item.title, item.overview, item.genres.join(" ")].join(" ").toLowerCase().includes(normalized)
    );

    const remote: ContentItem[] = [];
    const searchPromises: Promise<void>[] = [];

    if (TMDB_API_KEY) {
      searchPromises.push(
        axios
          .get(`${TMDB_BASE_URL}/search/movie`, {
            params: { api_key: TMDB_API_KEY, query }
          })
          .then((res) => {
            remote.push(...res.data.results.slice(0, 8).map(mapMovie));
          })
          .catch((e) => {
            console.warn("TMDB search failed:", e);
          })
      );
    }

    searchPromises.push(
      axios
        .get(`${JIKAN_BASE_URL}/anime`, { params: { q: query, limit: 8 } })
        .then((res) => {
          remote.push(...res.data.data.map(mapAnime));
        })
        .catch((e) => {
          console.warn("Jikan search failed:", e);
        })
    );

    await Promise.allSettled(searchPromises);

    const merged = [...remote, ...local].filter((item, index, items) => items.findIndex((match) => match.id === item.id) === index);
    
    memoryCache.search.set(normalized, { data: merged, timestamp: now });
    return merged;
  } finally {
    endMeasure();
  }
}

const itemCache = new Map<string, CacheEntry<ContentItem>>();

export async function getContentItem(id: string, type: "movie" | "anime"): Promise<ContentItem> {
  const endMeasure = startMeasure(`getContentItem-${id}`);
  try {
    const normalized = id.trim();
    const now = Date.now();
    const cached = itemCache.get(normalized);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // 1. Check local seed catalog first to avoid API call
    const localItem = [...movieSeeds, ...animeSeeds].find((item) => item.id === id);
    if (localItem) {
      return localItem;
    }

    const sourceId = id.replace(`${type}-`, "");

    try {
      if (type === "movie") {
        if (!TMDB_API_KEY) {
          throw new Error("TMDB API key not available");
        }
        const client = axios.create({
          baseURL: TMDB_BASE_URL,
          params: { api_key: TMDB_API_KEY }
        });
        const res = await client.get(`/movie/${sourceId}`);
        const mapped = mapMovie(res.data);
        itemCache.set(normalized, { data: mapped, timestamp: now });
        return mapped;
      } else {
        const client = axios.create({ baseURL: JIKAN_BASE_URL });
        const res = await client.get(`/anime/${sourceId}`);
        const mapped = mapAnime(res.data.data);
        itemCache.set(normalized, { data: mapped, timestamp: now });
        return mapped;
      }
    } catch (e) {
      // Catch rate limits/errors, try to find in existing memoryCache rows
      if (type === "movie" && memoryCache.movieRows) {
        const found = [
          ...memoryCache.movieRows.data.trending,
          ...memoryCache.movieRows.data.popular,
          ...memoryCache.movieRows.data.topRated,
          ...memoryCache.movieRows.data.upcoming
        ].find((m) => m.id === id);
        if (found) return found;
      } else if (type === "anime" && memoryCache.animeRows) {
        const found = [
          ...memoryCache.animeRows.data.top,
          ...memoryCache.animeRows.data.seasonal,
          ...memoryCache.animeRows.data.airing
        ].find((a) => a.id === id);
        if (found) return found;
      }

      // Hard fallback to allSeeds
      const fallback = [...movieSeeds, ...animeSeeds].find((content) => content.id === id);
      if (fallback) return fallback;
      throw e;
    }
  } finally {
    endMeasure();
  }
}
