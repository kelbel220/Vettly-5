import { db } from "@/lib/firebase-init";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  getDoc
} from "firebase/firestore";

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

// Add a new event
export const addEvent = async (eventData: CalendarEvent) => {
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...eventData,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...eventData };
  } catch (error) {
    console.error("Error adding event: ", error);
    throw error;
  }
};

// Get all events for a user
export const getUserEvents = async (userId: string) => {
  try {
    // Query for events created by the user or date requests sent to the user
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CalendarEvent[];
  } catch (error) {
    console.error("Error getting user events: ", error);
    throw error;
  }
};

// Get date requests for a user
export const getDateRequests = async (userId: string) => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('requestToUserId', '==', userId),
      where('isRequest', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CalendarEvent[];
  } catch (error) {
    console.error("Error getting date requests: ", error);
    throw error;
  }
};

// Update an event
export const updateEvent = async (eventId: string, eventData: Partial<CalendarEvent>) => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: Timestamp.now()
    });
    
    // Get the updated document
    const updatedDoc = await getDoc(eventRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as CalendarEvent;
  } catch (error) {
    console.error("Error updating event: ", error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (eventId: string) => {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
    return true;
  } catch (error) {
    console.error("Error deleting event: ", error);
    throw error;
  }
};

// Update date request status
export const updateDateRequestStatus = async (
  eventId: string, 
  status: 'accepted' | 'declined'
) => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(eventRef, {
      requestStatus: status,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error("Error updating date request status: ", error);
    throw error;
  }
};
