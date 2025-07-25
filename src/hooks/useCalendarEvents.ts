import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase-init';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp
} from 'firebase/firestore';

export interface CalendarEvent {
  id?: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  with?: string;
  location?: string;
  userId: string;
  isRequest?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'declined';
  requestToUserId?: string;
}

// Collection name for events
const EVENTS_COLLECTION = 'calendar_events';

export const useCalendarEvents = () => {
  const auth = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load events from Firebase
  const loadEvents = async (forceRefresh = false) => {
    if (loading && !forceRefresh) return; // Prevent duplicate loading
    
    try {
      setLoading(true);
      setError(null);
      
      if (!auth?.currentUser) {
        console.log('No authenticated user found');
        setEvents([]);
        setLoading(false);
        return;
      }
      
      console.log('Fetching events for user:', auth.currentUser.uid);
      
      // Query for events created by the user
      const userEventsQuery = query(
        collection(db, EVENTS_COLLECTION),
        where('userId', '==', auth.currentUser.uid)
      );
      
      // Query for date requests sent to the user
      const dateRequestsQuery = query(
        collection(db, EVENTS_COLLECTION),
        where('requestToUserId', '==', auth.currentUser.uid),
        where('isRequest', '==', true)
      );
      
      // Also try to get all events from the calendar collection as a fallback
      const allEventsQuery = query(
        collection(db, 'calendar')
      );
      
      try {
        // Execute all queries
        const [userEventsSnapshot, dateRequestsSnapshot, allEventsSnapshot] = await Promise.all([
          getDocs(userEventsQuery),
          getDocs(dateRequestsQuery),
          getDocs(allEventsQuery)
        ]);
        
        // Process results
        const userEvents = userEventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CalendarEvent[];
        
        const dateRequests = dateRequestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CalendarEvent[];
        
        const calendarEvents = allEventsSnapshot.docs.map(doc => {
          const data = doc.data();
          // Make sure the data conforms to our CalendarEvent interface
          return {
            id: doc.id,
            title: data.title || 'Untitled Event',
            start: data.start || new Date().toISOString(),
            end: data.end,
            userId: data.userId || auth.currentUser?.uid || '',
            ...data
          };
        }) as CalendarEvent[];
        
        console.log('User events fetched:', userEvents.length);
        console.log('Date requests fetched:', dateRequests.length);
        console.log('Calendar events fetched:', calendarEvents.length);
        
        // Combine all events, prioritizing user events and date requests
        const combinedEvents = [...userEvents, ...dateRequests];
        
        // Only add calendar events that don't overlap with existing events
        const existingIds = new Set(combinedEvents.map(e => e.id));
        const uniqueCalendarEvents = calendarEvents.filter(e => !existingIds.has(e.id));
        
        const allEvents = [...combinedEvents, ...uniqueCalendarEvents];
        console.log('Total events after combining:', allEvents.length);
        
        setEvents(allEvents);
      } catch (queryErr) {
        console.error('Error executing queries:', queryErr);
        throw queryErr;
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add a new event
  const addEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      setLoading(true);
      
      if (!auth?.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
        ...eventData,
        createdAt: Timestamp.now()
      });
      
      const newEvent = { id: docRef.id, ...eventData };
      setEvents(prev => [...prev, newEvent]);
      
      return newEvent;
    } catch (err) {
      console.error('Error adding event:', err);
      setError('Failed to add event. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an event
  const updateEvent = async (eventId: string, eventData: Partial<CalendarEvent>) => {
    try {
      setLoading(true);
      
      if (!auth?.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        ...eventData,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? { ...event, ...eventData } : event
        )
      );
      
      return { id: eventId, ...eventData };
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete an event
  const deleteEvent = async (eventId: string) => {
    try {
      setLoading(true);
      
      if (!auth?.currentUser) {
        throw new Error('User not authenticated');
      }
      
      await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
      
      // Update local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      return true;
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update date request status
  const updateDateRequestStatus = async (
    eventId: string, 
    status: 'accepted' | 'declined'
  ) => {
    try {
      return await updateEvent(eventId, { requestStatus: status });
    } catch (err) {
      console.error('Error updating date request status:', err);
      throw err;
    }
  };

  // Load events on mount and when auth changes
  useEffect(() => {
    if (auth?.currentUser) {
      console.log('Auth state changed, loading events for user:', auth.currentUser.uid);
      loadEvents(true); // Force refresh when auth changes
    } else {
      console.log('No authenticated user, clearing events');
      setEvents([]);
      setLoading(false);
    }
  }, [auth?.currentUser]);
  
  // Debug effect to log events when they change
  useEffect(() => {
    console.log('Events state updated, count:', events.length);
  }, [events]);

  return {
    events,
    loading,
    error,
    loadEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    updateDateRequestStatus
  };
};
