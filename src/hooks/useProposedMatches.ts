'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useAuth } from '@/context/AuthContext';
import { ProposedMatch, MatchApprovalStatus, MatchingPoint } from '@/lib/types/matchmaking';
import { notifyMatchmakerOfDeclinedMatch, notifyMatchmakerOfAcceptedMatch } from '@/lib/services/matchmakerNotificationService';
import { trackDeclinedMatch } from '@/lib/services/declineAnalyticsService';

// Collection name for Vettly 2 notifications
const VETTLY2_NOTIFICATIONS_COLLECTION = 'vettly2Notifications';

/**
 * Calculate age from DOB in Australian format (DD.MM.YYYY)
 * or fall back to age field if DOB is not available
 */
function calculateAge(userData: any): number | undefined {
  // Try to calculate age from DOB first
  const dob = userData.dob || userData.questionnaireAnswers?.personal_dob;
  
  if (dob) {
    // Parse Australian date format (DD.MM.YYYY)
    const parts = dob.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
      const year = parseInt(parts[2], 10);
      
      const birthDate = new Date(year, month, day);
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    }
  }
  
  // Fall back to age field if DOB calculation failed
  return userData.questionnaireAnswers?.personal_age || userData.age;
}

/**
 * Hook to fetch and manage proposed matches for the current user
 */
