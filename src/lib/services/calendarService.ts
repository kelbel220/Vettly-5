'use client';

import { httpsCallable, getFunctions } from 'firebase/functions';
import { app } from '@/lib/firebase-init';

/**
 * Creates a virtual meeting for a match using Google Calendar
 * @param matchId The ID of the match to create a meeting for
 * @returns Promise that resolves with the meeting details
 */
export async function createVirtualMeeting(matchId: string) {
  try {
    // Initialize functions
    const functions = getFunctions(app);
    
    // Call the Cloud Function
    const createVirtualMeetingFunction = httpsCallable(functions, 'createVirtualMeeting');
    const result = await createVirtualMeetingFunction({ matchId });
    
    console.log('Virtual meeting created:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error creating virtual meeting:', error);
    throw error;
  }
}

/**
 * Retrieves calendar events for a user
 * @param userId The ID of the user to get events for
 * @returns Promise that resolves with the user's calendar events
 */
export async function getUserCalendarEvents(userId: string) {
  // This would be implemented to fetch from Firestore
  // const eventsRef = collection(db, `users/${userId}/calendarEvents`);
  // return getDocs(eventsRef).then(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  
  // Placeholder for now
  return Promise.resolve([]);
}
