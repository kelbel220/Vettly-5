'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useAuth } from '@/context/AuthContext';

const TestNotificationsPage = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setUserId(currentUser.uid);
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) {
      setError('No user logged in');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching notifications for user:', currentUser.uid);
      
      // First, try to get all notifications to see if the collection exists
      const allNotificationsQuery = collection(db, 'vettly2Notifications');
      const allSnapshot = await getDocs(allNotificationsQuery);
      
      console.log('Total notifications in collection:', allSnapshot.size);
      
      // Then, get notifications for the current user
      const userNotificationsQuery = query(
        collection(db, 'vettly2Notifications'),
        where('memberId', '==', currentUser.uid)
      );
      
      const userSnapshot = await getDocs(userNotificationsQuery);
      
      console.log('User notifications:', userSnapshot.size);
      
      const notificationsList: any[] = [];
      userSnapshot.forEach((doc) => {
        notificationsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setNotifications(notificationsList);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Notifications</h1>
      
      <div className="mb-4">
        <p>Current User ID: {userId || 'Not logged in'}</p>
      </div>
      
      <button 
        onClick={fetchNotifications}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Fetch Notifications
      </button>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Notifications ({notifications.length})</h2>
        
        {notifications.length === 0 ? (
          <p>No notifications found</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="border p-4 rounded">
                <h3 className="font-bold">Notification ID: {notification.id}</h3>
                <p>Match ID: {notification.matchId}</p>
                <p>Status: {notification.status}</p>
                <p>Created At: {notification.createdAt}</p>
                <h4 className="font-semibold mt-2">Match Data:</h4>
                <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
                  {JSON.stringify(notification.matchData, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestNotificationsPage;
