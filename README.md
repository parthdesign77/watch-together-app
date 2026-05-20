# Watch Together

A premium realtime synchronized streaming app with Firebase Auth, Firestore rooms, live chat, WebRTC voice/screen share, watchlists, subscriptions, TMDB/Jikan catalog browsing, and a cinematic responsive UI.

## Highlights

- Google sign-in through Firebase Auth.
- Email/password auth fallback.
- Realtime Firestore watch rooms with short alphanumeric invite codes.
- Start Together modal with Create Room and Join Room flows.
- Public room discovery and private invite-only rooms.
- Short alphanumeric room codes and auto-join invite links.
- Auto room join through invite links.
- Synchronized play, pause, seek, drift correction, and host authority.
- Live chat with emoji reactions.
- WebRTC voice chat with mute and speaking indicators.
- Camera grid/spotlight mode when no screen share is active.
- Bottom-left camera Picture-in-Picture overlay while screen sharing.
- Screen share entry choices for entire screen or app/window-only capture.
- Ambient background sound controls with independent volume.
- HD screen share with system audio where the browser supports it.
- TMDB-ready movie rows and Jikan anime rows.
- Watchlists and continue-watching progress model.
- Standard and Premium ad-free subscription UI.
- Vercel, Railway, Firebase Hosting, and Docker deployment files.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Firebase

The Firebase web config has been added to `.env.local`. Google sign-in must be enabled in Firebase Auth, and the deployment domain must be added to authorized domains.

Deploy rules with:

```bash
firebase deploy --only firestore:rules,storage
```

## Useful Commands

```bash
npm run typecheck
npm run build
npm run seed
```

## Environment

See `.env.example` for every supported variable, including Firebase, TMDB, Jikan, TURN, and payment placeholders.

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Surface](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
