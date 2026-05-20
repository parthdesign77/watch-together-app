Build a COMPLETE production-ready full-stack web application called “Watch Together” — a premium real-time synchronized streaming platform where users can watch movies, anime, YouTube videos, MP4 files, HLS streams, and LIVE screen shares together remotely with friends in perfect sync.

The platform should feel like a combination of:
- Netflix
- Discord
- Crunchyroll
- Teleparty
- Apple TV
- Plex
- Zoom

The application must include:
- cinematic premium UI
- buttery smooth animations
- ultra-modern responsive layouts
- real-time synchronization
- scalable backend architecture
- WebRTC-based screen sharing
- high-quality system audio streaming
- Discord-style voice chat
- production-level code structure
- deployment-ready setup

==================================================
PROJECT OVERVIEW
==================================================

App Name:
Watch Together

Goal:
Allow users to:
- Create watch rooms
- Invite friends using room links/codes
- Watch movies/anime/videos together
- Synchronize playback in real time
- Live chat while watching
- React with emojis
- Share their screen with HD audio
- Talk with friends using voice chat
- Browse trending movies/anime
- Save watchlists
- Continue watching
- Experience near-zero latency sync

==================================================
TECH STACK
==================================================

FRONTEND:
- React.js (Vite)
- Tailwind CSS
- Framer Motion
- ShadCN UI
- React Router DOM
- Zustand or Redux Toolkit
- Axios
- TanStack Query
- Socket.IO Client
- React Player
- HLS.js
- Lucide React Icons
- WebRTC APIs

BACKEND:
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT Authentication
- Passport.js
- Google OAuth
- Microsoft OAuth
- bcrypt
- Redis (optional)
- WebRTC signaling server

REAL-TIME:
- Socket.IO
- WebRTC
- STUN/TURN support
- Peer-to-peer streaming
- Low-latency synchronization

HOSTING:
Frontend:
- Vercel

Backend:
- Railway or Render

Database:
- MongoDB Atlas

==================================================
PREMIUM UI THEME
==================================================

Create a PREMIUM CINEMATIC DARK UI.

COLORS:

Primary Background:
#030303

Secondary Background:
#090909

Card Background:
#111111

Elevated Surface:
#1A1A1A

Premium Red:
#DC2626

Neon Red:
#EF4444

Rose Accent:
#FB7185

Deep Cinema Red:
#991B1B

Danger Red:
#EF4444

Primary Text:
#F9FAFB

Secondary Text:
#94A3B8

Effects:
- Glassmorphism
- Soft neon glows
- Blur overlays
- Floating gradients
- Cinematic shadows
- Hover scaling
- Animated borders
- Gradient buttons
- Dynamic lighting
- Smooth transitions

TYPOGRAPHY:
- Inter
- Plus Jakarta Sans

==================================================
AUTHENTICATION SYSTEM
==================================================

Implement:
- Email/password signup
- Login
- Google OAuth Login
- Microsoft OAuth Login
- JWT authentication
- Refresh Tokens
- Remember Me
- Forgot Password
- Reset Password
- Session persistence
- Secure logout
- Protected routes

SOCIAL AUTH:
- Continue with Google
- Continue with Microsoft

SECURITY:
- bcrypt password hashing
- HTTP-only cookies
- CSRF protection
- Rate limiting
- Device session tracking

==================================================
PREMIUM SUBSCRIPTION SYSTEM
==================================================

Create a full subscription system.

==================================================
PLAN 1 — STANDARD
==================================================

Price:
₹200/month

FEATURES:
- Completely ad-free
- Watch with friends
- Real-time sync
- HD streaming (720p)
- Live chat
- Basic screen share
- Voice chat
- Up to 5 participants
- Invite via link/code
- Watchlist
- Anime & movie browsing

==================================================
PLAN 2 — PREMIUM
==================================================

Price:
₹700/month

FEATURES:
- Completely ad-free
- Full HD 1080p streaming
- Ultra-low latency sync
- Premium voice chat
- Premium screen sharing
- System audio sharing
- Unlimited watch rooms
- Up to 20 participants
- Advanced room controls
- Priority sync servers
- Better stream quality
- Theater mode
- Multiple device support
- Premium profile badge
- Faster reconnect
- AI recommendations
- Exclusive cinematic themes
- Early access features

==================================================
PAYMENT SYSTEM
==================================================

Integrate:
- Razorpay OR Stripe

FEATURES:
- Secure checkout
- Subscription renewal
- Upgrade/Downgrade
- Cancel anytime
- Billing history
- Invoice generation
- Premium badge

==================================================
HOMEPAGE DESIGN
==================================================

