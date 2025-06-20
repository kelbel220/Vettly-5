'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useAuth } from '@/context/AuthContext';
import { EventCard } from '@/components/calendar/EventCard';

// Initialize the Playfair Display font
const playfair = Playfair_Display({ subsets: ['latin'] });

export default function EventsPage() {
  const router = useRouter();
  const auth = useAuth();
  const [authLoading, setAuthLoading] = useState(true);
  
  // Track auth loading state
  useEffect(() => {
    const checkUser = () => {
      if (auth.currentUser !== undefined) {
        setAuthLoading(false);
      }
    };
    
    checkUser();
  }, [auth.currentUser]);

  // Use our calendar events hook
  const { 
    events: firebaseEvents, 
    loading: firebaseLoading, 
    error: firebaseError 
  } = useCalendarEvents();

  interface FormattedEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    with: string;
    location: string;
    backgroundColor: string;
    isRequest: boolean;
    requestStatus: 'pending' | 'accepted' | 'declined';
  }

  const [events, setEvents] = useState<FormattedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Format events when they load
  useEffect(() => {
    if (firebaseError) {
      setError(new Error(firebaseError.toString()));
      setLoading(false);
      return;
    }

    if (firebaseEvents.length > 0) {
      const formattedEvents = firebaseEvents.map(event => ({
        id: event.id || `temp-${Date.now()}`,
        title: event.title,
        start: event.start,
        end: event.end || event.start,
        with: event.with || '',
        location: event.location || '',
        backgroundColor: event.isRequest ? '#F59E0B' : '#5B3CDD',
        isRequest: event.isRequest || false,
        requestStatus: event.requestStatus || 'pending',
      }));
      setEvents(formattedEvents);
      setLoading(false);
    } else {
      setEvents([]);
      setLoading(false);
    }
  }, [firebaseEvents, firebaseLoading, firebaseError]);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !auth.currentUser) {
      router.push('/login');
      return;
    }
  }, [auth.currentUser, authLoading, router]);

  // Render loading state
  if (loading || authLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden">
        {/* Background container with fixed position to cover entire viewport */}
        <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-screen">
          <div className="w-16 h-16 border-4 border-t-[#5B3CDD] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl">Loading events...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden">
        {/* Background container with fixed position to cover entire viewport */}
        <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-screen">
          <div className="bg-red-500/20 p-6 rounded-xl max-w-md mx-auto">
            <h2 className="text-white text-xl mb-2">Error Loading Events</h2>
            <p className="text-white/80">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort events
  const upcomingEvents = events
    // Remove duplicate events by checking for unique IDs
    .filter((event, index, self) => 
      index === self.findIndex((e) => e.id === event.id)
    )
    // Only show future events
    .filter(event => new Date(event.start) >= new Date())
    // Sort by date (closest first)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background container with fixed position to cover entire viewport */}
      <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className={`text-2xl font-bold text-white ${playfair.className}`}>All Upcoming Events</h1>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-6">
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((event, index) => (
                <EventCard 
                  key={event.id} 
                  event={{
                    ...event,
                    backgroundColor: '#2800A3'
                  }}
                  className="shadow-lg" 
                />
              ))}
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <svg
                className="w-16 h-16 text-white/30 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-xl font-medium text-white mb-2">No Upcoming Events</h3>
              <p className="text-white/70">You don't have any upcoming events scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
