# Architecture

Watch Together is a Firebase-backed realtime React app.

## Frontend

- React + Vite + TypeScript.
- Tailwind CSS cinematic design system.
- React Router protected routes.
- TanStack Query for TMDB/Jikan catalog data.
- Zustand for UI state and toasts.
- Framer Motion page and modal transitions.
- HLS.js for HLS stream playback.

## Backend

Firebase replaces the Express/Mongo layer for this build:

- Firebase Auth handles identity and Google login.
- Firestore stores users, rooms, messages, signals, watchlists, and subscriptions.
- Firestore realtime listeners replace Socket.IO for room sync and chat.
- WebRTC peer connections use Firestore subcollections for signaling.

## Realtime Room Flow

1. Host creates a room.
2. Host chooses Public or Private in the Start Together modal.
3. Firestore generates a room document with a short alphanumeric code.
4. Friends join by URL, code, or the public room browser.
5. Participant state is added to the room.
6. Playback state updates in Firestore.
7. Non-host clients correct drift against the room timestamp.
8. Chat and reactions stream from `/messages`.
9. Voice, camera, and screen media connect through WebRTC signals in `/signals`.
10. Camera layout automatically switches between fullscreen grid/spotlight and screen-share PiP.

## Production Notes

- Browser system-audio capture support depends on browser and operating system.
- Autoplay and microphone prompts are browser-controlled; the UI retries with explicit controls.
- Use a TURN server for best WebRTC reliability.
- Use Cloud Functions for production billing webhooks and privileged subscription writes.
