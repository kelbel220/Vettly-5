// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcN1r5zwzX2lDX9PajoHcdLK6Nl9vgtUg",
  authDomain: "vettlymatch.firebaseapp.com",
  projectId: "vettlymatch",
  storageBucket: "vettlymatch.firebasestorage.app",
  messagingSenderId: "946180653225",
  appId: "1:946180653225:web:bd33e5f7fe3dac1fdea9b8",
  measurementId: "G-F1T1EJBBCL"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      analytics = getAnalytics(app);
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  } else {
    app = getApps()[0];
    analytics = getAnalytics(app);
  }

  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Set default values for SSR
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db, analytics };
