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
        
        if (notificationData.matchId && notificationData.matchData) {
          notificationMatchIds.add(notificationData.matchId);
          console.log('Notification match data:', notificationData.matchData);
          
          // Check if this match already exists in the matches collection
          const matchDoc = await getDoc(doc(db, 'matches', notificationData.matchId));
          
          // If the match doesn't exist in the matches collection, create a proposed match from notification data
          if (!matchDoc.exists()) {
            console.log(`Creating proposed match from notification for match ID: ${notificationData.matchId}`);
            
            // Get the matched user's data
            const matchedUserDoc = await getDoc(doc(db, 'users', notificationData.matchData.otherMemberId));
            
            if (matchedUserDoc.exists()) {
              const matchedUserData = matchedUserDoc.data();
              
              // Debug logging
              console.log('Raw matchedUserData:', matchedUserData);
              console.log('User fields available:', Object.keys(matchedUserData));
              console.log('State field:', matchedUserData.state);
              console.log('Suburb field:', matchedUserData.suburb);
              console.log('Location field:', matchedUserData.location);
              console.log('Marital status field (direct):', matchedUserData.maritalStatus);
              console.log('Marital status from questionnaire:', matchedUserData.questionnaireAnswers?.personal_maritalStatus);
              
              // Check if questionnaire answers exist
              if (matchedUserData.questionnaireAnswers) {
                console.log('Questionnaire fields available:', Object.keys(matchedUserData.questionnaireAnswers));
              }
              
              // Create matching points from notification data
              const matchingPoints: MatchingPoint[] = notificationData.matchData.matchingPoints?.map((point: any) => ({
                category: point.category || 'compatibility',
                description: point.description || 'You have similar interests',
                score: point.score || 0
              })) || [];
              
              // Create the proposed match object from notification data
              proposedMatches.push({
                id: notificationData.matchId,
                matchedUserId: notificationData.matchData.otherMemberId,
                matchedUserData: {
                  firstName: matchedUserData.firstName || '',
                  lastName: matchedUserData.lastName || '',
                  age: calculateAge(matchedUserData),
                  location: matchedUserData.location || '',
                  state: matchedUserData.state || '',
                  suburb: matchedUserData.suburb || '',
                  profession: matchedUserData.questionnaireAnswers?.lifestyle_profession || '',
                  educationLevel: matchedUserData.questionnaireAnswers?.personal_educationLevel || matchedUserData.educationLevel || '',
                  profilePhotoUrl: matchedUserData.profilePhotoUrl || '',
                  maritalStatus: matchedUserData.maritalStatus || matchedUserData.questionnaireAnswers?.personal_maritalStatus || '',
                  questionnaireAnswers: matchedUserData.questionnaireAnswers || {}
                },
                compatibilityScore: notificationData.matchData.compatibilityScore || 0,
                compatibilityExplanation: 'You and this match have complementary personalities and shared interests that our matchmakers believe could make for a great connection.',
                matchingPoints: matchingPoints,
                proposedAt: notificationData.createdAt,
                status: MatchApprovalStatus.PENDING
              });
            }
          }
        }
      }
      
      // Process matches where user is member1
      for (const docSnapshot of snapshot1.docs) {
        const matchData = docSnapshot.data();
        
        // Get the matched user's data (member2)
        const matchedUserDoc = await getDoc(doc(db, 'users', matchData.member2Id));
        
        if (matchedUserDoc.exists()) {
          const matchedUserData = matchedUserDoc.data();
          
          // Debug logging for member1 matches
          console.log('Member1 match - Raw matchedUserData:', matchedUserData);
          console.log('Member1 match - maritalStatus direct:', matchedUserData.maritalStatus);
          console.log('Member1 match - maritalStatus from questionnaire:', matchedUserData.questionnaireAnswers?.personal_maritalStatus);
          
          // Create the proposed match object
          proposedMatches.push({
            id: docSnapshot.id,
            matchedUserId: matchData.member2Id,
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
              maritalStatus: matchedUserData.maritalStatus || matchedUserData.questionnaireAnswers?.personal_maritalStatus || '',
              questionnaireAnswers: matchedUserData.questionnaireAnswers || {}
            },
            compatibilityScore: matchData.compatibilityScore || 0,
            compatibilityExplanation: matchData.compatibilityExplanation || 
              'You and this match have complementary personalities and shared interests that our matchmakers believe could make for a great connection.',
            matchingPoints: matchData.matchingPoints || [],
            proposedAt: matchData.proposedAt || matchData.createdAt,
            status: matchData.status || MatchApprovalStatus.PENDING
          });
        }
      }

      // Process matches where user is member2
      for (const docSnapshot of snapshot2.docs) {
        const matchData = docSnapshot.data();
        
        // Get the matched user's data (member1)
        const matchedUserDoc = await getDoc(doc(db, 'users', matchData.member1Id));
        
        if (matchedUserDoc.exists()) {
          const matchedUserData = matchedUserDoc.data();
          
          // Debug logging for member2 matches
          console.log('Member2 match - Raw matchedUserData:', matchedUserData);
          console.log('Member2 match - maritalStatus direct:', matchedUserData.maritalStatus);
          console.log('Member2 match - maritalStatus from questionnaire:', matchedUserData.questionnaireAnswers?.personal_maritalStatus);
          
          // Create the proposed match object
          proposedMatches.push({
            id: docSnapshot.id,
            matchedUserId: matchData.member1Id,
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
              maritalStatus: matchedUserData.maritalStatus || matchedUserData.questionnaireAnswers?.personal_maritalStatus || '',
              questionnaireAnswers: matchedUserData.questionnaireAnswers || {}
            },
            compatibilityScore: matchData.compatibilityScore || 0,
            compatibilityExplanation: matchData.compatibilityExplanation || 
              'You and this match have complementary personalities and shared interests that our matchmakers believe could make for a great connection.',
            matchingPoints: matchData.matchingPoints || [],
            proposedAt: matchData.proposedAt || matchData.createdAt,
            status: matchData.status || MatchApprovalStatus.PENDING
          });
        }
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
      
      // Log the first match's data to debug maritalStatus
      if (proposedMatches.length > 0) {
        console.log('First match data:', proposedMatches[0]);
        console.log('First match maritalStatus:', proposedMatches[0].matchedUserData.maritalStatus);
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
