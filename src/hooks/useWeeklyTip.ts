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
  refreshTip: (forceRefresh?: boolean) => Promise<void>;
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
   * @param forceRefresh If true, ignores cache and fetches fresh data
   */
  const fetchActiveTip = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Always fetch from Firestore to get the latest data
      // This ensures we always have the most up-to-date content including whyMatters field
      let shouldFetchFromFirestore = true;
      const lastFetchTime = localStorage.getItem(TIP_LAST_FETCH_KEY);
      const storedTip = localStorage.getItem(TIP_STORAGE_KEY);
      
      // Only use cached data if explicitly not forcing refresh AND we have recent data
      if (!forceRefresh) {
        // If we have a stored tip and last fetch time, check if it's recent enough (within 1 minute)
        if (lastFetchTime && storedTip) {
          const lastFetch = parseInt(lastFetchTime, 10);
          const now = Date.now();
          // Reduced cache time to ensure fresher content
          const thirtySecondsInMs = 30 * 1000;
          
          // Only use cached tip if it was fetched very recently
          if (now - lastFetch < thirtySecondsInMs) {
            shouldFetchFromFirestore = false;
            console.log('Using cached tip, last fetched', new Date(lastFetch).toLocaleTimeString());
          }
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
   * @param forceRefresh If true, ignores cache and fetches fresh data
   */
  const refreshTip = useCallback(async (forceRefresh = false) => {
    // If forceRefresh is true, clear all tip-related local storage to ensure fresh data
    if (forceRefresh) {
      console.log('Force refreshing tip - clearing all tip cache data');
      localStorage.removeItem(TIP_LAST_FETCH_KEY);
      localStorage.removeItem(TIP_STORAGE_KEY);
      // Don't remove TIP_VIEW_STORAGE_KEY as that would reset which tips users have seen
    }
    await fetchActiveTip(forceRefresh);
  }, [fetchActiveTip]);

  // Effect to fetch the active tip on mount
  useEffect(() => {
    // Fetch the active tip when the component mounts, but don't force refresh
    // as that will be handled by the dashboard component when needed
    fetchActiveTip(false);
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
