import axios from "axios";
import { animeSeeds, movieSeeds } from "../data/catalog";
import type { ContentItem } from "../types";

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

export async function getMovieRows() {
  if (!TMDB_API_KEY) {
    return {
      trending: movieSeeds,
      popular: [...movieSeeds].reverse(),
      topRated: movieSeeds.slice(1),
      upcoming: movieSeeds.slice(0, 4)
    };
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

  return {
    trending: trending.data.results.map(mapMovie),
    popular: popular.data.results.map(mapMovie),
    topRated: topRated.data.results.map(mapMovie),
    upcoming: upcoming.data.results.map(mapMovie)
  };
}

export async function getAnimeRows() {
  try {
    const client = axios.create({ baseURL: JIKAN_BASE_URL });
    const [top, seasonal, airing] = await Promise.all([
      client.get("/top/anime", { params: { limit: 12 } }),
      client.get("/seasons/now", { params: { limit: 12 } }),
      client.get("/top/anime", { params: { filter: "airing", limit: 12 } })
    ]);

    return {
      top: top.data.data.map(mapAnime),
      seasonal: seasonal.data.data.map(mapAnime),
      airing: airing.data.data.map(mapAnime)
    };
  } catch {
    return {
      top: animeSeeds,
      seasonal: [...animeSeeds].reverse(),
      airing: animeSeeds.slice(0, 4)
    };
  }
}

export async function searchContent(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const local = [...movieSeeds, ...animeSeeds].filter((item) =>
    [item.title, item.overview, item.genres.join(" ")].join(" ").toLowerCase().includes(normalized)
  );

  const remote: ContentItem[] = [];

  if (TMDB_API_KEY) {
    const movies = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: { api_key: TMDB_API_KEY, query }
    });
    remote.push(...movies.data.results.slice(0, 8).map(mapMovie));
  }

  try {
    const anime = await axios.get(`${JIKAN_BASE_URL}/anime`, { params: { q: query, limit: 8 } });
    remote.push(...anime.data.data.map(mapAnime));
  } catch {
    // Local results keep search usable if the public anime API rate limits.
  }

  return [...remote, ...local].filter((item, index, items) => items.findIndex((match) => match.id === item.id) === index);
}