Create a cinematic homepage with:
- fullscreen hero section
- animated movie background
- floating gradient overlays
- trending content carousels
- Netflix-style horizontal rows
- hover trailer previews
- animated CTA buttons
- smooth scroll animations

Homepage Sections:
1. Hero Banner
2. Trending Movies
3. Trending Anime
4. Continue Watching
5. Recently Added
6. Popular This Week
7. Friends Watching
8. Recommended For You

==================================================
MOVIES SECTION
==================================================

Use TMDB API.

FEATURES:
- Trending movies
- Popular movies
- Top-rated movies
- Upcoming movies
- Search functionality
- Genre filtering
- Infinite scrolling
- Movie recommendations

MOVIE DETAIL PAGE:
Include:
- poster
- cinematic backdrop
- trailer
- overview
- cast
- rating
- release date
- genres
- runtime
- similar movies

Buttons:
- Watch Together
- Add to Watchlist
- Share
- Start Room

Genres:
- Action
- Comedy
- Horror
- Romance
- Sci-Fi
- Drama
- Thriller
- Fantasy
- Adventure

==================================================
ANIME SECTION
==================================================

Use Jikan API.

FEATURES:
- Seasonal anime
- Top anime
- Airing anime
- Search anime
- Genre filtering
- Episode browsing
- MAL ratings
- Studio info
- Episode picker

DETAIL PAGE:
Include:
- anime banner
- synopsis
- episodes
- genres
- characters
- recommendations
- sub/dub toggle UI

Genres:
- Shonen
- Isekai
- Romance
- Action
- Slice of Life
- Horror

==================================================
WATCHLIST SYSTEM
==================================================

Implement:
- Watch Later
- Favorites
- Watched History
- Shared watchlists
- Collections
- Continue watching progress

==================================================
INVITE FRIEND SYSTEM
==================================================

Create a complete “Invite Friends” system similar to Discord + Teleparty.

FEATURES:
- Generate unique invite links
- Generate short alphanumeric room invite code
- Copy invite button
- Share invite via:
  - WhatsApp
  - Telegram
  - Discord
  - Twitter/X
  - Email

INVITE FLOW:
1. Host creates room
2. Room generates:
   - shareable URL
   - invite code
3. Friends open link OR enter code
4. Friends instantly join room
5. Auto-sync current playback state
6. Show animated “User Joined” notification

==================================================
WATCH ROOM SYSTEM
==================================================

ROOM FEATURES:
- Public/private rooms
- Room password
- Shareable invite links
- short alphanumeric room codes
- Host permissions
- Auto cleanup after inactivity
- Persistent room state

ROOM STATES:
- Waiting
- Watching
- Paused
- Buffering
- Screen Sharing
- Ended

==================================================
VIDEO PLAYER SYSTEM
==================================================

Support:
- YouTube embeds
- MP4 URLs
- HLS streams
- Screen share streams
- Anime episodes
- Movie trailers

PLAYER FEATURES:
- play/pause sync
- synchronized seek
- volume controls
- subtitles UI
- playback speed
- fullscreen
- theater mode
- mini-player
- timestamp sync
- auto-resync
- latency correction

LATENCY ENGINE:
Implement:
- drift detection
- auto timestamp correction
- sync heartbeat
- playback authority system
- adaptive buffering

==================================================
VOICE CHAT SYSTEM
==================================================

Add Discord-quality real-time voice chat using WebRTC.

FEATURES:
- Voice call inside room
- Push-to-talk option
- Toggle mute/unmute
- Voice activity detection
- Noise suppression
- Echo cancellation
- Automatic gain control
- Spatial-style voice UI
- Live speaking indicators

VOICE UI:
- microphone button
- mute indicator
- speaking glow around avatar
- connection quality indicator
- user volume slider
- voice connected badge

VOICE CONNECTION:
- auto join voice on room entry
- reconnect automatically if disconnected
- peer-to-peer voice streaming
- low latency voice communication

==================================================
SCREEN SHARE SYSTEM
==================================================

Implement DISCORD-LEVEL screen sharing with system audio.

FEATURES:
- Share full monitor
- Share browser tab
- Share app window
- Share screen with audio
- Switch screen during stream
- Share webcam overlay
- Picture-in-picture support

QUALITY:
Support:
- 720p
- 1080p
- adaptive bitrate
- dynamic quality adjustment
- ultra-low latency
- smooth frame delivery
- optimize for weak internet

AUDIO:
- system audio sharing
- crystal-clear voice
- echo cancellation
- noise suppression
- stereo audio support

SCREEN SHARE UI:
- “User is sharing screen”
- LIVE badge
- HD quality badge
- bitrate indicator
- stream quality selector
- floating stream controls
- reconnect overlay if stream disconnects

