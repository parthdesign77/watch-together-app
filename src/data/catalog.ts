import type { ContentItem } from "../types";

const tmdb = (path: string, size = "w1280") => `https://image.tmdb.org/t/p/${size}${path}`;

export const movieSeeds: ContentItem[] = [
  {
    id: "movie-interstellar",
    sourceId: 157336,
    type: "movie",
    title: "Interstellar",
    subtitle: "A synchronized cosmic epic for late-night rooms.",
    overview:
      "A team travels through a wormhole in search of a new home for humanity, balancing spectacle with a deeply human pulse.",
    poster: tmdb("/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "w500"),
    backdrop: tmdb("/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg"),
    rating: 8.7,
    year: "2014",
    genres: ["Sci-Fi", "Drama", "Adventure"],
    runtime: "2h 49m",
    trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E"
  },
  {
    id: "movie-inception",
    sourceId: 27205,
    type: "movie",
    title: "Inception",
    subtitle: "Mind-bending dream heist energy.",
    overview:
      "A thief who steals corporate secrets through dreams gets one impossible shot at redemption.",
    poster: tmdb("/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", "w500"),
    backdrop: tmdb("/s3TBrRGB1iav7gFOCNx3H31MoES.jpg"),
    rating: 8.8,
    year: "2010",
    genres: ["Action", "Sci-Fi", "Thriller"],
    runtime: "2h 28m",
    trailerUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0"
  },
  {
    id: "movie-dark-knight",
    sourceId: 155,
    type: "movie",
    title: "The Dark Knight",
    subtitle: "A tense citywide watch party classic.",
    overview: "Batman faces a criminal mastermind whose chaos tests Gotham and everyone sworn to protect it.",
    poster: tmdb("/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "w500"),
    backdrop: tmdb("/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg"),
    rating: 9.0,
    year: "2008",
    genres: ["Action", "Drama", "Thriller"],
    runtime: "2h 32m",
    trailerUrl: "https://www.youtube.com/watch?v=EXeTwQWrcwY"
  },
  {
    id: "movie-dune",
    sourceId: 438631,
    type: "movie",
    title: "Dune",
    subtitle: "Massive desert scale, best in theater mode.",
    overview: "A gifted heir steps into a dangerous destiny on the planet Arrakis.",
    poster: tmdb("/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", "w500"),
    backdrop: tmdb("/iopYFB1b6Bh7FWZh3onQhph1sih.jpg"),
    rating: 8.0,
    year: "2021",
    genres: ["Sci-Fi", "Adventure", "Drama"],
    runtime: "2h 35m",
    trailerUrl: "https://www.youtube.com/watch?v=n9xhJrPXop4"
  },
  {
    id: "movie-oppenheimer",
    sourceId: 872585,
    type: "movie",
    title: "Oppenheimer",
    subtitle: "Prestige drama with huge room energy.",
    overview: "The story of J. Robert Oppenheimer and the creation of the atomic bomb.",
    poster: tmdb("/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", "w500"),
    backdrop: tmdb("/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg"),
    rating: 8.1,
    year: "2023",
    genres: ["Drama", "History"],
    runtime: "3h 0m",
    trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg"
  },
  {
    id: "movie-spiderverse",
    sourceId: 569094,
    type: "movie",
    title: "Spider-Man: Across the Spider-Verse",
    subtitle: "Color, motion, and reactions everywhere.",
    overview: "Miles Morales swings across the multiverse and meets a society of Spider-People.",
    poster: tmdb("/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", "w500"),
    backdrop: tmdb("/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg"),
    rating: 8.4,
    year: "2023",
    genres: ["Animation", "Action", "Adventure"],
    runtime: "2h 20m",
    trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg"
  }
];

export const animeSeeds: ContentItem[] = [
  {
    id: "anime-aot",
    sourceId: 16498,
    type: "anime",
    title: "Attack on Titan",
    subtitle: "High stakes, giant reactions.",
    overview: "Humanity fights for survival behind massive walls as terrifying truths emerge.",
    poster: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
    backdrop: "https://cdn.myanimelist.net/images/anime/10/47347l.jpg",
    rating: 8.5,
    year: "2013",
    genres: ["Action", "Drama", "Shonen"],
    studio: "Wit Studio",
    episodes: 25
  },
  {
    id: "anime-demon-slayer",
    sourceId: 38000,
    type: "anime",
    title: "Demon Slayer",
    subtitle: "Beautiful battles, big chat moments.",
    overview: "Tanjiro becomes a demon slayer after tragedy hits his family.",
    poster: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    backdrop: "https://cdn.myanimelist.net/images/anime/1286/99889l.jpg",
    rating: 8.4,
    year: "2019",
    genres: ["Action", "Fantasy", "Shonen"],
    studio: "ufotable",
    episodes: 26
  },
  {
    id: "anime-solo-leveling",
    sourceId: 52299,
    type: "anime",
    title: "Solo Leveling",
    subtitle: "Power fantasy built for group hype.",
    overview: "A weak hunter gains an extraordinary leveling system and steps into a darker world.",
    poster: "https://cdn.myanimelist.net/images/anime/1801/142390.jpg",
    backdrop: "https://cdn.myanimelist.net/images/anime/1801/142390l.jpg",
    rating: 8.3,
    year: "2024",
    genres: ["Action", "Fantasy"],
    studio: "A-1 Pictures",
    episodes: 12
  },
  {
    id: "anime-jujutsu-kaisen",
    sourceId: 40748,
    type: "anime",
    title: "Jujutsu Kaisen",
    subtitle: "Fast fights, perfect sync checks.",
    overview: "A student swallows a cursed object and joins a school for jujutsu sorcerers.",
    poster: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
    backdrop: "https://cdn.myanimelist.net/images/anime/1171/109222l.jpg",
    rating: 8.6,
    year: "2020",
    genres: ["Action", "Supernatural", "Shonen"],
    studio: "MAPPA",
    episodes: 24
  },
  {
    id: "anime-death-note",
    sourceId: 1535,
    type: "anime",
    title: "Death Note",
    subtitle: "Suspense made for late-night debate.",
    overview: "A brilliant student discovers a notebook with lethal power and begins a deadly cat-and-mouse game.",
    poster: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
    backdrop: "https://cdn.myanimelist.net/images/anime/9/9453l.jpg",
    rating: 8.6,
    year: "2006",
    genres: ["Mystery", "Thriller", "Shonen"],
    studio: "Madhouse",
    episodes: 37
  },
  {
    id: "anime-your-name",
    sourceId: 32281,
    type: "anime",
    title: "Your Name",
    subtitle: "A cinematic room favorite.",
    overview: "Two teenagers mysteriously swap bodies and become tied across time and distance.",
    poster: "https://cdn.myanimelist.net/images/anime/5/87048.jpg",
    backdrop: "https://cdn.myanimelist.net/images/anime/5/87048l.jpg",
    rating: 8.8,
    year: "2016",
    genres: ["Romance", "Drama", "Supernatural"],
    studio: "CoMix Wave Films",
    episodes: 1
  }
];

export const allSeeds = [...movieSeeds, ...animeSeeds];
