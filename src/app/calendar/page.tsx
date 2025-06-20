'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EventCalendar } from '@/components/calendar/EventCalendar';
import { useAuth } from '@/context/AuthContext';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const user = auth.currentUser;
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  
  // Track auth loading state
  useEffect(() => {
    const checkUser = () => {
      if (auth.currentUser !== undefined) {
        setAuthLoading(false);
      }
    };
    
    checkUser();
  }, [auth.currentUser]);
  const [isLoading, setIsLoading] = useState(true);

  // Get date from URL parameters if available
  const dateParam = searchParams ? searchParams.get('date') : null;
  const selectedDate = dateParam ? new Date(dateParam) : new Date();

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user) {
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden">
        {/* Background container with fixed position to cover entire viewport */}
        <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="w-64 h-64 rounded-full bg-white/10 animate-pulse mb-8" />
          <div className="h-8 w-64 bg-white/10 animate-pulse mb-4 rounded" />
          <div className="h-4 w-48 bg-white/10 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background container with fixed position to cover entire viewport */}
      <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-6">
          <EventCalendar initialDate={selectedDate} isFullPage={true} />
        </div>
      </div>
      
      {/* Mobile Navigation Bar */}
      <MobileNavigation activeTab={activeTab} />
    </div>
  );
}
