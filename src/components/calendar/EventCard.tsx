import React, { useState } from 'react';
import { EventModal } from './EventModal';

interface Event {
  id: string;
  title: string;
  start: string;
  end?: string;
  with?: string;
  location?: string;
  backgroundColor?: string;
  isRequest?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'declined';
}

interface EventCardProps {
  event: Event;
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ event, className = '' }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className={`p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        style={{ backgroundColor: event.backgroundColor || '#2800A3' }}
        onClick={() => setShowModal(true)}
      >
        <p className="text-white font-medium">{event.title}</p>
        <p className="text-white/70 text-sm">
          {new Date(event.start).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })},{' '}
          {new Date(event.start).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
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

      {/* Event Modal */}
      {showModal && (
        <EventModal
          event={{
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end || event.start,
            with: event.with || '',
            location: event.location || '',
            isRequest: event.isRequest || false,
            requestStatus: event.requestStatus
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};
