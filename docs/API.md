# Watch Together API Surface

Watch Together uses Firebase as the backend, so the API surface is Firestore collections, Firebase Auth, Storage, browser media APIs, and optional external catalog APIs.

## Firebase Auth

- Google sign-in through Firebase Auth.
- Email/password sign-in and signup are included.
- Auth state is persisted by Firebase and mirrored into `/users/{uid}`.

## Firestore Collections

### `/users/{uid}`

Stores profile, subscription, badge, recent room, watchlist summary, and session metadata.

### `/rooms/{roomId}`

Realtime room state:

- `code`
- `hostId`
- `roomName`
- `videoUrl`
- `contentType`
- `currentTime`
- `isPlaying`
- `isScreenSharing`
- `screenShareHost`
- `roomType`
- `participants`
- `quality`
- `theaterMode`
- `expiresAt`

Room codes are short uppercase alphanumeric values. Public rooms use `roomType: "public"` and appear in the Start Together public browser; private rooms are hidden and joined only through link or code.

### `/rooms/{roomId}/messages/{messageId}`

Live chat, timestamps, emoji reactions, and pinned-message support.

### `/rooms/{roomId}/signals/{signalId}`

WebRTC signaling documents:

- `offer`
- `answer`
- `candidate`

Signals are targeted with `from` and `to` user ids.

### `/watchlists/{uid_contentId}`

Watch later, favorites, watched history, and continue-watching progress.

### `/subscriptions/{uid}`

Demo subscription state for Standard and Premium. Replace the demo activation with Razorpay or Stripe checkout webhooks in production.

## External APIs

### TMDB

Set `VITE_TMDB_API_KEY` to enable:

- `/trending/movie/week`
- `/movie/popular`
- `/movie/top_rated`
- `/movie/upcoming`
- `/search/movie`

### Jikan

Used without a key:

- `/top/anime`
- `/seasons/now`
- `/anime?q=`

## Browser APIs

- `navigator.mediaDevices.getUserMedia` for voice chat.
- `navigator.mediaDevices.getDisplayMedia` for screen share with audio when supported by the browser.
- `RTCPeerConnection` for peer-to-peer voice and screen media.
- Service Worker and Web App Manifest for PWA installation.
