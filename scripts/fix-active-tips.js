/**
 * Script to fix multiple active tips in the database
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
  Timestamp, 
  orderBy 
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
    // Get all active tips, ordered by creation date (newest first)
    const tipsQuery = query(
      collection(db, 'weeklyTips'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(tipsQuery);
    
    console.log(`Found ${snapshot.size} active tips.`);
    
    if (snapshot.size <= 1) {
      console.log('No fix needed. There is only one or zero active tips.');
      return;
    }
    
    // Keep track of the most recent tip (first one in the ordered results)
    let keepActiveCount = 0;
    let archivedCount = 0;
    
    // Process each tip
    const allTips = snapshot.docs;
    
    for (let i = 0; i < allTips.length; i++) {
      const tipDoc = allTips[i];
      const tipData = tipDoc.data();
      
      console.log(`Processing tip: ${tipDoc.id} - ${tipData.title}`);
      
      // Keep the first tip (most recent) as active
      if (i === 0) {
        console.log(`Keeping this tip as active: ${tipData.title}`);
        keepActiveCount++;
        continue;
      }
      
      // Archive all other tips
      try {
        console.log(`Archiving tip: ${tipData.title}`);
        
        await updateDoc(doc(db, 'weeklyTips', tipDoc.id), {
          status: 'archived',
          expiresAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        archivedCount++;
        console.log(`Successfully archived tip: ${tipDoc.id}`);
      } catch (error) {
        console.error(`Error archiving tip ${tipDoc.id}:`, error);
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
