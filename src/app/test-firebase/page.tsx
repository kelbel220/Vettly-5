'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// This is a test page to debug Firebase permissions
export default function TestFirebase() {
  const [output, setOutput] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collections, setCollections] = useState<string[]>([]);

  const addOutput = (message: string) => {
    setOutput(prev => [...prev, message]);
    console.log(message);
  };

  const testFirebaseConnection = async () => {
    try {
      // Get Firebase config from environment variables
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };

      addOutput('Firebase config: ' + JSON.stringify(firebaseConfig));
      
      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      
      addOutput('Firebase initialized successfully');
      
      // List all collections
      const collectionsToTest = [
        'users',
        'matches',
        'vettly2Notifications',
        'notifications',
        'calendar_events',
        'calendar'
      ];
      
      setCollections(collectionsToTest);
      
      // Test if the user is authenticated
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (user) {
        addOutput(`Currently logged in as: ${user.email} (${user.uid})`);
      } else {
        addOutput('No user is currently logged in');
      }
    } catch (error) {
      addOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testCollection = async (collectionName: string) => {
    try {
      const db = getFirestore();
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      addOutput(`Collection ${collectionName}: Found ${snapshot.size} documents`);
      
      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0];
        addOutput(`Sample document ID: ${firstDoc.id}`);
        addOutput(`Sample data: ${JSON.stringify(firstDoc.data())}`);
      }
    } catch (error) {
      addOutput(`Error accessing ${collectionName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleLogin = async () => {
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      addOutput(`Successfully logged in as ${email}`);
      
      // Get user details
      const user = auth.currentUser;
      if (user) {
        addOutput(`User ID: ${user.uid}`);
        
        // Try to get user document
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          addOutput(`User document found: ${JSON.stringify(userDoc.data())}`);
        } else {
          addOutput(`No user document found for ID: ${user.uid}`);
        }
      }
    } catch (error) {
      addOutput(`Login error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Permissions Test</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Login</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border p-2 rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="border p-2 rounded"
          />
          <button 
            onClick={handleLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Login
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Collections</h2>
        <div className="flex flex-wrap gap-2">
          {collections.map(collectionName => (
            <button
              key={collectionName}
              onClick={() => testCollection(collectionName)}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Test {collectionName}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Output</h2>
        <pre className="bg-black text-green-400 p-4 rounded overflow-auto max-h-96">
          {output.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </pre>
      </div>
    </div>
  );
}
