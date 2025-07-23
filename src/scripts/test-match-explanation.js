// Script to test updating a match with the new explanation format
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample match explanation points
const sampleMember1Explanation = [
  {
    header: "Values Alignment",
    explanation: "You both prioritize honesty and loyalty, creating a foundation of trust."
  },
  {
    header: "Communication Styles",
    explanation: "Your direct communication approach complements her thoughtful listening style."
  },
  {
    header: "Shared Interests",
    explanation: "Your mutual love for outdoor activities provides opportunities for quality time together."
  },
  {
    header: "Life Goals",
    explanation: "Your ambitions align well with her supportive nature, creating a balanced partnership."
  },
  {
    header: "Complementary Traits",
    explanation: "Your outgoing personality balances nicely with her more reflective approach to social situations."
  }
];

const sampleMember2Explanation = [
  {
    header: "Emotional Connection",
    explanation: "His attentiveness matches your need for emotional support and understanding."
  },
  {
    header: "Lifestyle Compatibility",
    explanation: "Your organized approach complements his spontaneity, creating a balanced daily life."
  },
  {
    header: "Growth Potential",
    explanation: "His ambition aligns with your supportive nature, allowing both of you to grow together."
  },
  {
    header: "Shared Values",
    explanation: "You both prioritize family and long-term commitment, creating a strong foundation."
  },
  {
    header: "Intellectual Stimulation",
    explanation: "His different perspectives challenge your thinking in ways you find engaging and refreshing."
  }
];

async function updateMatchExplanation(matchId) {
  try {
    // First, check if the match exists
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      console.log(`Match with ID ${matchId} not found`);
      return;
    }
    
    console.log(`Updating match ${matchId} with new explanation format...`);
    
    // Update the match with the new explanation format
    await updateDoc(matchRef, {
      // Remove the old explanation
      compatibilityExplanation: null,
      // Add gender-specific explanations as JSON strings
      member1Explanation: JSON.stringify(sampleMember1Explanation),
      member2Explanation: JSON.stringify(sampleMember2Explanation),
      explanationGeneratedAt: new Date().toISOString()
    });
    
    console.log(`Successfully updated match ${matchId} with new explanation format`);
  } catch (error) {
    console.error('Error updating match:', error);
  }
}

// Replace 'your-match-id' with an actual match ID from your Firebase database
const matchId = process.argv[2] || 'your-match-id';
updateMatchExplanation(matchId);
