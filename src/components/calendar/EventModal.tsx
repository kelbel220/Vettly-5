import React, { useState } from 'react';
import { format } from 'date-fns';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';

interface EventModalProps {
  event: {
    id: string;
    title: string;
    start: string;
    end?: string;
    with?: string;
    location?: string;
    isRequest?: boolean;
    requestStatus?: 'pending' | 'accepted' | 'declined';
  };
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateEvent, deleteEvent } = useCalendarEvents();
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const getMapUrl = (location: string) => {
    if (!location) return '';
    // Encode the location for use in Google Maps URL
    const encodedLocation = encodeURIComponent(location);
    return `https://maps.google.com/maps?q=${encodedLocation}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  };

  const getStatusBadge = () => {
    if (!event.isRequest) return null;
    
    let bgColor = 'bg-yellow-500';
    let text = 'Pending';
    
    if (event.requestStatus === 'accepted') {
      bgColor = 'bg-green-500';
      text = 'Accepted';
    } else if (event.requestStatus === 'declined') {
      bgColor = 'bg-red-500';
      text = 'Declined';
    }
    
    return (
      <span className={`${bgColor} text-white text-xs px-2 py-1 rounded-full ml-2`}>
        {text}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-r from-[#2800A3] to-[#2800A3]/80 text-white rounded-xl w-full max-w-2xl mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <div className="flex flex-col text-left">
            <h2 className="text-xl font-bold text-left">{isEditing ? 'Edit Event' : event.title}</h2>
            {!isEditing && <p className="text-white/80 mt-1 text-left">{formatDate(event.start)}</p>}
            {!isEditing && event.isRequest && getStatusBadge()}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {isEditing ? (
            <div>
              {/* We'll implement the edit form inline instead of using a separate component */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                
                try {
                  await updateEvent(event.id, {
                    title: formData.get('title') as string,
                    start: new Date(formData.get('start') as string).toISOString(),
                    end: formData.get('end') ? new Date(formData.get('end') as string).toISOString() : undefined,
                    with: formData.get('with') as string || undefined,
                    location: formData.get('location') as string || undefined,
                  });
                  setIsEditing(false);
                } catch (error) {
                  console.error('Failed to update event:', error);
                }
              }} className="space-y-4 text-white">
                <div>
                  <label className="block mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={event.title}
                    className="w-full bg-white/10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Event title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    name="start"
                    defaultValue={event.start ? new Date(event.start).toISOString().slice(0, 16) : ''}
                    className="w-full bg-white/10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    name="end"
                    defaultValue={event.end ? new Date(event.end).toISOString().slice(0, 16) : ''}
                    className="w-full bg-white/10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block mb-1">With</label>
                  <input
                    type="text"
                    name="with"
                    defaultValue={event.with || ''}
                    className="w-full bg-white/10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Participant(s)"
                  />
                </div>
                
                <div>
                  <label className="block mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={event.location || ''}
                    className="w-full bg-white/10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Event location"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2800A3] hover:bg-[#2800A3]/80 rounded-lg transition-colors"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="p-2 bg-white/10 rounded-lg mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="w-full text-left">
                      <p className="text-white/70 w-24 inline-block">Start</p>
                      <p className="font-medium inline-block">{formatTime(event.start)}</p>
                    </div>
                  </div>

                  {event.end && (
                    <div className="flex items-start">
                      <div className="p-2 bg-white/10 rounded-lg mr-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="w-full text-left">
                        <p className="text-white/70 w-24 inline-block">End</p>
                        <p className="font-medium inline-block">{formatTime(event.end)}</p>
                      </div>
                    </div>
                  )}

                  {event.with && (
                    <div className="flex items-start">
                      <div className="p-2 bg-white/10 rounded-lg mr-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="w-full text-left">
                        <p className="text-white/70 w-24 inline-block">With</p>
                        <p className="font-medium inline-block">{event.with}</p>
                      </div>
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-start">
                      <div className="p-2 bg-white/10 rounded-lg mr-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="w-full text-left">
                        <p className="text-white/70 w-24 inline-block">Location</p>
                        <p className="font-medium inline-block">{event.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                {/* Map */}
                {event.location && (
                  <div className="mt-4">
                    <div className="rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="200"
                        frameBorder="0"
                        src={getMapUrl(event.location)}
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-between">
          <div className="flex space-x-2">
            {!isEditing && !isDeleting && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border-2 border-white text-white rounded-lg transition-colors w-24 h-12 flex items-center justify-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => setIsDeleting(true)}
                  className="px-4 py-2 bg-[#120050] hover:bg-[#120050]/80 text-white rounded-lg transition-colors w-24 h-12 flex items-center justify-center"
                >
                  Delete
                </button>
              </>
            )}
            
            {isDeleting && (
              <div>
                <p className="text-white mb-2">Are you sure you want to delete this event?</p>
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      try {
                        await deleteEvent(event.id);
                        onClose();
                      } catch (error) {
                        console.error('Failed to delete event:', error);
                      }
                    }}
                    className="px-4 py-2 bg-[#120050] hover:bg-[#120050]/80 text-white rounded-lg transition-colors w-24 h-12 flex items-center justify-center"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setIsDeleting(false)}
                    className="px-4 py-2 border-2 border-white text-white rounded-lg transition-colors w-24 h-12 flex items-center justify-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#00B3E3] hover:bg-[#00B3E3]/80 text-white rounded-lg transition-colors w-24 h-12 flex items-center justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
