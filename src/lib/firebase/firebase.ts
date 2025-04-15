import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: "vettlymatch.firebaseapp.com",
  projectId: "vettlymatch",
  storageBucket: "vettlymatch.firebasestorage.app",
  messagingSenderId: "946180653225",
  appId: "1:946180653225:web:bd33e5f7fe3dac1fdea9b8",
  measurementId: "G-F1T1EJBBCL"
};

// Check if the API key is available
if (!firebaseConfig.apiKey) {
  console.warn('Firebase API key is missing. Please check your environment variables.');
}

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Only initialize analytics on the client side
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, db, storage, analytics };
