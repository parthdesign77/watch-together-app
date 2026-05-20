# Deployment Guide

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Confirm `.env.local` contains the Firebase web config.

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173`.

## Firebase Setup

1. Enable Google sign-in in Firebase Authentication.
2. Enable Email/Password if you want email login.
3. Create Firestore in production mode.
4. Deploy rules:

   ```bash
   firebase deploy --only firestore:rules,storage
   ```

5. Add authorized domains for local and deployed URLs in Firebase Auth.

## Vercel

1. Import the repository.
2. Set environment variables from `.env.example`.
3. Use the included `vercel.json`.
4. Deploy.

## Railway

This is a static Vite app, so Railway serves the production build through `vite preview`.

1. Create a Railway service.
2. Add the same `VITE_` environment variables.
3. Railway will use `railway.json`.

## Docker

```bash
docker compose up --build
```

The app will be available at `http://localhost:8080`.

## Payments

The UI and Firestore subscription records are wired with a demo activation flow. For production:

- Create Razorpay or Stripe checkout sessions on a trusted server or Cloud Function.
- Verify webhook signatures.
- Update `/subscriptions/{uid}` and `/users/{uid}` only from the trusted backend.

## TURN Server

For reliable WebRTC across strict networks, set:

- `VITE_TURN_SERVER_URL`
- `VITE_TURN_SERVER_USERNAME`
- `VITE_TURN_SERVER_PASSWORD`
