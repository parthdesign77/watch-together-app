export type ContentType = "movie" | "anime" | "youtube" | "mp4" | "hls" | "screen";

export type RoomStatus = "waiting" | "watching" | "paused" | "buffering" | "screen-sharing" | "ended";

export type SubscriptionPlan = "free" | "standard" | "premium";

export interface ContentItem {
  id: string;
  sourceId?: number | string;
  type: "movie" | "anime";
  title: string;
  subtitle?: string;
  overview: string;
  poster: string;
  backdrop: string;
  rating: number;
  year: string;
  genres: string[];
  runtime?: string;
  trailerUrl?: string;
  studio?: string;
  episodes?: number;
}

export interface Participant {
  uid: string;
  name: string;
  avatar: string;
  avatarColor: string;
  joinedAt: number;
  isHost?: boolean;
  isMuted?: boolean;
  isSpeaking?: boolean;
  isBuffering?: boolean;
  isScreenSharing?: boolean;
  isCameraOn?: boolean;
  screenStreamId?: string | null;
  cameraStreamId?: string | null;
  connectionQuality?: "excellent" | "good" | "fair" | "poor";
  isHandRaised?: boolean;
  isTyping?: boolean;
  subscriptionPlan?: SubscriptionPlan;
  premiumBadge?: boolean;
}

export interface WatchRoom {
  id: string;
  code: string;
  hostId: string;
  roomName: string;
  videoUrl: string;
  contentType: ContentType;
  contentId?: string;
  episode?: string;
  currentTime: number;
  isPlaying: boolean;
  isScreenSharing: boolean;
  screenShareHost?: string | null;
  roomType: "public" | "private";
  participants: Record<string, Participant>;
  status: RoomStatus;
  isPrivate: boolean;
  password?: string;
  quality: "480p" | "720p" | "1080p" | "auto";
  maxQuality?: "480p" | "720p" | "1080p";
  audioChannel?: string;
  audioLanguage?: string;
  theaterMode: boolean;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  readyCheck?: {
    active: boolean;
    status: Record<string, boolean>;
    startedAt: number;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  reactions: Record<string, string[]>;
  sentAt: number;
  pinned?: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  avatarColor: string;
  watchlist: string[];
  recentRooms: string[];
  viewingHistory: string[];
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: "inactive" | "active" | "cancelled" | "past_due";
  subscriptionStart?: number;
  subscriptionEnd?: number;
  paymentProvider?: "razorpay" | "stripe" | "demo";
  premiumBadge: boolean;
  createdAt: number;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  contentType: "movie" | "anime";
  contentId: string;
  title: string;
  poster: string;
  status: "watch_later" | "favorite" | "watched";
  progress: number;
  addedAt: number;
}
