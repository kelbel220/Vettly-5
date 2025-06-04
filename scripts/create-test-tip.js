// Script to create a test weekly tip in Firestore
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account.json');

// Check if service account file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account file not found. Please create a service-account.json file in the root directory.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

// Create a test weekly tip
async function createTestTip() {
  try {
    const now = new Date();
    
    const testTip = {
      title: "Perfect Your Profile",
      content: "Adding high-quality photos and completing all sections of your profile significantly increases your chances of making meaningful connections. Take time to showcase your personality and interests.",
      shortDescription: "Profiles with detailed information and clear photos receive 40% more matches!",
      category: "profile_improvement",
      status: "active", // Set to active so it shows up immediately
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      aiGenerated: false,
      quickTips: [
        "Use recent photos that clearly show your face",
        "Include at least one full-body photo",
        "Add photos of you doing activities you enjoy",
        "Be specific about your interests rather than generic statements",
        "Have a friend review your profile for feedback"
      ],
      didYouKnow: "Users who complete all profile sections are 70% more likely to receive messages and match requests compared to those with minimal information.",
      weeklyChallenge: "Review your profile and add at least three new details about yourself that you haven't shared before. This gives potential matches more conversation starters!",
      viewCount: 0,
      uniqueViewCount: 0
    };

    const docRef = await db.collection('weeklyTips').add(testTip);
    console.log(`Test tip created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating test tip:', error);
    throw error;
  }
}

// Run the function
createTestTip()
  .then(() => {
    console.log('Test tip creation completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create test tip:', error);
    process.exit(1);
  });
