/**
 * Simpler script to fix multiple active tips in the database
 * This script will:
 * 1. Find all active tips
 * 2. Keep only the most recent one as active
 * 3. Archive all other previously active tips
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  Timestamp 
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

async function fixActiveTips() {
  console.log('Fixing multiple active tips issue...');
  
  try {
    // Get all active tips
    const tipsQuery = query(
      collection(db, 'weeklyTips'),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(tipsQuery);
    
    console.log(`Found ${snapshot.size} active tips.`);
    
    if (snapshot.size <= 1) {
      console.log('No fix needed. There is only one or zero active tips.');
      return;
    }
    
    // Collect all active tips
    const activeTips = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Convert Firestore timestamp to JS Date for comparison
      let createdAt = null;
      if (data.createdAt) {
        if (data.createdAt.toDate) {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = new Date(data.createdAt);
        }
      } else {
        createdAt = new Date(0); // Default to epoch if no date
      }
      
      activeTips.push({
        id: doc.id,
        title: data.title,
        createdAt: createdAt,
        data: data
      });
    });
    
    // Sort tips by creation date (newest first)
    activeTips.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log('\nActive tips (sorted by date, newest first):');
    activeTips.forEach((tip, index) => {
      console.log(`${index + 1}. ${tip.title} (${tip.createdAt.toISOString()})`);
    });
    
    // Keep the most recent tip active, archive the rest
    let keepActiveCount = 0;
    let archivedCount = 0;
    
    for (let i = 0; i < activeTips.length; i++) {
      const tip = activeTips[i];
      
      if (i === 0) {
        // Keep the most recent tip active
        console.log(`\nKeeping most recent tip as active: "${tip.title}"`);
        keepActiveCount++;
      } else {
        // Archive older tips
        try {
          console.log(`Archiving tip: "${tip.title}"`);
          
          await updateDoc(doc(db, 'weeklyTips', tip.id), {
            status: 'archived',
            expiresAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          
          archivedCount++;
          console.log(`Successfully archived tip: ${tip.id}`);
        } catch (error) {
          console.error(`Error archiving tip ${tip.id}:`, error);
        }
      }
    }
    
    console.log('\nFix completed:');
    console.log(`- Kept ${keepActiveCount} tip(s) as active`);
    console.log(`- Archived ${archivedCount} tip(s)`);
    console.log('\nThe dashboard should now show the most recent tip.');
    
  } catch (error) {
    console.error('Error fixing active tips:', error);
  }
}

// Run the fix
fixActiveTips();
