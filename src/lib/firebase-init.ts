// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if the API key is available
if (!firebaseConfig.apiKey) {
  console.warn('Firebase API key is missing. Please check your environment variables.');
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;
let storage: FirebaseStorage | null = null;

// Initialize Firebase - handle both client and server contexts
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    
    // These services are client-side only
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Only test storage connection after user is authenticated
    if (typeof window !== 'undefined') {
      onAuthStateChanged(auth, (user) => {
        if (user && storage) {  
          // Test storage connection in user's own directory
          const testRef = ref(storage, `users/${user.uid}/.connection_test`);
          getDownloadURL(testRef).catch(error => {
            // 404 error is expected and means we can connect
            if (error.code === 'storage/object-not-found') {
              console.log('Firebase Storage connection successful');
            } else {
              console.error('Firebase Storage connection error:', error);
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
} else {
  app = getApps()[0];
  auth = getAuth();
  db = getFirestore();
  storage = getStorage();
}

export { app, auth, db, analytics, storage };
