// Script to regenerate match explanations
const fetch = require('node-fetch');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function regenerateExplanation(matchId) {
  try {
    console.log(`Fetching match data for match ID: ${matchId}`);
    
    // Get match data from Firebase
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      console.error('Match not found in Firebase');
      return;
    }
    
    const matchData = matchDoc.data();
    console.log('Match data:', matchData);
    
    // Get member IDs from the match data
    const member1Id = matchData.member1Id;
    const member2Id = matchData.member2Id;
    
    if (!member1Id || !member2Id) {
      console.error('Missing member IDs in match data');
      console.log('Available fields:', Object.keys(matchData));
      return;
    }
    
    console.log(`Member IDs: member1Id=${member1Id}, member2Id=${member2Id}`);
    
    // Call the API to regenerate the explanation
    console.log('Calling API to regenerate explanation...');
    const response = await fetch('http://localhost:3001/api/matches/generate-explanation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matchId,
        member1Id,
        member2Id
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} ${response.statusText}`);
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Explanation regenerated successfully!');
    console.log('member1Points:', data.member1Points);
    console.log('member2Points:', data.member2Points);
    
  } catch (error) {
    console.error('Error regenerating explanation:', error);
  }
}

// Get match ID from command line arguments
const matchId = process.argv[2];

if (!matchId) {
  console.error('Please provide a match ID as a command line argument');
  console.log('Usage: node regenerate-explanation.js <matchId>');
  process.exit(1);
}

// Run the script
regenerateExplanation(matchId)
  .then(() => console.log('Done'))
  .catch(error => console.error('Script error:', error));
