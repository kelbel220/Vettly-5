/**
 * Script to check for multiple active tips in the database
 * This version doesn't rely on importing the WeeklyTipStatus enum
 */

// Import Firebase modules
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Initialize Firebase (using the same config from your app)
// We'll need to load the Firebase config from a local file
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

async function checkTipsStatus() {
  console.log('Checking tip statuses in the database...');
  
  try {
    // Get all tips
    const tipsRef = collection(db, 'weeklyTips');
    const snapshot = await getDocs(tipsRef);
    
    console.log(`Found ${snapshot.size} total tips in the database.`);
    
    // Count tips by status
    const statusCounts = {};
    const activeTips = [];
    
    snapshot.forEach(doc => {
      const tipData = doc.data();
      const status = tipData.status || 'unknown';
      
      // Count by status
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Collect active tips
      if (status === 'active') {
        activeTips.push({
          id: doc.id,
          title: tipData.title,
          createdAt: tipData.createdAt?.toDate?.() || 'Unknown date',
          publishedAt: tipData.publishedAt?.toDate?.() || 'Unknown date'
        });
      }
    });
    
    // Print status counts
    console.log('\nTip counts by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count}`);
    });
    
    // Print active tips
    console.log('\nActive tips:');
    if (activeTips.length === 0) {
      console.log('No active tips found.');
    } else {
      activeTips.forEach(tip => {
        console.log(`- ID: ${tip.id}`);
        console.log(`  Title: ${tip.title}`);
        console.log(`  Created: ${tip.createdAt}`);
        console.log(`  Published: ${tip.publishedAt}`);
        console.log('-----------------------------------');
      });
      
      if (activeTips.length > 1) {
        console.log('\nWARNING: Multiple active tips found. Only one tip should be active at a time.');
        console.log('To fix this issue, you can use the admin interface to archive older tips or update their status.');
      }
    }
    
  } catch (error) {
    console.error('Error checking tips:', error);
  }
}

// Run the check
checkTipsStatus();
