/**
 * Script to check for multiple active tips in the database
 */

// Import Firebase modules
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Import the WeeklyTipStatus enum
const { WeeklyTipStatus } = require('../lib/models/weeklyTip');

// Initialize Firebase (using the same config from your app)
const firebaseConfig = {
  // The config will be loaded from your environment variables
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkActiveTips() {
  console.log('Checking for active tips in the database...');
  
  try {
    // Query for tips with ACTIVE status
    const tipsQuery = query(
      collection(db, 'weeklyTips'),
      where('status', '==', 'active') // Using string value directly instead of enum
    );
    
    const snapshot = await getDocs(tipsQuery);
    
    console.log(`Found ${snapshot.size} active tips:`);
    
    // Log details of each active tip
    snapshot.forEach(doc => {
      const tipData = doc.data();
      console.log(`- ID: ${doc.id}`);
      console.log(`  Title: ${tipData.title}`);
      console.log(`  Created: ${tipData.createdAt?.toDate?.() || 'Unknown date'}`);
      console.log(`  Published: ${tipData.publishedAt?.toDate?.() || 'Unknown date'}`);
      console.log('-----------------------------------');
    });
    
    if (snapshot.size > 1) {
      console.log('WARNING: Multiple active tips found. Only one tip should be active at a time.');
      console.log('To fix this issue, you can use the admin interface to archive older tips or update their status.');
    } else if (snapshot.size === 0) {
      console.log('No active tips found. You should activate a tip to display in the dashboard.');
    } else {
      console.log('Database status is correct: Only one active tip found.');
    }
    
  } catch (error) {
    console.error('Error checking active tips:', error);
  }
}

// Run the check
checkActiveTips();
