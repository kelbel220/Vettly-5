'use client';

import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';

// Collection name for match approval notifications
const MATCH_APPROVAL_NOTIFICATIONS_COLLECTION = 'matchApprovalNotifications';

/**
 * Interface for match approval notification data
 */
interface MatchApprovalNotificationData {
  matchId: string;
  memberId: string;
  matchmakerId: string;
  type: 'date_approved';
  status: 'pending' | 'read';
  createdAt: any; // Firebase Timestamp
  message: string;
  additionalData?: any;
}

/**
 * Update the match status to approved for date after matchmaker approval
 * @param matchId The ID of the match
 * @param matchmakerId The ID of the matchmaker
 * @returns Promise that resolves when the match is approved
 */
export async function approveMatchForDate(
  matchId: string,
  matchmakerId: string
): Promise<void> {
  try {
    // Get the match data
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      throw new Error('Match not found');
    }
    
    const matchData = matchDoc.data();
    
    // Check if the match is ready for date approval
    if (!matchData.virtualMeetingCompleted) {
      throw new Error('Virtual meeting must be completed before approving the date');
    }
    
    // Update the match document
    await updateDoc(matchRef, {
      dateApproved: true,
      dateApprovedAt: new Date().toISOString(),
      dateApprovedBy: matchmakerId
    });
    
    // Send notifications to both members
    await sendDateApprovalNotifications(matchId, matchData.member1Id, matchData.member2Id, matchmakerId);
    
    console.log(`Match ${matchId} approved for date by matchmaker ${matchmakerId}`);
  } catch (error) {
    console.error('Error approving match for date:', error);
    throw error;
  }
}

/**
 * Send notifications to both members that their date has been approved
 * @param matchId The ID of the match
 * @param member1Id The ID of member 1
 * @param member2Id The ID of member 2
 * @param matchmakerId The ID of the matchmaker
 */
async function sendDateApprovalNotifications(
  matchId: string,
  member1Id: string,
  member2Id: string,
  matchmakerId: string
): Promise<void> {
  try {
    // Create notification for member 1
    const notification1: MatchApprovalNotificationData = {
      matchId,
      memberId: member1Id,
      matchmakerId,
      type: 'date_approved',
      status: 'pending',
      createdAt: serverTimestamp(),
      message: 'Your date has been approved by your matchmaker! You can now arrange your first meeting with your match.',
      additionalData: {
        approvedAt: new Date().toISOString()
      }
    };
    
    // Create notification for member 2
    const notification2: MatchApprovalNotificationData = {
      matchId,
      memberId: member2Id,
      matchmakerId,
      type: 'date_approved',
      status: 'pending',
      createdAt: serverTimestamp(),
      message: 'Your date has been approved by your matchmaker! You can now arrange your first meeting with your match.',
      additionalData: {
        approvedAt: new Date().toISOString()
      }
    };
    
    // Add notifications to the collection
    await Promise.all([
      addDoc(collection(db, MATCH_APPROVAL_NOTIFICATIONS_COLLECTION), notification1),
      addDoc(collection(db, MATCH_APPROVAL_NOTIFICATIONS_COLLECTION), notification2)
    ]);
    
    // Also add notifications to the vettly2Notifications collection for the UI
    const vettly2NotificationsCollection = 'vettly2Notifications';
    
    await Promise.all([
      addDoc(collection(db, vettly2NotificationsCollection), {
        memberId: member1Id,
        matchId,
        type: 'date_approved',
        message: 'Your date has been approved by your matchmaker! You can now arrange your first meeting with your match.',
        createdAt: serverTimestamp(),
        viewed: false
      }),
      addDoc(collection(db, vettly2NotificationsCollection), {
        memberId: member2Id,
        matchId,
        type: 'date_approved',
        message: 'Your date has been approved by your matchmaker! You can now arrange your first meeting with your match.',
        createdAt: serverTimestamp(),
        viewed: false
      })
    ]);
    
    console.log(`Date approval notifications sent to members ${member1Id} and ${member2Id}`);
  } catch (error) {
    console.error('Error sending date approval notifications:', error);
  }
}