==================================================
LIVE CHAT SYSTEM
==================================================

Build a real-time chat sidebar.

FEATURES:
- live messages
- emoji reactions
- typing indicators
- GIF support
- pinned messages
- timestamps
- unread count
- mention system

REACTIONS:
- ❤️
- 🔥
- 😂
- 😭
- 😱
- 👍

==================================================
USER PRESENCE SYSTEM
==================================================

Show:
- online users
- avatars
- speaking indicators
- buffering indicators
- syncing status
- host crown
- live connection quality
- mic muted icon
- screen sharing badge

==================================================
MOBILE RESPONSIVE DESIGN
==================================================

The app must be PERFECTLY responsive.

MOBILE LAYOUT:
- stacked player/chat
- collapsible chat
- floating bottom navigation
- swipe gestures
- mobile-friendly controls

==================================================
ADVANCED ANIMATIONS
==================================================

Use Framer Motion heavily.

Include:
- page transitions
- hover effects
- animated gradients
- modal animations
- loading skeletons
- smooth scrolling
- fade reveals
- shared layout transitions

==================================================
SCREENS TO BUILD
==================================================

1. Landing Page
2. Login Page
3. Signup Page
4. Google OAuth Screen
5. Microsoft OAuth Screen
6. Dashboard
7. Trending Movies
8. Trending Anime
9. Movie Detail
10. Anime Detail
11. Watch Room
12. Screen Share Room
13. Watchlist
14. User Profile
15. Notifications
16. Settings
17. Audio Settings
18. Streaming Settings
19. Pricing Page
20. Billing Page
21. Subscription Management
22. Payment Success Page
23. Payment Failed Page
24. Room Settings Modal
25. Invite Friends Modal
26. Continue Watching
27. Search Results
28. Mobile Navigation
29. Admin Panel
30. Room Expired Page
31. 404 Page

==================================================
DATABASE SCHEMA
==================================================

USER:
{
  id,
  name,
  email,
  avatar,
  avatar_color,
  password_hash,
  google_id,
  microsoft_id,
  watchlist[],
  friends[],
  recent_rooms[],
  viewing_history[],
  subscription_plan,
  subscription_status,
  subscription_start,
  subscription_end,
  payment_provider,
  premium_badge,
  created_at
}

ROOM:
{
  id,
  code,
  host_id,
  room_name,
  video_url,
  content_type,
  content_id,
  episode,
  current_time,
  is_playing,
  is_screen_sharing,
  screen_share_host,
  participants[],
  created_at,
  expires_at
}

MESSAGE:
{
  id,
  room_id,
  user_id,
  text,
  reaction,
  sent_at
}

WATCHLIST:
{
  id,
  user_id,
  content_type,
  content_id,
  status,
  added_at
}

SUBSCRIPTION:
{
  user_id,
  plan_name,
  amount,
  billing_cycle,
  payment_status,
  payment_provider,
  started_at,
  expires_at
}

==================================================
SOCKET EVENTS
==================================================

CLIENT EMITS:
- join_room
- leave_room
- play
- pause
- seek
- send_message
- send_reaction
- next_episode
- request_sync
- buffering_status
- start_screen_share
- stop_screen_share
- join_voice
- leave_voice
- mute_mic
- unmute_mic
- speaking_start
- speaking_stop

SERVER EMITS:
- user_joined
- user_left
- sync_state
- episode_changed
- new_message
- new_reaction
- buffering_update
- screen_share_started
- screen_share_stopped
- user_joined_voice
- user_left_voice
- voice_state_update
- participant_speaking

==================================================
API INTEGRATIONS
==================================================

TMDB:
https://api.themoviedb.org/3

Endpoints:
- /trending/movie/week
- /movie/popular
- /movie/top_rated
- /search/movie
- /movie/{id}/videos
- /genre/movie/list

JIKAN:
https://api.jikan.moe/v4

Endpoints:
- /top/anime
- /seasons/now
- /anime?q=
- /anime/{id}/episodes

==================================================
SAMPLE SEED CONTENT
==================================================

MOVIES:
- Interstellar
- Inception
- The Dark Knight
- Dune
- Oppenheimer
- Avengers Endgame
- John Wick 4
- Spider-Man Across the Spider-Verse

ANIME:
- Attack on Titan
- Demon Slayer
- Solo Leveling
- Jujutsu Kaisen
- Naruto Shippuden
- Death Note
- One Piece
- Your Name

==================================================
PROJECT STRUCTURE
==================================================

/client
  /src
    /components
    /pages
    /layouts
    /hooks
    /store
    /services
    /socket
    /context
    /styles

