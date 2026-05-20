import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import fs from "node:fs";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

loadEnv(".env.local");

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedCollections = [
  {
    id: "movies",
    items: ["Interstellar", "Inception", "The Dark Knight", "Dune", "Oppenheimer", "Spider-Man: Across the Spider-Verse"]
  },
  {
    id: "anime",
    items: ["Attack on Titan", "Demon Slayer", "Solo Leveling", "Jujutsu Kaisen", "Death Note", "Your Name"]
  }
];

for (const collectionSeed of seedCollections) {
  await setDoc(
    doc(db, "seedCatalog", collectionSeed.id),
    {
      type: collectionSeed.id,
      items: collectionSeed.items,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

console.log("Seed content written to Firestore seedCatalog.");
