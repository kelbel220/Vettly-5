'use client';

import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';

// Collection name for matchmaker notifications
const MATCHMAKER_NOTIFICATIONS_COLLECTION = 'matchmakerNotifications';

/**
 * Interface for matchmaker notification data
 */
interface MatchmakerNotificationData {
  matchId: string;
  memberId: string;
  matchmakerId: string;
  type: 'match_declined' | 'match_accepted' | 'match_viewed';
  status: 'pending' | 'read';
  createdAt: any; // Firebase Timestamp
  message?: string;
  additionalData?: any;
}

/**
 * Send a notification to the matchmaker when a match is declined
 * @param matchId The ID of the declined match
 * @param memberId The ID of the member who declined the match
 * @param matchmakerId The ID of the matchmaker who created the match
 * @param memberName Optional name of the member who declined the match
 * @param reason Optional reason for declining the match
 * @returns Promise that resolves when the notification is sent
 */
export async function notifyMatchmakerOfDeclinedMatch(
  matchId: string,
  memberId: string,
  matchmakerId: string,
  memberName?: string,
  reason?: string
): Promise<void> {
  try {
    if (!matchmakerId) {
      console.error('Cannot notify matchmaker: No matchmaker ID provided');
      return;
    }

    const notificationData: MatchmakerNotificationData = {
      matchId,
      memberId,
      matchmakerId,
      type: 'match_declined',
      status: 'pending',
      createdAt: serverTimestamp(),
      message: `Match declined by ${memberName || 'a member'}${reason ? `: ${reason}` : ''}`,
      additionalData: {
        declinedAt: new Date().toISOString(),
        reason: reason || 'No reason provided'
      }
    };

    console.log('Creating matchmaker notification with data:', JSON.stringify(notificationData, null, 2));
    console.log('Using collection:', MATCHMAKER_NOTIFICATIONS_COLLECTION);
    
    // Add notification to the matchmaker notifications collection
    try {
      const docRef = await addDoc(collection(db, MATCHMAKER_NOTIFICATIONS_COLLECTION), notificationData);
      console.log(`Successfully created notification document with ID: ${docRef.id}`);
      
      // Also update the match document with a flag indicating a notification was sent
      // This helps the CRM know there's a new notification to display
      try {
        const matchRef = doc(db, 'matches', matchId);
        console.log(`Updating match document ${matchId} with notification flags`);
        
        await updateDoc(matchRef, {
          hasMatchmakerNotification: true,
          lastNotificationType: 'match_declined',
          lastNotificationTime: serverTimestamp()
        });
        
        console.log(`Successfully updated match ${matchId} with notification flags`);
      } catch (matchUpdateError) {
        console.error('Error updating match with notification flag:', matchUpdateError);
      }
      
      console.log(`Notification sent to matchmaker ${matchmakerId} for declined match ${matchId} with ID: ${docRef.id}`);
    } catch (addDocError) {
      console.error('Error creating notification document:', addDocError);
    }
  } catch (error) {
    console.error('Error sending matchmaker notification:', error);
    // Don't throw the error to prevent disrupting the main flow
  }
}

/**
 * Send a notification to the matchmaker when a match is accepted
 * @param matchId The ID of the accepted match
 * @param memberId The ID of the member who accepted the match
 * @param matchmakerId The ID of the matchmaker who created the match
 * @param memberName Optional name of the member who accepted the match
 * @returns Promise that resolves when the notification is sent
 */
export async function notifyMatchmakerOfAcceptedMatch(
  matchId: string,
  memberId: string,
  matchmakerId: string,
  memberName?: string
): Promise<void> {
  try {
    if (!matchmakerId) {
      console.error('Cannot notify matchmaker: No matchmaker ID provided');
      return;
    }

    const notificationData: MatchmakerNotificationData = {
      matchId,
      memberId,
      matchmakerId,
      type: 'match_accepted',
      status: 'pending',
      createdAt: serverTimestamp(),
      message: `Match accepted by ${memberName || 'a member'}. Both members have accepted the match and payment is now required.`,
      additionalData: {
        acceptedAt: new Date().toISOString(),
        paymentRequired: true,
        virtualMeetingRequired: true
      }
    };

    // Add notification to the matchmaker notifications collection
    const docRef = await addDoc(collection(db, MATCHMAKER_NOTIFICATIONS_COLLECTION), notificationData);
    console.log(`Successfully created notification document with ID: ${docRef.id}`);
    
    // Also update the match document with a flag indicating a notification was sent
    try {
      const matchRef = doc(db, 'matches', matchId);
      console.log(`Updating match document ${matchId} with notification flags`);
      
      await updateDoc(matchRef, {
        hasMatchmakerNotification: true,
        lastNotificationType: 'match_accepted',
        lastNotificationTime: serverTimestamp()
      });
      
      console.log(`Successfully updated match ${matchId} with notification flags`);
    } catch (matchUpdateError) {
      console.error('Error updating match with notification flag:', matchUpdateError);
    }
    
    console.log(`Notification sent to matchmaker ${matchmakerId} for accepted match ${matchId}`);
  } catch (error) {
    console.error('Error sending matchmaker notification:', error);
    // Don't throw the error to prevent disrupting the main flow
  }
}