/server
  /controllers
  /routes
  /models
  /middleware
  /socket
  /services
  /utils
  /seed

/shared

==================================================
REQUIRED FILES
==================================================

Generate:
- README.md
- .env.example
- vercel.json
- railway.json
- docker-compose.yml
- deployment guide
- API docs
- seed scripts

==================================================
ENV VARIABLES
==================================================

PORT=
MONGO_URI=
JWT_SECRET=
CLIENT_URL=
TMDB_API_KEY=
TMDB_BASE_URL=
JIKAN_BASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
TURN_SERVER_URL=
TURN_SERVER_USERNAME=
TURN_SERVER_PASSWORD=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
STRIPE_SECRET_KEY=

==================================================
SECURITY
==================================================

Implement:
- Helmet.js
- rate limiting
- CORS protection
- JWT middleware
- socket authentication
- room permissions
- XSS sanitization
- API validation

==================================================
PERFORMANCE
==================================================

Optimize:
- lazy loading
- infinite scrolling
- image optimization
- code splitting
- websocket reconnect
- CDN-ready assets
- Lighthouse 90+

==================================================
FINAL REQUIREMENT
==================================================

Generate FULL production-ready codebase including:
- frontend
- backend
- responsive UI
- Socket.IO sync engine
- WebRTC screen sharing
- Discord-style voice chat
- MongoDB schemas
- authentication
- Google login
- Microsoft login
- REST APIs
- premium cinematic UI
- scalable architecture
- deployment configs
- reusable components
- modern streaming experience
- real-time synchronized playback
- HD screen sharing with audio
- mobile responsive layouts
- premium Netflix-style aesthetics
- subscription system
- payment integration
- ad-free premium plans

Also:
- create reusable UI components
- use clean scalable architecture
- write clean commented code
- create modern dashboard analytics
- include loading skeletons
- create beautiful empty states
- include toast notifications
- add smooth hover animations
- include dark/light mode support
- add accessibility support
- add SEO optimization
- add protected routes
- implement refresh token authentication
- create reusable modal system
- create reusable dropdown system
- create reusable video player controls
- implement optimistic UI updates
- include reconnect handling for sockets
- implement room inactivity timeout
- add real-time participant sync
- create premium cinematic gradients
- include custom scrollbar styling
- add animated page transitions
- create responsive sidebar navigation
- create responsive mobile bottom navigation
- add profile settings page
- add stream quality selector
- add voice activity indicators
- add participant floating avatars
- create immersive theater mode
- add fullscreen synchronization
- create floating glassmorphism player controls
- add animated background particles
- create modern search overlay
- add keyboard shortcuts
- support PWA installation
- include service workers
- optimize for desktop and mobile
- use best practices everywhere

IMPORTANT:
After a friend joins through invite link or invite code:
- automatically join synchronized room
- automatically connect voice chat
- automatically receive HD screen share
- automatically sync playback timestamp
- automatically show live participants
- automatically show chat history
- automatically connect to WebRTC peers
- automatically restore room state

The final application should be:
- modular
- scalable
- production-ready
- visually stunning
- fully responsive
- immersive
- ultra-modern
- optimized for performance
- optimized for real-time communication
- optimized for streaming experience

The app should feel like it was built by a top-tier startup company with Netflix-quality UI and Discord-quality real-time communication.

in short ,Build a premium full-stack “Watch Together” web app like Netflix + Discord where users can create rooms and watch movies, anime, YouTube videos, MP4/HLS streams, and HD screen shares together in real-time sync. Use React.js (Vite), Tailwind CSS, Framer Motion, Node.js, Express.js, MongoDB, Socket.IO, and WebRTC. Add JWT authentication with Google and Microsoft login, invite friends using links or short alphanumeric room codes, auto-sync playback, Discord-style voice chat with mic controls, HD 1080p screen sharing with system audio, live chat, emoji reactions, watchlists, trending movies from TMDB API, trending anime from Jikan API, responsive mobile support, and a cinematic dark glassmorphism UI with smooth animations. Add subscription plans: ₹200/month Standard and ₹700/month Premium, both fully ad-free, with Razorpay or Stripe payment integration, billing management, premium badges, advanced room controls, and scalable production-ready architecture deployable on Vercel and Railway.

==================================================
FIREBASE CONFIGURATION
==================================================

```js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDowgcmUM389jN5h6eSfD3_MHAQ_A8itO0",
  authDomain: "data-app-1ac47.firebaseapp.com",
  projectId: "data-app-1ac47",
  storageBucket: "data-app-1ac47.firebasestorage.app",
  messagingSenderId: "44698594305",
  appId: "1:44698594305:web:19eb941cd50daa94096400"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
```
