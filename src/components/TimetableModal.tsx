import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2, Clock, MapPin, Repeat, FolderOpen, Check, InfoIcon, Pencil } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface TimetableClass {
  id: string;
  day: number; // 0-6 for Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  className: string;
  location: string;
  color: string;
  recurringUnitId?: string;
}

interface Unit {
  id: string;
  name: string;
  description: string;
  lessonNumbers: string[];
  color: string;
  term?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetableClasses: TimetableClass[];
  onAddClass: (newClass: TimetableClass) => void;
  onUpdateClass: (updatedClass: TimetableClass) => void;
  onDeleteClass: (classId: string) => void;
  initialDay?: number;
  initialHour?: number;
  units: Unit[];
  className: string;
}

// Map day numbers to names
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Time options for dropdown (8am to 6pm)
const TIME_OPTIONS = Array.from({ length: 11 }, (_, i) => {
  const hour = i + 8;
  return {
    value: `${hour}:00`,
    label: `${hour}:00${hour < 12 ? 'am' : 'pm'}`
  };
});

export function TimetableModal({
  isOpen,
  onClose,
  timetableClasses,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  initialDay,
  initialHour,
  units,
  className
}: TimetableModalProps) {
  const { getThemeForClass } = useSettings();
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
  const [editingClass, setEditingClass] = useState<TimetableClass | null>(null);
  const [newClass, setNewClass] = useState<TimetableClass>({
    id: `class-${Date.now()}`,
    day: initialDay !== undefined ? initialDay : 1, // Default to Monday
    startTime: initialHour !== undefined ? `${initialHour}:00` : '9:00',
    endTime: initialHour !== undefined ? `${initialHour + 1}:00` : '10:00',
    className: '',
    location: '',
    color: getThemeForClass(className).primary,
    recurringUnitId: ''
  });
  
  // Reset new class when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewClass({
        id: `class-${Date.now()}`,
        day: initialDay !== undefined ? initialDay : 1,
        startTime: initialHour !== undefined ? `${initialHour}:00` : '9:00',
        endTime: initialHour !== undefined ? `${initialHour + 1}:00` : '10:00',
        className: '',
        location: '',
        color: getThemeForClass(className).primary,
        recurringUnitId: ''
      });
      setActiveTab('add');
      setEditingClass(null);
    }
  }, [isOpen, initialDay, initialHour, className, getThemeForClass]);

  if (!isOpen) return null;

  const handleAddClass = () => {
    if (!newClass.className) {
      alert('Please enter a class name');
      return;
    }
    
    // Validate time range
    const startHour = parseInt(newClass.startTime.split(':')[0]);
    const endHour = parseInt(newClass.endTime.split(':')[0]);
    
    if (startHour >= endHour) {
      alert('End time must be after start time');
      return;
    }
    
    onAddClass(newClass);
    
    // Reset form
    setNewClass({
      id: `class-${Date.now() + 1}`,
      day: 1,
      startTime: '9:00',
      endTime: '10:00',
      className: '',
      location: '',
      color: getThemeForClass(className).primary,
      recurringUnitId: ''
    });
  };

  const handleUpdateClass = () => {
    if (!editingClass) return;
    
    if (!editingClass.className) {
      alert('Please enter a class name');
      return;
    }
    
    // Validate time range
    const startHour = parseInt(editingClass.startTime.split(':')[0]);
    const endHour = parseInt(editingClass.endTime.split(':')[0]);
    
    if (startHour >= endHour) {
      alert('End time must be after start time');
      return;
    }
    
    onUpdateClass(editingClass);
    setEditingClass(null);
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      onDeleteClass(classId);
      if (editingClass && editingClass.id === classId) {
        setEditingClass(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <Repeat className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Class Timetable</h2>
              <p className="text-blue-100 text-sm">
                {className} • Manage recurring classes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'add' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Add Class
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'manage' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Classes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'add' ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <InfoIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">About Timetable Classes</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Timetable classes are recurring weekly sessions. They appear on your calendar every week
                  and can be linked to units for automatic lesson scheduling.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Class Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Class Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Name
                    </label>
                    <input
                      type="text"
                      value={newClass.className}
                      onChange={(e) => setNewClass(prev => ({ ...prev, className: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Music Class"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newClass.location}
                      onChange={(e) => setNewClass(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Music Room"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={newClass.color}
                        onChange={(e) => setNewClass(prev => ({ ...prev, color: e.target.value }))}
                        className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newClass.color}
                        onChange={(e) => setNewClass(prev => ({ ...prev, color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Schedule */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Week
                    </label>
                    <select
                      value={newClass.day}
                      onChange={(e) => setNewClass(prev => ({ ...prev, day: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {DAY_NAMES.map((day, index) => (
                        <option key={index} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <select
                        value={newClass.startTime}
                        onChange={(e) => setNewClass(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {TIME_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <select
                        value={newClass.endTime}
                        onChange={(e) => setNewClass(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {TIME_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recurring Unit (Optional)
                    </label>
                    <select
                      value={newClass.recurringUnitId || ''}
                      onChange={(e) => setNewClass(prev => ({ ...prev, recurringUnitId: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">None</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.lessonNumbers.length} lessons)
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      If selected, lessons from this unit will automatically appear in this time slot.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddClass}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Class</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {timetableClasses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Repeat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Added</h3>
                  <p className="text-gray-600 mb-4">
                    Add your first timetable class using the "Add Class" tab.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add First Class</span>
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Timetable Classes</h3>
                  
                  {/* Group classes by day */}
                  {DAY_NAMES.map((dayName, dayIndex) => {
                    const classesForDay = timetableClasses.filter(tClass => tClass.day === dayIndex);
                    if (classesForDay.length === 0) return null;
                    
                    return (
                      <div key={dayIndex} className="mb-6">
                        <h4 className="font-medium text-gray-700 mb-2">{dayName}</h4>
                        <div className="space-y-3">
                          {classesForDay.map(tClass => (
                            <div 
                              key={tClass.id}
                              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
                            >
                              {editingClass && editingClass.id === tClass.id ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Class Name
                                      </label>
                                      <input
                                        type="text"
                                        value={editingClass.className}
                                        onChange={(e) => setEditingClass(prev => prev ? { ...prev, className: e.target.value } : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Location
                                      </label>
                                      <input
                                        type="text"
                                        value={editingClass.location}
                                        onChange={(e) => setEditingClass(prev => prev ? { ...prev, location: e.target.value } : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Day
                                      </label>
                                      <select
                                        value={editingClass.day}
                                        onChange={(e) => setEditingClass(prev => prev ? { ...prev, day: parseInt(e.target.value) } : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      >
                                        {DAY_NAMES.map((day, index) => (
                                          <option key={index} value={index}>
                                            {day}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Start Time
                                      </label>
                                      <select
                                        value={editingClass.startTime}
                                        onChange={(e) => setEditingClass(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      >
                                        {TIME_OPTIONS.map(option => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">
                                        End Time
                                      </label>
                                      <select
                                        value={editingClass.endTime}
                                        onChange={(e) => setEditingClass(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      >
                                        {TIME_OPTIONS.map(option => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                      <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Recurring Unit
                                      </label>
                                      <select
                                        value={editingClass.recurringUnitId || ''}
                                        onChange={(e) => setEditingClass(prev => prev ? { ...prev, recurringUnitId: e.target.value || undefined } : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      >
                                        <option value="">None</option>
                                        {units.map(unit => (
                                          <option key={unit.id} value={unit.id}>
                                            {unit.name} ({unit.lessonNumbers.length} lessons)
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Color
                                      </label>
                                      <input
                                        type="color"
                                        value={editingClass.color}
                                        onChange={(e) => setEditingClass(prev => prev ? { ...prev, color: e.target.value } : null)}
                                        className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end space-x-2 pt-2">
                                    <button
                                      onClick={() => setEditingClass(null)}
                                      className="px-3 py-1.5 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={handleUpdateClass}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
                                    >
                                      <Save className="h-4 w-4" />
                                      <span>Save</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <div 
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: tClass.color }}
                                        ></div>
                                        <h5 className="font-medium text-gray-900">{tClass.className}</h5>
                                      </div>
                                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                        <div className="flex items-center space-x-1">
                                          <Clock className="h-4 w-4 text-gray-500" />
                                          <span>{tClass.startTime} - {tClass.endTime}</span>
                                        </div>
                                        {tClass.location && (
                                          <div className="flex items-center space-x-1">
                                            <MapPin className="h-4 w-4 text-gray-500" />
                                            <span>{tClass.location}</span>
                                          </div>
                                        )}
                                      </div>
                                      {tClass.recurringUnitId && (
                                        <div className="flex items-center space-x-1 mt-1 text-sm text-indigo-600">
                                          <FolderOpen className="h-4 w-4" />
                                          <span>
                                            {units.find(u => u.id === tClass.recurringUnitId)?.name || 'Unit'}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => setEditingClass(tClass)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClass(tClass.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 ${
              activeTab === 'manage' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'text-gray-600 hover:text-gray-800 bg-gray-200 hover:bg-gray-300'
            } font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2`}
          >
            <Plus className="h-4 w-4" />
            <span>Add New Class</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}