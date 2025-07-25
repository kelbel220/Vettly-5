import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './calendar.css';
import { useCalendarEvents, CalendarEvent as FirebaseEvent } from '@/hooks/useCalendarEvents';
import { useAuth } from '@/context/AuthContext';
import { EventModal } from './EventModal';
import { EventCard } from './EventCard';

// UI Event interface
interface Event {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  with?: string;
  location?: string;
  userId?: string;
  isRequest?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'declined';
  requestToUserId?: string;
}

interface Member {
  id: string;
  name: string;
  avatar?: string;
}

interface EventCalendarProps {
  initialDate?: Date;
  isFullPage?: boolean;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ initialDate, isFullPage = false }) => {
  // Get current date and auth
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  const auth = useAuth();
  
  // Use our calendar events hook with force refresh in dashboard context
  const { 
    events: firebaseEvents, 
    loading: firebaseLoading, 
    error: firebaseError, 
    addEvent: addFirebaseEvent,
    updateEvent: updateFirebaseEvent,
    deleteEvent: deleteFirebaseEvent,
    updateDateRequestStatus,
    loadEvents
  } = useCalendarEvents();
  
  // Force refresh events when component mounts, especially in dashboard context
  useEffect(() => {
    console.log('EventCalendar mounted, isFullPage:', isFullPage);
    if (auth?.currentUser) {
      console.log('Forcing refresh of calendar events');
      loadEvents(true);
    }
  }, []);
  
  // State for modal visibility and form data
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'request'>('add');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    with: '',
    location: '',
  });
  
  // Empty members array instead of sample members
  const [members, setMembers] = useState<Member[]>([]);
  
  // Local events state
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Return empty array instead of sample events
  const getSampleEvents = () => [];
  
  // Convert Firebase events to UI events
  useEffect(() => {
    // Set error state if Firebase has an error
    if (firebaseError) {
      console.error('Firebase error in EventCalendar:', firebaseError);
      setError(firebaseError);
      setLoading(false);
      return;
    }
    
    console.log('Processing Firebase events in EventCalendar:', firebaseEvents.length);
    
    // If we have Firebase events, format them for the UI
    if (firebaseEvents && firebaseEvents.length > 0) {
      const formattedEvents: Event[] = firebaseEvents.map(event => {
        // Ensure we have valid date strings
        let startDate = event.start;
        let endDate = event.end || event.start;
        
        // If dates are Firestore timestamps, convert them
        if (typeof startDate === 'object' && startDate !== null && 'toDate' in startDate) {
          try {
            // @ts-ignore - Handle Firestore Timestamp objects
            startDate = startDate.toDate().toISOString();
          } catch (e) {
            console.error('Error converting start timestamp:', e);
            startDate = new Date().toISOString();
          }
        }
        
        if (typeof endDate === 'object' && endDate !== null && 'toDate' in endDate) {
          try {
            // @ts-ignore - Handle Firestore Timestamp objects
            endDate = endDate.toDate().toISOString();
          } catch (e) {
            console.error('Error converting end timestamp:', e);
            endDate = startDate; // Fall back to start date
          }
        }
        
        return {
          id: event.id || `temp-${Date.now()}`,
          title: event.title || 'Untitled Event',
          start: startDate,
          end: endDate,
          allDay: event.allDay || false,
          backgroundColor: event.isRequest ? '#34D8F1' : '#5B3CDD',
          borderColor: event.isRequest ? '#34D8F1' : '#5B3CDD',
          textColor: event.textColor || '#FFFFFF',
          with: event.with || '',
          location: event.location || '',
          userId: event.userId,
          isRequest: event.isRequest || false,
          requestStatus: event.requestStatus || 'pending',
          requestToUserId: event.requestToUserId
        };
      });
      
      console.log('Formatted events for UI:', formattedEvents.length);
      setEvents(formattedEvents);
      setLoading(false);
    } else {
      // If no Firebase events, set empty array
      console.log('No Firebase events found, setting empty events array');
      setEvents([]);
      setLoading(false);
    }
  }, [firebaseEvents, firebaseLoading, firebaseError, auth?.currentUser]);
  
  // Debug effect to log events when they change
  useEffect(() => {
    console.log('UI events updated in EventCalendar, count:', events.length);
  }, [events]);
  
  // Initialize the calendar with empty events if not authenticated
  useEffect(() => {
    if (!auth?.currentUser && events.length === 0) {
      setEvents([]);
      setLoading(false);
    }
  }, []);

  // Set initial states
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null);
  const [viewMode, setViewMode] = useState<'month' | 'day'>(initialDate ? 'day' : 'month');
  
  // Get days in month for the calendar
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for the first day of the month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days array
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Format date to display in the calendar
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Router for navigation
  const router = useRouter();

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (!isFullPage) {
      // Navigate to calendar page with the selected date
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      router.push(`/calendar?date=${formattedDate}`);
    } else {
      // We're already on the calendar page, just update the view
      setSelectedDate(date);
      setViewMode('day');
    }
  };
  
  // Handle back to month view
  const handleBackToMonth = () => {
    setViewMode('month');
  };
  
  // Open add event modal
  const openAddEventModal = () => {
    if (selectedDate) {
      const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      setFormData({
        ...formData,
        date: formattedDate,
        startTime: '12:00',
        endTime: '13:00',
      });
      setModalType('add');
      setShowModal(true);
    }
  };
  
  // Open request date modal
  const openRequestDateModal = () => {
    if (selectedDate) {
      const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      setFormData({
        ...formData,
        date: formattedDate,
        startTime: '12:00',
        endTime: '13:00',
      });
      setModalType('request');
      setShowModal(true);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  // Create array of hours for day view
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Check if user is authenticated
  const isAuthenticated = !!auth?.currentUser;
  
  // Day view component
  const renderDayView = () => {
    if (!selectedDate) return null;
    
    return (
      <div className="p-6">
        {/* Day view header */}
        <div className="flex flex-col bg-[#5B3CDD] text-white p-4 rounded-t-lg">
          <div className="flex items-center mb-3">
            <button 
              onClick={handleBackToMonth}
              className="p-2 mr-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-white text-xl font-medium">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={openAddEventModal}
              className="w-32 px-5 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
            >
              Add Event
            </button>
            <button 
              onClick={openRequestDateModal}
              className="w-32 px-5 py-2 bg-[#34D8F1] text-white text-sm font-medium rounded-lg hover:bg-[#28AEC2] transition-colors"
            >
              Request Date
            </button>
          </div>
        </div>
        
        {/* Day timeline */}
        <div className="bg-white/5 rounded-xl p-4 mt-4">
          <div className="relative min-h-[600px]">
            {/* Hour markers */}
            {hours.map(hour => (
              <div key={hour} className="flex border-t border-white/10 py-2">
                <div className="w-16 text-white/50 text-xs pr-2">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="flex-1 relative min-h-[50px]">
                  {/* Events that start at this hour */}
                  {getEventsForDate(selectedDate)
                    .filter((event) => {
                      const eventStart = new Date(event.start);
                      return eventStart.getHours() === hour;
                    })
                    .map((event) => (
                      <div
                        key={event.id}
                        className="absolute top-0 left-0 right-4 p-2 rounded-md mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{
                          backgroundColor: event.backgroundColor || '#5B3CDD',
                          borderLeft: `4px solid ${event.borderColor || '#5B3CDD'}`,
                          color: event.textColor || '#FFFFFF',
                          minHeight: '40px',
                          zIndex: 10,
                        }}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs opacity-80">
                          {new Date(event.start).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {event.end && ` - ${new Date(event.end).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                        </div>
                        {event.location && (
                          <div className="text-xs mt-1 flex items-center">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {event.location}
                          </div>
                        )}
                        {event.with && (
                          <div className="text-xs mt-1 flex items-center">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {event.with}
                          </div>
                        )}
                        {event.isRequest && (
                          <div className="text-xs mt-1 bg-white/20 rounded px-1 py-0.5 inline-block">
                            {event.requestStatus === 'pending'
                              ? 'Pending'
                              : event.requestStatus === 'accepted'
                              ? 'Accepted'
                              : 'Declined'}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Check if a date has events
  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Auth status indicator with login option
  const renderAuthStatus = () => {
    if (loading) return null;

    return (
      <div className="auth-status">
        {auth?.currentUser ? (
          <div className="flex items-center text-xs text-white/70">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {auth.currentUser.email}
          </div>
        ) : (
          <div className="flex items-center">
            <span className="text-xs text-white/50 mr-2">Not signed in</span>
            <a 
              href="/login" 
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-full transition-colors"
            >
              Sign in
            </a>
          </div>
        )}
      </div>
    );
  };

  // Render event modal
  const renderEventModal = () => {
    if (!showModal) return null;

    // Create a separate handler for form submission
    const submitForm = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Check authentication first
      if (!auth?.currentUser) {
        setError('You must be logged in to add events. Please sign in and try again.');
        return;
      }
      
      // Hide modal immediately
      setShowModal(false);
      
      // Process the form data asynchronously
      setTimeout(() => {
        processFormSubmission();
      }, 100);
    };
    
    // Process form submission without blocking UI
    const processFormSubmission = async () => {
      try {
        setLoading(true);
        
        // Verify authentication status
        if (!auth?.currentUser) {
          console.log('User not authenticated, cannot add event to Firebase');
          setError('You must be logged in to add events. Please sign in and try again.');
          setLoading(false);
          return;
        }
        
        // Ensure we have a valid user ID
        if (!auth.currentUser.uid) {
          console.error('User authenticated but missing UID');
          setError('Authentication error. Please sign out and sign in again.');
          setLoading(false);
          return;
        }
        
        // Create Firebase event data
        const eventData: Omit<FirebaseEvent, 'id'> = {
          title: formData.title,
          start: `${formData.date}T${formData.startTime}:00`,
          end: `${formData.date}T${formData.endTime}:00`,
          with: formData.with,
          location: formData.location,
          userId: auth.currentUser.uid,
          isRequest: modalType === 'request',
        };
        
        // If this is a date request, add recipient info
        if (modalType === 'request') {
          const selectedMember = members.find(m => m.name === formData.with);
          if (selectedMember) {
            eventData.requestToUserId = selectedMember.id;
            eventData.requestStatus = 'pending';
          }
        }
        
        // Save to Firebase
        await addFirebaseEvent(eventData);
        
        // Reset form
        setFormData({
          title: '',
          date: '',
          startTime: '',
          endTime: '',
          with: '',
          location: '',
        });
        setError(null);
      } catch (err) {
        console.error('Error creating event:', err);
        setError('Failed to create event. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-[#1E1E2E] rounded-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-lg font-medium">
              {modalType === 'add' ? 'Add New Event' : 'Request a Date'}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-1 rounded-full hover:bg-white/10"
              type="button"
            >
              <svg
                className="w-6 h-6 text-white/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={submitForm}>
            <div className="mb-4">
              <label
                className="block text-white/70 text-sm mb-1"
                htmlFor="title"
              >
                {modalType === 'add' ? 'Event Title' : 'Date Type'}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                placeholder={
                  modalType === 'add' ? 'Enter event title' : 'Coffee Date, Dinner, etc.'
                }
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-white/70 text-sm mb-1"
                htmlFor="date"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  className="block text-white/70 text-sm mb-1"
                  htmlFor="startTime"
                >
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-white/70 text-sm mb-1"
                  htmlFor="endTime"
                >
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                className="block text-white/70 text-sm mb-1"
                htmlFor="with"
              >
                With
              </label>
              {modalType === 'add' ? (
                <input
                  type="text"
                  id="with"
                  name="with"
                  value={formData.with}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  placeholder="Enter name"
                />
              ) : (
                <select
                  name="with"
                  value={formData.with}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="" style={{ backgroundColor: '#1E1E2E', color: 'white' }}>
                    Select a member
                  </option>
                  {members.map((member) => (
                    <option key={member.id} value={member.name} style={{ backgroundColor: '#1E1E2E', color: 'white' }}>
                      {member.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-6">
              <label
                className="block text-white/70 text-sm mb-1"
                htmlFor="location"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                placeholder="Enter location"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-white ${
                  modalType === 'add' ? 'bg-[#5B3CDD] hover:bg-[#4930B1]' : 'bg-[#34D8F1] hover:bg-[#28AEC2]'
                }`}
              >
                {modalType === 'add' ? 'Add Event' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render the month view calendar
  const renderMonthView = () => {
    const days = generateCalendarDays();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="p-6">
        {/* Calendar controls */}

        {/* Month navigation */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h3 className="text-white text-lg font-medium">{formatDate(currentDate)}</h3>
          <button
            onClick={goToNextMonth}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Calendar grid */}
        <div className="bg-white/5 rounded-xl p-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdays.map((day) => (
              <div key={day} className="text-center py-1 text-white/70 text-xs">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div
                key={index}
                className={`aspect-square relative ${
                  day ? 'cursor-pointer hover:bg-white/10' : ''
                } ${day && isToday(day) ? 'bg-[#5B3CDD]/20' : 'bg-white/5'} rounded-md transition-colors`}
                onClick={() => day && handleDateClick(day)}
              >
                {day && (
                  <>
                    <div className="absolute top-1 right-1 text-xs text-white/80">
                      {day.getDate()}
                    </div>
                    {hasEvents(day) && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34D8F1]"></div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder for spacing - removed duplicate upcoming events section */}

        {/* Selected date events */}
        {selectedDate && (
          <div className="mt-4">
            <h4 className="text-white text-sm font-medium mb-2">
              Events for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h4>
            <div className="space-y-2">
              {getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: event.backgroundColor || '#5B3CDD' }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <p className="text-white font-medium">{event.title}</p>
                    <p className="text-white/70 text-sm">
                      {new Date(event.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {event.end && ` - ${new Date(event.end).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`}
                    </p>
                    {event.with && (
                      <p className="text-white/80 text-sm flex items-center mt-1">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {event.with}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-white/80 text-sm flex items-center mt-1">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {event.location}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white/10 rounded-xl overflow-hidden">
                  <div className="p-6 flex flex-col items-center text-center">
                    <h4 className="text-xl font-normal text-white mb-2">No Events</h4>
                    <p className="text-white text-base mb-4">Events will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upcoming events list */}
        {!selectedDate && events.length > 0 && (
          <div className="mt-4">
            <h4 className="text-white text-sm font-medium mb-2">Upcoming Events</h4>
            <div className="space-y-2">
              {events
                // Remove duplicate events by checking for unique IDs
                .filter((event, index, self) => 
                  index === self.findIndex((e) => e.id === event.id)
                )
                // Only show future events
                .filter(event => new Date(event.start) >= new Date())
                // Sort by date (closest first)
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                // Show only 3 events on dashboard, all on full page
                .slice(0, isFullPage ? undefined : 3)
                .map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                  />
                ))}
            </div>
          </div>
        )}

        {/* No events state */}
        {!selectedDate && events.length === 0 && (
          <div className="mt-4 bg-white/10 rounded-xl overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <h4 className="text-xl font-normal text-white mb-2">No Events</h4>
              <p className="text-white text-base mb-4">Events will appear here</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render loading state
  const renderLoading = () => (
    <div className="p-6 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-t-[#5B3CDD] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-white">Loading calendar...</p>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="p-6 flex flex-col items-center justify-center">
      <div className="bg-red-500/20 p-4 rounded-lg mb-4">
        <p className="text-white">{error}</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-[#5B3CDD] text-white rounded-lg hover:bg-[#4930B1] transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  // Debug loading state
  console.log('Calendar loading state:', loading);
  console.log('Events available:', events.length);
  console.log('User authenticated:', !!auth?.currentUser);
  
  // Main render function
  return (
    <div className="bg-white/10 rounded-xl overflow-hidden">
      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        <div className="p-6">
          {viewMode === 'month' ? renderMonthView() : renderDayView()}
        </div>
      )}
      {renderEventModal()}
      
      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
};

// Export the component
// Note: We're already exporting with 'export const EventCalendar' above, so this is redundant
// But keeping it for compatibility if needed elsewhere
