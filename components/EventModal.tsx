import React, { useState, useEffect } from 'react';
import { X, Calendar, Save, Trash2, Info, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'holiday' | 'inset' | 'event';
  description?: string;
  color: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (newEvent: CalendarEvent) => void;
  onUpdateEvent: (updatedEvent: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  editingEvent: CalendarEvent | null;
  className: string;
}

// Event type colors
const EVENT_COLORS = {
  'holiday': '#EF4444', // Red
  'inset': '#8B5CF6', // Purple
  'event': '#F59E0B', // Amber
};

export function EventModal({
  isOpen,
  onClose,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  editingEvent,
  className
}: EventModalProps) {
  const [event, setEvent] = useState<CalendarEvent>({
    id: `event-${Date.now()}`,
    title: '',
    startDate: new Date(),
    endDate: new Date(),
    type: 'event',
    description: '',
    color: EVENT_COLORS.event
  });
  
  // Initialize event when modal opens or editing event changes
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setEvent({
          ...editingEvent,
          startDate: new Date(editingEvent.startDate),
          endDate: new Date(editingEvent.endDate)
        });
      } else {
        setEvent({
          id: `event-${Date.now()}`,
          title: '',
          startDate: new Date(),
          endDate: new Date(),
          type: 'event',
          description: '',
          color: EVENT_COLORS.event
        });
      }
    }
  }, [isOpen, editingEvent]);

  // Update color when type changes
  useEffect(() => {
    setEvent(prev => ({
      ...prev,
      color: EVENT_COLORS[prev.type]
    }));
  }, [event.type]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!event.title) {
      alert('Please enter an event title');
      return;
    }
    
    // Validate date range
    if (event.startDate > event.endDate) {
      alert('End date must be after start date');
      return;
    }
    
    if (editingEvent) {
      onUpdateEvent(event);
    } else {
      onAddEvent(event);
    }
  };

  const handleDelete = () => {
    if (editingEvent && confirm('Are you sure you want to delete this event?')) {
      onDeleteEvent(editingEvent.id);
    }
  };

  // Format date for input
  const formatDateForInput = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6" />
              <h2 className="text-xl font-bold">
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={event.title}
              onChange={(e) => setEvent(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Summer Holiday"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              value={event.type}
              onChange={(e) => setEvent(prev => ({ ...prev, type: e.target.value as 'holiday' | 'inset' | 'event' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="holiday">Holiday</option>
              <option value="inset">Inset Day</option>
              <option value="event">Event</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formatDateForInput(event.startDate)}
                onChange={(e) => setEvent(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formatDateForInput(event.endDate)}
                onChange={(e) => setEvent(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={event.description || ''}
              onChange={(e) => setEvent(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
              placeholder="Add any additional details..."
            />
          </div>
          
          {/* Event Type Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">About Event Types</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><span className="font-medium">Holidays:</span> Block all lessons and classes during this period</li>
                  <li><span className="font-medium">Inset Days:</span> Staff training days with no regular classes</li>
                  <li><span className="font-medium">Events:</span> Special activities that don't block regular classes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div>
            {editingEvent && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{editingEvent ? 'Update' : 'Add'} Event</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}