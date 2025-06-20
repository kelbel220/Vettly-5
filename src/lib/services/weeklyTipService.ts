/**
 * Weekly Tip Service
 * Handles all database operations for the weekly tips feature
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp,
  DocumentReference,
  DocumentData,
  QuerySnapshot,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase-init';
import { 
  WeeklyTip, 
  WeeklyTipStatus, 
  WeeklyTipCategory,
  UserTipView, 
  createWeeklyTip,
  formatTipForDisplay
} from '../models/weeklyTip';
import { generateWeeklyTip, ArticleSource } from './openaiTipGenerator';

// Collection names
const TIPS_COLLECTION = 'weeklyTips';
const USER_VIEWS_COLLECTION = 'userTipViews';

/**
 * Creates a new weekly tip in Firestore
 */
export async function createTip(tipData: Partial<WeeklyTip>): Promise<WeeklyTip> {
  const newTip = createWeeklyTip(tipData);
  
  // Convert Date objects to Firestore Timestamps
  const firestoreTip = {
    ...newTip,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  // Add to Firestore
  const docRef = await addDoc(collection(db, TIPS_COLLECTION), firestoreTip);
  
  // Return the created tip with its ID
  return {
    ...newTip,
    id: docRef.id
  };
}

/**
 * Generates a new weekly tip using OpenAI and saves it to Firestore
 * @param category Optional category for the tip
 * @param articleSource Optional article to use as source material
 */
export async function generateAndCreateTip(
  category?: WeeklyTipCategory,
  articleSource?: ArticleSource
): Promise<WeeklyTip> {
  // Generate the tip using OpenAI
  const generatedTip = await generateWeeklyTip(category, articleSource);
  
  // Save the generated tip to Firestore
  return createTip(generatedTip);
}

/**
 * Updates an existing weekly tip
 */
export async function updateTip(tipId: string, updates: Partial<WeeklyTip>): Promise<WeeklyTip> {
  const tipRef = doc(db, TIPS_COLLECTION, tipId);
  
  // Add updated timestamp
  const updatedData = {
    ...updates,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(tipRef, updatedData);
  
  // Get the updated document
  const updatedDoc = await getDoc(tipRef);
  const updatedTip = { id: tipId, ...updatedDoc.data() } as WeeklyTip;
  
  return formatTipForDisplay(updatedTip);
}

/**
 * Gets a weekly tip by ID
 */
export async function getTipById(tipId: string): Promise<WeeklyTip | null> {
  const tipRef = doc(db, TIPS_COLLECTION, tipId);
  const tipDoc = await getDoc(tipRef);
  
  if (!tipDoc.exists()) {
    return null;
  }
  
  const tipData = { id: tipId, ...tipDoc.data() } as WeeklyTip;
  return formatTipForDisplay(tipData);
}

/**
 * Gets all weekly tips with optional filtering
 */
export async function getAllTips(
  status?: WeeklyTipStatus,
  maxResults?: number
): Promise<WeeklyTip[]> {
  let tipsQuery = collection(db, TIPS_COLLECTION);
  let constraints = [];
  
  // Add status filter if provided
  if (status) {
    constraints.push(where('status', '==', status));
  }
  
  // Always order by creation date, newest first
  constraints.push(orderBy('createdAt', 'desc'));
  
  // Add limit if provided
  if (maxResults) {
    constraints.push(limit(maxResults));
  }
  
  const q = query(tipsQuery, ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = { id: doc.id, ...doc.data() } as WeeklyTip;
    return formatTipForDisplay(data);
  });
}

/**
 * Gets the current active weekly tip
 */
export async function getActiveTip(): Promise<WeeklyTip | null> {
  const q = query(
    collection(db, TIPS_COLLECTION),
    where('status', '==', WeeklyTipStatus.ACTIVE),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  const tipData = { id: doc.id, ...doc.data() } as WeeklyTip;
  
  return formatTipForDisplay(tipData);
}

/**
 * Approves a pending tip
 */
export async function approveTip(tipId: string, matchmakerId: string, matchmakerName: string): Promise<WeeklyTip> {
  return updateTip(tipId, {
    status: WeeklyTipStatus.APPROVED,
    authorId: matchmakerId,
    authorName: matchmakerName
  });
}

/**
 * Rejects a pending tip
 */
export async function rejectTip(tipId: string, matchmakerId: string, matchmakerName: string): Promise<WeeklyTip> {
  return updateTip(tipId, {
    status: WeeklyTipStatus.REJECTED,
    authorId: matchmakerId,
    authorName: matchmakerName
  });
}

/**
 * Activates an approved tip
 */
export async function activateTip(tipId: string): Promise<WeeklyTip> {
  console.log(`Activating tip with ID: ${tipId}`);
  
  // First, deactivate any currently active tips
  const activeTip = await getActiveTip();
  
  if (activeTip) {
    console.log(`Deactivating currently active tip with ID: ${activeTip.id}`);
    try {
      // Use direct Firestore update to ensure changes are applied
      const tipRef = doc(db, TIPS_COLLECTION, activeTip.id!);
      await updateDoc(tipRef, {
        status: WeeklyTipStatus.ARCHIVED,
        expiresAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`Successfully archived previous active tip: ${activeTip.id}`);
    } catch (error) {
      console.error(`Error archiving previous active tip: ${activeTip.id}`, error);
      throw new Error(`Failed to archive previous active tip: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Then activate the new tip
  try {
    console.log(`Setting tip ${tipId} as active`);
    // Use direct Firestore update to ensure changes are applied
    const tipRef = doc(db, TIPS_COLLECTION, tipId);
    await updateDoc(tipRef, {
      status: WeeklyTipStatus.ACTIVE,
      publishedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Get the updated tip to return
    const updatedTip = await getTipById(tipId);
    if (!updatedTip) {
      throw new Error(`Failed to retrieve updated tip after activation`);
    }
    
    console.log(`Successfully activated tip: ${tipId}`);
    return updatedTip;
  } catch (error) {
    console.error(`Error activating tip: ${tipId}`, error);
    throw new Error(`Failed to activate tip: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Archives an active tip
 */
export async function archiveTip(tipId: string): Promise<WeeklyTip> {
  return updateTip(tipId, {
    status: WeeklyTipStatus.ARCHIVED,
    expiresAt: new Date()
  });
}

/**
 * Deletes a tip
 */
export async function deleteTip(tipId: string): Promise<void> {
  const tipRef = doc(db, TIPS_COLLECTION, tipId);
  await deleteDoc(tipRef);
}

/**
 * Records that a user has viewed a tip
 */
export async function recordTipView(userId: string, tipId: string, fullRead: boolean = false): Promise<void> {
  // Check if the user has already viewed this tip
  const q = query(
    collection(db, USER_VIEWS_COLLECTION),
    where('userId', '==', userId),
    where('tipId', '==', tipId)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    // First time viewing this tip
    await addDoc(collection(db, USER_VIEWS_COLLECTION), {
      userId,
      tipId,
      viewedAt: serverTimestamp(),
      readStatus: fullRead,
      dismissed: false
    });
    
    // Increment the tip's view counts
    const tipRef = doc(db, TIPS_COLLECTION, tipId);
    await updateDoc(tipRef, {
      viewCount: increment(1),
      uniqueViewCount: increment(1)
    });
  } else {
    // User has viewed this tip before
    const viewDoc = querySnapshot.docs[0];
    
    // Only update if they're now fully reading it and hadn't before
    if (fullRead && !viewDoc.data().readStatus) {
      await updateDoc(doc(db, USER_VIEWS_COLLECTION, viewDoc.id), {
        readStatus: true,
        viewedAt: serverTimestamp()
      });
    }
    
    // Always increment the view count
    const tipRef = doc(db, TIPS_COLLECTION, tipId);
    await updateDoc(tipRef, {
      viewCount: increment(1)
    });
  }
}

/**
 * Marks a tip as dismissed by a user
 */
export async function dismissTip(userId: string, tipId: string): Promise<void> {
  // Check if the user has already viewed this tip
  const q = query(
    collection(db, USER_VIEWS_COLLECTION),
    where('userId', '==', userId),
    where('tipId', '==', tipId)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    // First time interacting with this tip, create a new record
    await addDoc(collection(db, USER_VIEWS_COLLECTION), {
      userId,
      tipId,
      viewedAt: serverTimestamp(),
      readStatus: true,
      dismissed: true
    });
  } else {
    // Update existing record
    const viewDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, USER_VIEWS_COLLECTION, viewDoc.id), {
      dismissed: true,
      viewedAt: serverTimestamp()
    });
  }
}

/**
 * Checks if a user has viewed a specific tip
 */
export async function hasUserViewedTip(userId: string, tipId: string): Promise<boolean> {
  const q = query(
    collection(db, USER_VIEWS_COLLECTION),
    where('userId', '==', userId),
    where('tipId', '==', tipId)
  );
  
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

/**
 * Gets all tips a user has viewed
 */
export async function getUserViewedTips(userId: string): Promise<UserTipView[]> {
  const q = query(
    collection(db, USER_VIEWS_COLLECTION),
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    return { id: doc.id, ...doc.data() } as UserTipView;
  });
}

/**
 * Helper function for incrementing counters
 */
function increment(amount: number) {
  return {
    __type: 'increment',
    amount: amount
  };
}

// Note: We're using the Firebase increment() function directly
// No need to add custom settings to the Firestore instance