export function useProposedMatches() {
  const { currentUser } = useAuth();
  const [matches, setMatches] = useState<ProposedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug log when hook is initialized
  console.log('useProposedMatches hook initialized');

  // Fetch matches for the current user
  const fetchMatches = async () => {
    if (!currentUser) {
      console.log('No current user found, skipping match fetch');
      setLoading(false);
      return;
    }
    
    console.log('Fetching matches for user:', currentUser.uid);

    try {
      setLoading(true);
      setError(null);

      // Query matches where the current user is either member1 or member2
      const matchesQuery1 = query(
        collection(db, 'matches'),
        where('member1Id', '==', currentUser.uid)
      );

      const matchesQuery2 = query(
        collection(db, 'matches'),
        where('member2Id', '==', currentUser.uid)
      );

      // Get both query results
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(matchesQuery1),
        getDocs(matchesQuery2)
      ]);
      
      console.log(`Found ${snapshot1.size} matches where user is member1`);
      console.log(`Found ${snapshot2.size} matches where user is member2`);

      // Process matches
      const proposedMatches: ProposedMatch[] = [];
      
      // Also check for notifications that might contain match data
      const notificationsQuery = query(
        collection(db, VETTLY2_NOTIFICATIONS_COLLECTION),
        where('memberId', '==', currentUser.uid)
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      console.log(`Found ${notificationsSnapshot.size} notifications for user`);
      
      // Create a set of match IDs from notifications to avoid duplicates
      const notificationMatchIds = new Set<string>();
      
      // Process notifications and extract match data
      for (const docSnapshot of notificationsSnapshot.docs) {
        const notificationData = docSnapshot.data();
        console.log('Processing notification:', {
          id: docSnapshot.id,
          matchId: notificationData.matchId,
          hasMatchData: !!notificationData.matchData,
          status: notificationData.status,
          createdAt: notificationData.createdAt
        });
        
        // Skip notifications without match data or match ID
        if (!notificationData.matchData || !notificationData.matchId) {
          console.log('Skipping notification without match data or match ID:', docSnapshot.id);
          continue;
        }
        
        // Skip if we've already processed this match ID
        if (notificationMatchIds.has(notificationData.matchId)) {
          console.log('Skipping duplicate match ID from notification:', notificationData.matchId);
          continue;
        }
        
        notificationMatchIds.add(notificationData.matchId);
        
        const matchData = notificationData.matchData;
        
        // In the Vettly2 notification structure, we only have otherMemberId, not member1Id and member2Id
        // So we need to construct these from the current user ID and the otherMemberId
        const currentUserId = currentUser.uid;
        const otherMemberId = matchData.otherMemberId;
        
        // Skip if essential data is missing
        if (!otherMemberId) {
          console.log('Skipping match with missing otherMemberId:', notificationData.matchId);
          continue;
        }
        
        // Construct member1Id and member2Id
        // For consistency, we'll make the current user always member1
        const member1Id = currentUserId;
        const member2Id = otherMemberId;
        
        // Get the matched user's ID (which is otherMemberId in this case)
        const matchedUserId = otherMemberId;
        
        // Get matched user data - in the notification structure, we don't have member1Data/member2Data
        // We just need to use whatever data we have about the other member
        let matchedUserData = null;
        
        // If matched user data is missing, try to fetch it
        if (!matchedUserData || Object.keys(matchedUserData).length === 0) {
          console.log('Matched user data missing, attempting to fetch from users collection:', matchedUserId);
          
          try {
            const userDocRef = doc(db, 'users', matchedUserId);
            const userDocSnapshot = await getDoc(userDocRef);
            
            if (userDocSnapshot.exists()) {
              matchedUserData = userDocSnapshot.data();
              console.log('Successfully fetched matched user data for:', matchedUserId);
            } else {
              console.log('No user document found for matched user:', matchedUserId);
              continue; // Skip this match if we can't get user data
            }
          } catch (err) {
            console.error('Error fetching matched user data:', err);
            continue; // Skip this match if we can't get user data
          }
        }
        
        // Create the match object
        proposedMatches.push({
          id: notificationData.matchId,
          currentUserId: currentUser.uid,
          member1Id: member1Id, // Using our constructed member1Id (current user)
          member2Id: member2Id, // Using our constructed member2Id (other member)
          matchedUserId,
          matchedUserData: {
            firstName: matchedUserData.firstName || matchData.otherMemberName?.split(' ')[0] || '',
            lastName: matchedUserData.lastName || matchData.otherMemberName?.split(' ').slice(1).join(' ') || '',
            age: calculateAge(matchedUserData),
            location: matchedUserData.location || '',
            state: matchedUserData.state || '',
            suburb: matchedUserData.suburb || '',
            profession: matchedUserData.questionnaireAnswers?.lifestyle_profession || '',
            profilePhotoUrl: matchedUserData.profilePhotoUrl || matchData.otherMemberPhotoUrl || '',
            educationLevel: matchedUserData.questionnaireAnswers?.personal_educationLevel || matchedUserData.questionnaireAnswers?.education_level || matchedUserData.educationLevel || '',
            maritalStatus: matchedUserData.maritalStatus || '',
            questionnaireAnswers: matchedUserData.questionnaireAnswers || {}
          },
          compatibilityScore: matchData.compatibilityScore || 0,
          // Gender-specific explanations
          member1Explanation: matchData.member1Explanation || matchData.compatibilityExplanation || '', // Male explanation
          member2Explanation: matchData.member2Explanation || matchData.compatibilityExplanation || '', // Female explanation
          // Structured explanation points
          member1Points: matchData.member1Points || null, // Structured points for male
          member2Points: matchData.member2Points || null, // Structured points for female
          matchingPoints: matchData.matchingPoints || [],
          proposedAt: matchData.approvedAt || notificationData.createdAt,
          status: notificationData.status === 'accepted' ? MatchApprovalStatus.APPROVED : 
                 notificationData.status === 'declined' ? MatchApprovalStatus.DECLINED : 
                 MatchApprovalStatus.PENDING
        });
      }

      // No test matches - using only real data from Firebase
      
      // Sort matches by date (newest first)
      proposedMatches.sort((a, b) => 
        new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime()
      );
      
      console.log(`Total processed matches: ${proposedMatches.length}`);
      console.log(`Pending matches: ${proposedMatches.filter(m => m.status === MatchApprovalStatus.PENDING).length}`);
      console.log(`Approved matches: ${proposedMatches.filter(m => m.status === MatchApprovalStatus.APPROVED).length}`);
      console.log(`Declined matches: ${proposedMatches.filter(m => m.status === MatchApprovalStatus.DECLINED).length}`);
      
      // Log the first match's data to debug
      if (proposedMatches.length > 0) {
        console.log('First match data:', proposedMatches[0]);
        console.log('First match member1Explanation:', proposedMatches[0].member1Explanation);
        console.log('First match member2Explanation:', proposedMatches[0].member2Explanation);
      }
      
      setMatches(proposedMatches);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load your matches. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Accept a match
  const acceptMatch = async (matchId: string) => {
    if (!currentUser) return;

    try {
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }
      
      const matchData = matchDoc.data();
      const isMember1 = matchData.member1Id === currentUser.uid;
      const isMember2 = matchData.member2Id === currentUser.uid;
      
      if (!isMember1 && !isMember2) {
        throw new Error('Current user is not part of this match');
      }
      
      // Determine which member is accepting the match
      const updateData: any = {};
      
      if (isMember1) {
        updateData.member1Accepted = true;
        updateData.member1AcceptedAt = new Date().toISOString();
      } else {
        updateData.member2Accepted = true;
        updateData.member2AcceptedAt = new Date().toISOString();
      }
      
      // Check if both members have accepted
      const bothAccepted = 
        (isMember1 && matchData.member2Accepted) || 
        (isMember2 && matchData.member1Accepted);
      
      if (bothAccepted) {
        updateData.status = MatchApprovalStatus.APPROVED;
        updateData.approvedAt = new Date().toISOString();
        updateData.paymentRequired = true;
        updateData.virtualMeetingRequired = true;
      }
      
      await updateDoc(matchRef, updateData);
      
      // If both members accepted, notify the matchmaker
      if (bothAccepted && matchData.matchmakerId) {
        // Get user data to include name in notification
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        let memberName = '';
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          memberName = userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        }
        
        try {
          await notifyMatchmakerOfAcceptedMatch(
            matchId,
            currentUser.uid,
            matchData.matchmakerId,
            memberName || undefined
          );
        } catch (notificationError) {
          console.error('Error sending matchmaker notification:', notificationError);
        }
      }

      // Update local state
      setMatches(prev => 
        prev.map(match => {
          if (match.id === matchId) {
            const updatedMatch = { ...match };
            
            if (isMember1) {
              updatedMatch.member1Accepted = true;
            } else {
              updatedMatch.member2Accepted = true;
            }
            
            if (bothAccepted) {
              updatedMatch.status = MatchApprovalStatus.APPROVED;
              updatedMatch.paymentRequired = true;
              updatedMatch.virtualMeetingRequired = true;
            }
            
            return updatedMatch;
          }
          return match;
        })
      );
    } catch (err) {
      console.error('Error accepting match:', err);
      setError('Failed to accept match. Please try again.');
    }
  };

  // Decline a match
  const declineMatch = async (matchId: string, reason?: string) => {
    if (!currentUser) return;

    try {
      // Get the match data first to access matchmakerId
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (!matchDoc.exists()) {
        throw new Error(`Match with ID ${matchId} not found`);
      }
      
      const matchData = matchDoc.data();
      
      // Update match status to DECLINED with member info
      await updateDoc(matchRef, {
        status: MatchApprovalStatus.DECLINED,
        declinedAt: new Date().toISOString(),
        declineReason: reason || 'No reason provided',
        declinedBy: {
          memberId: currentUser.uid,
          memberName: currentUser.displayName || 'Unknown Member'
        }
      });
      
      // Update the member's currentStage to match_declined in Firestore
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          currentStage: 'match_declined'
        });
        console.log(`Updated member ${currentUser.uid} currentStage to 'match_declined'`);
      } catch (updateStageError) {
        console.error('Error updating member currentStage:', updateStageError);
      }

      // Update local state
      setMatches(prev => 
        prev.map(match => 
          match.id === matchId 
            ? { ...match, status: MatchApprovalStatus.DECLINED } 
            : match
        )
      );
      
      // Find the match in our local state to get more details
      const matchDetails = matches.find(match => match.id === matchId);
      
      // Determine the other member's ID
      const otherMemberId = currentUser.uid === matchData.member1Id 
        ? matchData.member2Id 
        : matchData.member1Id;
      
      // Get user data for the current user (who declined)
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      let declinerName = '';
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        declinerName = userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      }
      
      // Create notification document for the other member
      try {
        // Get other member's data for a more personalized notification
        const otherMemberRef = doc(db, 'users', otherMemberId);
        const otherMemberDoc = await getDoc(otherMemberRef);
        let otherMemberName = '';
        let otherMemberPhotoUrl = '';
        
        if (otherMemberDoc.exists()) {
          const otherMemberData = otherMemberDoc.data();
          otherMemberName = otherMemberData.displayName || 
            `${otherMemberData.firstName || ''} ${otherMemberData.lastName || ''}`.trim();
          otherMemberPhotoUrl = otherMemberData.profilePhotoUrl || '';
        }
        
        await addDoc(collection(db, VETTLY2_NOTIFICATIONS_COLLECTION), {
          memberId: otherMemberId,
          matchId: matchId,
          matchData: {
            otherMemberId: currentUser.uid,
            otherMemberName: declinerName || 'A member',
            otherMemberPhotoUrl: userDoc.exists() ? userDoc.data().profilePhotoUrl : undefined,
            compatibilityScore: matchData.compatibilityScore || 0,
            matchingPoints: matchData.matchingPoints || [],
            approvedAt: matchData.createdAt || new Date().toISOString(),
            matchmakerId: matchData.matchmakerId || '',
            matchmakerName: matchData.matchmakerName || ''
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
          type: 'match_declined',
          message: `This match was declined by the other member. Your matchmaker will continue looking for better matches for you.`
        });
        
        console.log(`Notification sent to other member ${otherMemberId} for declined match ${matchId}`);
      } catch (notificationError) {
        console.error('Error sending notification to other member:', notificationError);
        // Don't throw error to prevent disrupting the main flow
      }
      
      // Notify the matchmaker about the declined match
      console.log('Match data for debugging:', matchData);
      console.log('Checking for matchmakerId:', matchData.matchmakerId);
      
      if (matchData.matchmakerId) {
        // Get user data to include name in notification
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        let memberName = '';
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          memberName = userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          console.log('Member name for notification:', memberName);
        } else {
          console.log('User document not found for:', currentUser.uid);
        }
        
        try {
          console.log('Sending notification with params:', {
            matchId,
            memberId: currentUser.uid,
            matchmakerId: matchData.matchmakerId,
            memberName: memberName || undefined,
            reason
          });
          
          await notifyMatchmakerOfDeclinedMatch(
            matchId,
            currentUser.uid,
            matchData.matchmakerId,
            memberName || undefined,
            reason
          );
          console.log(`Notification sent to matchmaker ${matchData.matchmakerId} for declined match ${matchId}`);
        } catch (notificationError) {
          console.error('Error sending matchmaker notification:', notificationError);
        }
        
        // Track decline for analytics
        try {
          await trackDeclinedMatch(
            currentUser.uid,
            memberName || undefined
          );
          console.log(`Decline analytics updated for member ${currentUser.uid}`);
        } catch (analyticsError) {
          console.error('Error updating decline analytics:', analyticsError);
        }
      } else {
        console.error('No matchmaker ID found for this match, skipping notification. Match data:', matchData);
      }
    } catch (err) {
      console.error('Error declining match:', err);
      setError('Failed to decline match. Please try again.');
    }
  };

  // Fetch matches on component mount and when currentUser changes
  useEffect(() => {
    fetchMatches();
  }, [currentUser]);

  // Undo a declined match (for testing purposes)
  const undoDeclineMatch = async (matchId: string) => {
    if (!currentUser) return;

    try {
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      if (!matchDoc.exists()) throw new Error('Match not found');
      
      // Update match status back to PENDING
      await updateDoc(matchRef, {
        status: MatchApprovalStatus.PENDING,
        declinedAt: null,
        declineReason: null,
        declinedBy: null,
        hasMatchmakerNotification: false,
        lastNotificationType: null,
        lastNotificationTime: null
      });

      // Update local state
      setMatches(prev => 
        prev.map(match => 
          match.id === matchId 
            ? { ...match, status: MatchApprovalStatus.PENDING } 
            : match
        )
      );

      console.log(`Match ${matchId} has been restored to PENDING status`);
    } catch (err) {
      console.error('Error undoing declined match:', err);
      setError('Failed to undo decline. Please try again.');
    }
  };

  return {
    matches,
    loading,
    error,
    fetchMatches,
    acceptMatch,
    declineMatch,
    undoDeclineMatch // Add the undo function to the return object
  };
}
