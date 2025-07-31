'use client';

import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useAuth } from '@/context/AuthContext';

// Collection name for Vettly 2 notifications
const VETTLY2_NOTIFICATIONS_COLLECTION = 'vettly2Notifications';

export interface MatchNotification {
  id: string;
  memberId: string;
  matchId: string;
  matchData: {
    otherMemberId: string;
    otherMemberName: string;
    otherMemberPhotoUrl?: string;
    otherMemberLocation?: string;
    otherMemberState?: string;
    compatibilityScore: number;
    matchingPoints: Array<{ category: string; score: number }>;
    approvedAt: string;
    matchmakerId: string;
    matchmakerName: string;
  };
  status: 'pending' | 'viewed' | 'accepted' | 'declined';
  createdAt: string;
  type?: 'match_declined' | 'match_accepted' | 'match_viewed';
  message?: string;
}

/**
 * Hook to listen for and manage match notifications
 */
export function useMatchNotifications() {
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  


  useEffect(() => {
    if (!currentUser) {
      console.log('No current user found, skipping notification listener');
      setLoading(false);
      return;
    }

    console.log('Setting up notification listener for user:', currentUser.uid);
    console.log('Firebase DB instance:', db);
    console.log('Collection name:', VETTLY2_NOTIFICATIONS_COLLECTION);
    
    setLoading(true);
    setError(null);
    
    // Set up real-time listener directly without checking collection first
    
    // Create a query for notifications for the current user
    const notificationsQuery = query(
      collection(db, VETTLY2_NOTIFICATIONS_COLLECTION),
      where('memberId', '==', currentUser.uid)
    );
    
    console.log('User query created for ID:', currentUser.uid);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        try {
          console.log('Snapshot received:', snapshot.size, 'notifications');
          const notificationsList: MatchNotification[] = [];
          const matchIdMap = new Map<string, MatchNotification>();
          
          // First collect all notifications
          snapshot.forEach((doc) => {
            const data = doc.data();
            const notification = {
              id: doc.id,
              memberId: data.memberId,
              matchId: data.matchId,
              matchData: data.matchData,
              status: data.status,
              createdAt: data.createdAt
            };
            
            // For each matchId, keep only the most recent notification
            const existingNotification = matchIdMap.get(data.matchId);
            
            if (!existingNotification || 
                new Date(notification.createdAt).getTime() > new Date(existingNotification.createdAt).getTime()) {
              matchIdMap.set(data.matchId, notification);
            }
          });
          
          // Convert map values to array
          const dedupedNotifications = Array.from(matchIdMap.values());
          
          // Sort notifications by date (newest first)
          dedupedNotifications.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          console.log(`Deduped notifications: ${dedupedNotifications.length} (from ${snapshot.size} total)`); 
          
          setNotifications(dedupedNotifications);
          setLoading(false);
        } catch (err) {
          console.error('Error processing notifications:', err);
          setError('Failed to process notifications');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to notifications:', err);
        setError('Failed to listen for notifications');
        setLoading(false);
      }
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  // Mark a notification as viewed
  const markAsViewed = async (notificationId: string) => {
    if (!currentUser) return;

    try {
      const notificationRef = doc(db, VETTLY2_NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        status: 'viewed'
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'viewed' } 
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as viewed:', err);
      setError('Failed to update notification status');
    }
  };
  
  // Mark all notifications as viewed
  const markAllAsViewed = async () => {
    if (!currentUser) return;
    
    try {
      // Get all pending notifications
      const pendingNotifications = notifications.filter(notification => notification.status === 'pending');
      
      if (pendingNotifications.length === 0) return;
      
      // Update all pending notifications in Firestore
      const updatePromises = pendingNotifications.map(notification => {
        const notificationRef = doc(db, VETTLY2_NOTIFICATIONS_COLLECTION, notification.id);
        return updateDoc(notificationRef, {
          status: 'viewed'
        });
      });
      
      await Promise.all(updatePromises);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.status === 'pending' 
            ? { ...notification, status: 'viewed' } 
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking all notifications as viewed:', err);
      setError('Failed to update notification statuses');
    }
  };

  return {
    notifications,
    loading,
    error,
    markAsViewed,
    markAllAsViewed
  };
}
