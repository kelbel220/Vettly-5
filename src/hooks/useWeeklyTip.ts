/**
 * useWeeklyTip Hook
 * Custom hook for managing weekly tips functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getActiveTip, 
  recordTipView, 
  dismissTip, 
  hasUserViewedTip 
} from '@/lib/services/weeklyTipService';
import { WeeklyTip, formatTipForDisplay } from '@/lib/models/weeklyTip';

// Local storage keys
const TIP_STORAGE_KEY = 'vettly_weekly_tip';
const TIP_VIEW_STORAGE_KEY = 'vettly_tip_views';
const TIP_LAST_FETCH_KEY = 'vettly_tip_last_fetch';

interface UseWeeklyTipReturn {
  tip: WeeklyTip | null;
  loading: boolean;
  error: Error | null;
  hasUserSeen: boolean;
  showTipModal: boolean;
  setShowTipModal: (show: boolean) => void;
  markTipAsSeen: () => Promise<void>;
  dismissTip: () => Promise<void>;
  refreshTip: () => Promise<void>;
}

/**
 * Custom hook for managing weekly tips
 */
export function useWeeklyTip(): UseWeeklyTipReturn {
  const auth = useAuth();
  const [tip, setTip] = useState<WeeklyTip | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasUserSeen, setHasUserSeen] = useState<boolean>(false);
  const [showTipModal, setShowTipModal] = useState<boolean>(false);

  /**
   * Fetches the current active tip from Firestore
   */
  const fetchActiveTip = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we should fetch from Firestore or use cached tip
      let shouldFetchFromFirestore = true;
      const lastFetchTime = localStorage.getItem(TIP_LAST_FETCH_KEY);
      const storedTip = localStorage.getItem(TIP_STORAGE_KEY);
      
      // If we have a stored tip and last fetch time, check if it's recent enough (within 5 minutes)
      if (lastFetchTime && storedTip) {
        const lastFetch = parseInt(lastFetchTime, 10);
        const now = Date.now();
        const fiveMinutesInMs = 5 * 60 * 1000;
        
        // Only use cached tip if it was fetched less than 5 minutes ago
        if (now - lastFetch < fiveMinutesInMs) {
          shouldFetchFromFirestore = false;
          console.log('Using cached tip, last fetched', new Date(lastFetch).toLocaleTimeString());
        }
      }
      
      // Always fetch from Firestore if we don't have a cached tip or it's too old
      if (shouldFetchFromFirestore) {
        console.log('Fetching fresh tip from Firestore');
        const activeTip = await getActiveTip();
        
        if (activeTip) {
          setTip(activeTip);
          
          // Save to local storage for offline access
          localStorage.setItem(TIP_STORAGE_KEY, JSON.stringify(activeTip));
          localStorage.setItem(TIP_LAST_FETCH_KEY, Date.now().toString());
          
          // Check if the user has seen this tip
          if (auth.currentUser) {
            const seen = await hasUserViewedTip(auth.currentUser.uid, activeTip.id!);
            setHasUserSeen(seen);
          } else {
            // Check local storage for anonymous users
            checkLocalStorageForView(activeTip.id!);
          }
        } else if (storedTip) {
          // If no active tip found but we have a stored tip, use that
          const parsedTip = JSON.parse(storedTip) as WeeklyTip;
          setTip(formatTipForDisplay(parsedTip));
          
          // Check if the user has seen this tip
          if (parsedTip.id) {
            checkLocalStorageForView(parsedTip.id);
          }
        }
      } else {
        // Use the cached tip
        const parsedTip = JSON.parse(storedTip!) as WeeklyTip;
        setTip(formatTipForDisplay(parsedTip));
        
        // Check if the user has seen this tip
        if (parsedTip.id) {
          if (auth.currentUser) {
            const seen = await hasUserViewedTip(auth.currentUser.uid, parsedTip.id);
            setHasUserSeen(seen);
          } else {
            checkLocalStorageForView(parsedTip.id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching weekly tip:', err);
      setError(err as Error);
      
      // Try to get from local storage as fallback
      const storedTip = localStorage.getItem(TIP_STORAGE_KEY);
      if (storedTip) {
        try {
          const parsedTip = JSON.parse(storedTip) as WeeklyTip;
          setTip(formatTipForDisplay(parsedTip));
          
          // Check if the user has seen this tip
          if (parsedTip.id) {
            checkLocalStorageForView(parsedTip.id);
          }
        } catch (parseErr) {
          console.error('Error parsing stored tip:', parseErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [auth.currentUser]);

  /**
   * Checks local storage to see if the user has viewed the tip
   */
  const checkLocalStorageForView = useCallback((tipId: string) => {
    try {
      const viewedTips = localStorage.getItem(TIP_VIEW_STORAGE_KEY);
      if (viewedTips) {
        const parsedViews = JSON.parse(viewedTips) as string[];
        setHasUserSeen(parsedViews.includes(tipId));
      } else {
        setHasUserSeen(false);
      }
    } catch (err) {
      console.error('Error checking local storage for tip views:', err);
      setHasUserSeen(false);
    }
  }, []);

  /**
   * Records that the user has seen the tip
   */
  const markTipAsSeen = useCallback(async () => {
    if (!tip || !tip.id) return;
    
    try {
      // Record in Firestore if user is authenticated
      if (auth.currentUser) {
        await recordTipView(auth.currentUser.uid, tip.id, true);
      }
      
      // Also record in local storage
      try {
        const viewedTips = localStorage.getItem(TIP_VIEW_STORAGE_KEY);
        let parsedViews: string[] = [];
        
        if (viewedTips) {
          parsedViews = JSON.parse(viewedTips);
        }
        
        if (!parsedViews.includes(tip.id)) {
          parsedViews.push(tip.id);
          localStorage.setItem(TIP_VIEW_STORAGE_KEY, JSON.stringify(parsedViews));
        }
      } catch (err) {
        console.error('Error updating local storage for tip views:', err);
      }
      
      setHasUserSeen(true);
    } catch (err) {
      console.error('Error marking tip as seen:', err);
    }
  }, [tip, auth.currentUser]);

  /**
   * Dismisses the current tip
   */
  const handleDismissTip = useCallback(async () => {
    if (!tip || !tip.id) return;
    
    try {
      // Record dismissal in Firestore if user is authenticated
      if (auth.currentUser) {
        await dismissTip(auth.currentUser.uid, tip.id);
      }
      
      // Also record in local storage
      try {
        const viewedTips = localStorage.getItem(TIP_VIEW_STORAGE_KEY);
        let parsedViews: string[] = [];
        
        if (viewedTips) {
          parsedViews = JSON.parse(viewedTips);
        }
        
        if (!parsedViews.includes(tip.id)) {
          parsedViews.push(tip.id);
          localStorage.setItem(TIP_VIEW_STORAGE_KEY, JSON.stringify(parsedViews));
        }
      } catch (err) {
        console.error('Error updating local storage for tip views:', err);
      }
      
      setHasUserSeen(true);
      setShowTipModal(false);
    } catch (err) {
      console.error('Error dismissing tip:', err);
    }
  }, [tip, auth.currentUser]);

  /**
   * Refreshes the tip data
   */
  const refreshTip = useCallback(async () => {
    // Force a fresh fetch from Firestore by clearing the last fetch timestamp
    localStorage.removeItem(TIP_LAST_FETCH_KEY);
    await fetchActiveTip();
  }, [fetchActiveTip]);

  // Effect to fetch the active tip on mount
  useEffect(() => {
    // Always force a fresh fetch when the component mounts
    localStorage.removeItem(TIP_LAST_FETCH_KEY);
    fetchActiveTip();
  }, [fetchActiveTip]);

  // Automatically show the tip modal if there's a tip the user hasn't seen
  useEffect(() => {
    if (tip && !hasUserSeen && !loading) {
      setShowTipModal(true);
    }
  }, [tip, hasUserSeen, loading]);

  return {
    tip,
    loading,
    error,
    hasUserSeen,
    showTipModal,
    setShowTipModal,
    markTipAsSeen,
    dismissTip: handleDismissTip,
    refreshTip
  };
}
