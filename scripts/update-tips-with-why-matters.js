/**
 * Script to update existing tips in the database to include the whyMatters field
 * This will ensure that all tips, including the currently active one, have the necessary field populated
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc 
} = require('firebase/firestore');

// Initialize Firebase (using the same config from your app)
const fs = require('fs');
const path = require('path');

// Try to load Firebase config from .env.local file
let firebaseConfig = {};
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      const match = line.match(/^NEXT_PUBLIC_FIREBASE_([A-Z_]+)=(.+)$/);
      if (match) {
        const key = match[1].toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        firebaseConfig[key] = match[2].trim();
      }
    });
  } else {
    console.log('No .env.local file found. Using empty Firebase config.');
  }
} catch (error) {
  console.error('Error loading Firebase config:', error);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default "Why This Matters" content for different tip categories
const defaultWhyMattersContent = {
  'conversation_starters': 'Effective conversation starters help break the ice and establish a genuine connection. They show your interest in getting to know the other person and can reveal compatibility through shared interests or values.',
  'date_ideas': 'Creative date ideas can make your time together more memorable and enjoyable. They provide opportunities for authentic interaction and help you both relax and be yourselves.',
  'relationship_advice': 'Understanding relationship dynamics helps build stronger connections. This insight allows you to navigate challenges more effectively and create a foundation of mutual respect and understanding.',
  'matchmaking_insights': 'Knowing what makes a good match helps you recognize compatibility factors that matter. This awareness guides better choices and increases your chances of finding a meaningful connection.',
  'self_improvement': 'Personal growth enhances your dating experience by building confidence and self-awareness. When you feel good about yourself, you bring your best self to relationships and attract partners who value you.'
};

async function updateTipsWithWhyMatters() {
  console.log('Updating tips with missing whyMatters field...');
  
  try {
    // Get all tips
    const tipsQuery = query(
      collection(db, 'weeklyTips')
    );
    
    const snapshot = await getDocs(tipsQuery);
    
    console.log(`Found ${snapshot.size} tips in total.`);
    
    let updatedCount = 0;
    let alreadyHasFieldCount = 0;
    
    // Process each tip
    for (const tipDoc of snapshot.docs) {
      const tipData = tipDoc.data();
      const tipId = tipDoc.id;
      
      // Skip tips that already have whyMatters field with content
      if (tipData.whyMatters && tipData.whyMatters.trim().length > 0) {
        console.log(`Tip "${tipData.title}" already has whyMatters field.`);
        alreadyHasFieldCount++;
        continue;
      }
      
      // Generate appropriate whyMatters content based on category
      let whyMattersContent = '';
      
      if (tipData.category && defaultWhyMattersContent[tipData.category]) {
        whyMattersContent = defaultWhyMattersContent[tipData.category];
      } else {
        // Default fallback content
        whyMattersContent = 'This tip provides valuable guidance to enhance your dating experience. Applying these insights can lead to more meaningful connections and better outcomes in your relationships.';
      }
      
      // Update the tip with the whyMatters field
      try {
        await updateDoc(doc(db, 'weeklyTips', tipId), {
          whyMatters: whyMattersContent
        });
        
        console.log(`Updated tip "${tipData.title}" with whyMatters content.`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating tip ${tipId}:`, error);
      }
    }
    
    console.log('\nUpdate completed:');
    console.log(`- ${updatedCount} tip(s) updated with whyMatters content`);
    console.log(`- ${alreadyHasFieldCount} tip(s) already had whyMatters content`);
    console.log(`- ${snapshot.size - updatedCount - alreadyHasFieldCount} tip(s) failed to update`);
    
  } catch (error) {
    console.error('Error updating tips:', error);
  }
}

// Run the update
updateTipsWithWhyMatters();
