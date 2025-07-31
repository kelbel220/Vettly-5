'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useAuth } from '@/context/AuthContext';

// Define types for match points
export interface MatchPoint {
  header: string;
  explanation: string;
}

export interface MatchPointsData {
  member1Points: MatchPoint[];
  member2Points: MatchPoint[];
  member1Id?: string;
  member2Id?: string;
  lastUpdated?: string;
}

/**
 * Hook to fetch and manage match explanation points for a specific match
 * This is a dedicated hook that only handles the points data, making it more efficient
 */
export function useMatchPoints(matchId: string) {
  const { currentUser } = useAuth();
  const [pointsData, setPointsData] = useState<MatchPointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Fetch match points
  const fetchMatchPoints = async () => {
    if (!matchId || !currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get match document from Firebase
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);

      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }

      const matchData = matchDoc.data();
      
      // Extract and parse points data
      let member1Points: MatchPoint[] = [];
      let member2Points: MatchPoint[] = [];
      
      // Process member1Points
      if (matchData.member1Points) {
        if (Array.isArray(matchData.member1Points)) {
          member1Points = matchData.member1Points;
        } else if (typeof matchData.member1Points === 'string') {
          try {
            // Try to parse JSON string
            const parsed = JSON.parse(matchData.member1Points);
            if (Array.isArray(parsed)) {
              member1Points = parsed;
            } else if (parsed.member1Explanation && Array.isArray(parsed.member1Explanation)) {
              // Handle nested structure like {"member1Explanation": [...points]}
              member1Points = parsed.member1Explanation;
            }
          } catch (e) {
            console.error('Failed to parse member1Points:', e);
          }
        }
      }
      
      // Process member2Points
      if (matchData.member2Points) {
        if (Array.isArray(matchData.member2Points)) {
          member2Points = matchData.member2Points;
        } else if (typeof matchData.member2Points === 'string') {
          try {
            // Try to parse JSON string
            const parsed = JSON.parse(matchData.member2Points);
            if (Array.isArray(parsed)) {
              member2Points = parsed;
            } else if (parsed.member2Explanation && Array.isArray(parsed.member2Explanation)) {
              // Handle nested structure like {"member2Explanation": [...points]}
              member2Points = parsed.member2Explanation;
            }
          } catch (e) {
            console.error('Failed to parse member2Points:', e);
          }
        }
      }
      
      const extractedData: MatchPointsData = {
        member1Points,
        member2Points,
        member1Id: matchData.member1Id,
        member2Id: matchData.member2Id,
        lastUpdated: matchData.explanationGeneratedAt || new Date().toISOString()
      };

      console.log('Fetched match points:', extractedData);
      setPointsData(extractedData);
    } catch (err) {
      console.error('Error fetching match points:', err);
      setError('Failed to load match explanation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate match explanation points
  const regenerateMatchPoints = async () => {
    if (!matchId || !currentUser) {
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      console.log('Regenerating explanation for match:', matchId);
      
      // Get the match data from Firebase to ensure we have the correct member IDs
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (!matchDoc.exists()) {
        throw new Error('Match not found in Firebase');
      }
      
      const matchData = matchDoc.data();
      
      // Determine the member IDs to use
      let member1Id = matchData.member1Id;
      let member2Id = matchData.member2Id;
      
      // Final check to ensure we have both member IDs
      if (!member1Id || !member2Id) {
        throw new Error('Could not determine member IDs for this match');
      }
      
      // In Vettly, member1 should be male and member2 should be female
      const payload = {
        matchId,
        member1Id, // Male ID
        member2Id  // Female ID
      };
      
      console.log('Using member IDs:', { member1Id, member2Id });
      
      // Make the API request
      const response = await fetch('/api/matches/generate-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      
      // Parse the response
      const data = await response.json();
      console.log('Explanation regenerated successfully:', data);
      
      // Process and update the local state with new points data
      let member1Points: MatchPoint[] = [];
      let member2Points: MatchPoint[] = [];
      
      // Process member1Points
      if (data.member1Points) {
        if (Array.isArray(data.member1Points)) {
          member1Points = data.member1Points;
        } else if (typeof data.member1Points === 'string') {
          try {
            // Try to parse JSON string
            const parsed = JSON.parse(data.member1Points);
            if (Array.isArray(parsed)) {
              member1Points = parsed;
            } else if (parsed.member1Explanation && Array.isArray(parsed.member1Explanation)) {
              // Handle nested structure like {"member1Explanation": [...points]}
              member1Points = parsed.member1Explanation;
            }
          } catch (e) {
            console.error('Failed to parse regenerated member1Points:', e);
          }
        }
      }
      
      // Process member2Points
      if (data.member2Points) {
        if (Array.isArray(data.member2Points)) {
          member2Points = data.member2Points;
        } else if (typeof data.member2Points === 'string') {
          try {
            // Try to parse JSON string
            const parsed = JSON.parse(data.member2Points);
            if (Array.isArray(parsed)) {
              member2Points = parsed;
            } else if (parsed.member2Explanation && Array.isArray(parsed.member2Explanation)) {
              // Handle nested structure like {"member2Explanation": [...points]}
              member2Points = parsed.member2Explanation;
            }
          } catch (e) {
            console.error('Failed to parse regenerated member2Points:', e);
          }
        }
      }
      
      console.log('Processed member1Points:', member1Points);
      console.log('Processed member2Points:', member2Points);
      
      setPointsData({
        member1Points,
        member2Points,
        member1Id: data.member1Id || member1Id,
        member2Id: data.member2Id || member2Id,
        lastUpdated: data.generated || new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to regenerate explanation:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Failed to regenerate explanation: ${errorMessage}`);
      return false;
    } finally {
      setIsRegenerating(false);
    }
  };

  // Get the appropriate points for the current user
  const getCurrentUserPoints = (): MatchPoint[] => {
    if (!pointsData || !currentUser) return [];

    // Show appropriate points based on current user's ID
    if (currentUser.uid === pointsData.member1Id && pointsData.member1Points?.length > 0) {
      return pointsData.member1Points;
    } else if (currentUser.uid === pointsData.member2Id && pointsData.member2Points?.length > 0) {
      return pointsData.member2Points;
    } 
    
    // Fallback: return any available points
    return pointsData.member1Points?.length > 0 
      ? pointsData.member1Points 
      : pointsData.member2Points || [];
  };

  // Fetch points on component mount and when matchId changes
  useEffect(() => {
    fetchMatchPoints();
  }, [matchId, currentUser]);

  return {
    pointsData,
    loading,
    error,
    isRegenerating,
    fetchMatchPoints,
    regenerateMatchPoints,
    getCurrentUserPoints
  };
}
