import React, { useState, useEffect } from 'react';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';

interface EventFormProps {
  event?: Partial<CalendarEvent>;
  onSave: () => void;
  onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({ event, onSave, onCancel }) => {
  const { updateEvent } = useCalendarEvents();
  const [formData, setFormData] = useState({
    title: event?.title || '',
    start: event?.start ? new Date(event.start).toISOString().slice(0, 16) : '',
    end: event?.end ? new Date(event.end).toISOString().slice(0, 16) : '',
    with: event?.with || '',
    location: event?.location || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start) {
      setError('Title and start time are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      if (event?.id) {
        await updateEvent(event.id, {
          title: formData.title,
          start: new Date(formData.start).toISOString(),
          end: formData.end ? new Date(formData.end).toISOString() : undefined,
          with: formData.with || undefined,
          location: formData.location || undefined,
        });
      }
      
      onSave();
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {error && (
        <div className="bg-red-500/20 border border-red-500 p-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div>
        <label className="block mb-1">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full bg-white/10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Event title"
        />
      </div>
      
      <div>
        <label className="block mb-1">Start Time</label>
        <input
          type="datetime-local"
          name="start"
          value={formData.start}
          onChange={handleChange}
          className="w-full bg-white/10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div>
        <label className="block mb-1">End Time</label>
        <input
          type="datetime-local"
          name="end"
          value={formData.end}
          onChange={handleChange}
          className="w-full bg-white/10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div>
        <label className="block mb-1">With</label>
        <input
          type="text"
          name="with"
          value={formData.with}
          onChange={handleChange}
          className="w-full bg-white/10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Participant(s)"
        />
      </div>
      
      <div>
        <label className="block mb-1">Location</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full bg-white/10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Event location"
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Event'}
        </button>
      </div>
    </form>
  );
};
