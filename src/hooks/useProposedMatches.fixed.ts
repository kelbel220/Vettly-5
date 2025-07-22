'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useAuth } from '@/context/AuthContext';
import { ProposedMatch, MatchApprovalStatus, MatchingPoint } from '@/lib/types/matchmaking';

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
        
        // Skip if essential data is missing
        if (!matchData.member1Id || !matchData.member2Id) {
          console.log('Skipping match with missing member IDs:', notificationData.matchId);
          continue;
        }
        
        // Determine if current user is member1 or member2
        const isMember1 = matchData.member1Id === currentUser.uid;
        const isMember2 = matchData.member2Id === currentUser.uid;
        
        if (!isMember1 && !isMember2) {
          console.log('Skipping match where current user is neither member1 nor member2:', notificationData.matchId);
          continue;
        }
        
        // Get the matched user's ID
        const matchedUserId = isMember1 ? matchData.member2Id : matchData.member1Id;
        
        // Get matched user data
        let matchedUserData = isMember1 ? matchData.member2Data : matchData.member1Data;
        
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
          member1Id: matchData.member1Id,
          member2Id: matchData.member2Id,
          matchedUserId,
          matchedUserData: {
            firstName: matchedUserData.firstName || '',
            lastName: matchedUserData.lastName || '',
            age: calculateAge(matchedUserData),
            location: matchedUserData.location || '',
            state: matchedUserData.state || '',
            suburb: matchedUserData.suburb || '',
            profession: matchedUserData.questionnaireAnswers?.lifestyle_profession || '',
            profilePhotoUrl: matchedUserData.profilePhotoUrl || '',
            educationLevel: matchedUserData.questionnaireAnswers?.personal_educationLevel || matchedUserData.questionnaireAnswers?.education_level || matchedUserData.educationLevel || '',
            maritalStatus: matchedUserData.maritalStatus || '',
            questionnaireAnswers: matchedUserData.questionnaireAnswers || {}
          },
          compatibilityScore: matchData.compatibilityScore || 0,
          // Only include member-specific explanations, NOT the combined explanation
          member1Explanation: matchData.member1Explanation || '',
          member2Explanation: matchData.member2Explanation || '',
          matchingPoints: matchData.matchingPoints || [],
          proposedAt: matchData.proposedAt || matchData.createdAt,
          status: matchData.status || MatchApprovalStatus.PENDING
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
      await updateDoc(matchRef, {
        status: MatchApprovalStatus.APPROVED,
        approvedAt: new Date().toISOString()
      });

      // Update local state
      setMatches(prev => 
        prev.map(match => 
          match.id === matchId 
            ? { ...match, status: MatchApprovalStatus.APPROVED } 
            : match
        )
      );
    } catch (err) {
      console.error('Error accepting match:', err);
      setError('Failed to accept match. Please try again.');
    }
  };

  // Decline a match
  const declineMatch = async (matchId: string) => {
    if (!currentUser) return;

    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        status: MatchApprovalStatus.DECLINED
      });

      // Update local state
      setMatches(prev => 
        prev.map(match => 
          match.id === matchId 
            ? { ...match, status: MatchApprovalStatus.DECLINED } 
            : match
        )
      );
    } catch (err) {
      console.error('Error declining match:', err);
      setError('Failed to decline match. Please try again.');
    }
  };

  // Fetch matches on component mount and when currentUser changes
  useEffect(() => {
    fetchMatches();
  }, [currentUser]);

  return {
    matches,
    loading,
    error,
    fetchMatches,
    acceptMatch,
    declineMatch
  };
}
