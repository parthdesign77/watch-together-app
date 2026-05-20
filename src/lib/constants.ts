import type { SubscriptionPlan } from "../types";

export const APP_NAME = "Watch Together";

export const ROOM_TTL_MS = 1000 * 60 * 60 * 6;

export const REACTIONS = ["❤️", "🔥", "😂", "😭", "😱", "👍"];

export const planDetails: Record<
  Exclude<SubscriptionPlan, "free">,
  {
    name: string;
    price: string;
    accent: string;
    participants: string;
    features: string[];
  }
> = {
  standard: {
    name: "Standard",
    price: "₹200/month",
    accent: "from-red-500 to-rose-300",
    participants: "Up to 5 participants",
    features: [
      "Completely ad-free",
      "HD 720p watch rooms",
      "Real-time playback sync",
      "Live chat and emoji reactions",
      "Basic screen sharing",
      "Voice chat",
      "Watchlists and anime/movie browsing"
    ]
  },
  premium: {
    name: "Premium",
    price: "₹700/month",
    accent: "from-red-700 via-red-500 to-rose-300",
    participants: "Up to 20 participants",
    features: [
      "Full HD 1080p rooms",
      "Ultra-low latency sync",
      "Premium voice controls",
      "HD screen sharing with system audio",
      "Unlimited watch rooms",
      "Advanced room controls",
      "Premium profile badge",
      "Theater themes and faster reconnect"
    ]
  }
};

export const turnServers = [
  { urls: "stun:stun.l.google.com:19302" },
  ...(import.meta.env.VITE_TURN_SERVER_URL
    ? [
        {
          urls: import.meta.env.VITE_TURN_SERVER_URL,
          username: import.meta.env.VITE_TURN_SERVER_USERNAME,
          credential: import.meta.env.VITE_TURN_SERVER_PASSWORD
        }
      ]
    : [])
];

export const appUrl = typeof window !== "undefined" ? window.location.origin : import.meta.env.VITE_APP_URL;
