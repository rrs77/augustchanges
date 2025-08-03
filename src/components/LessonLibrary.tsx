import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  BookOpen, 
  Clock, 
  Tag,
  ArrowUpDown,
  ArrowDownUp,
  Eye,
  MoreVertical,
  Edit3,
  Download,
  Calendar,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  Users
} from 'lucide-react';
import { LessonLibraryCard } from './LessonLibraryCard';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { LessonExporter } from './LessonExporter';
import { LessonDetailsModal } from './LessonDetailsModal';

// Helper function to safely render HTML content
const renderHtmlContent = (htmlContent) => {
  if (!htmlContent) return { __html: '' };
  return { __html: htmlContent };
};

// Helper function to get plain text from HTML (for search purposes)
const getPlainTextFromHtml = (html) => {
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  let text = temp.textContent || temp.innerText || '';
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

interface LessonLibraryProps {
  onLessonSelect?: (lessonNumber: string) => void;
  onLessonEdit?: (lessonNumber: string) => void;
  className?: string;
  onAssignToUnit?: (lessonNumber: string, halfTermId: string) => void;
}

// Define half-term periods
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

export function LessonLibrary({ 
  onLessonSelect, 
  onLessonEdit,
  className = '', 
  onAssignToUnit 
}: LessonLibraryProps) {
  const { 
    lessonNumbers, 
    allLessonsData, 
    currentSheetInfo, 
    halfTerms, 
    getLessonsForHalfTerm,
    updateLessonData,
    allActivities 
  } = useData();
  const { getThemeForClass, categories } = useSettings();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalfTerm, setSelectedHalfTerm] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'number' | 'title' | 'activities' | 'time'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedLessonForExport, setSelectedLessonForExport] = useState<string | null>(null);
  const [selectedLessonForDetails, setSelectedLessonForDetails] = useState<string | null>(null);
  
  // New editing states
  const [editingLessonNumber, setEditingLessonNumber] = useState<string | null>(null);
  const [editingLessonActivities, setEditingLessonActivities] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Add Activity Modal State
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get theme colors for current class
  const theme = getThemeForClass(className);

  // Get which half-term a lesson is assigned to (using dynamic data)
  const getLessonHalfTerm = (lessonNumber: string): string | null => {
    for (const halfTerm of halfTerms) {
      if (halfTerm.lessons.includes(lessonNumber)) {
        return halfTerm.id;
      }
    }
    return null; // Lesson not assigned to any half-term
  };

  // Start editing a lesson
  const handleStartEditing = (lessonNumber: string) => {
    const lessonData = allLessonsData[lessonNumber];
    if (lessonData) {
      const activities = Object.values(lessonData.grouped).flat().map((activity: any, index: number) => ({
        ...activity,
        _editId: `${lessonNumber}-${index}-${Date.now()}`
      }));
      setEditingLessonActivities(activities);
      setEditingLessonNumber(lessonNumber);
      setShowEditModal(true);
    }
  };

  // Save edited lesson
  const handleSaveEditing = () => {
    if (editingLessonNumber && editingLessonActivities.length >= 0) {
      // Group activities back by category
      const grouped = editingLessonActivities.reduce((acc: any, activity: any) => {
        const category = activity.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(activity);
        return acc;
      }, {});

      // Update lesson data
      const updatedLessonData = {
        ...allLessonsData[editingLessonNumber],
        grouped,
        categoryOrder: Object.keys(grouped),
        totalTime: editingLessonActivities.reduce((sum: number, act: any) => sum + (act.time || 0), 0)
      };

      // Update in context
      if (updateLessonData) {
        updateLessonData(editingLessonNumber, updatedLessonData);
      }
      
      cancelEditing();
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingLessonNumber(null);
    setEditingLessonActivities([]);
    setShowEditModal(false);
    setShowActivityPicker(false);
    setActivitySearchQuery('');
    setSelectedCategory('all');
  };

  // Delete activity
  const handleDeleteActivity = (activityIndex: number) => {
    setEditingLessonActivities(prev => prev.filter((_, index) => index !== activityIndex));
  };

  // Reorder activities
  const handleReorderActivity = (fromIndex: number, toIndex: number) => {
    setEditingLessonActivities(prev => {
      const newActivities = [...prev];
      const [movedActivity] = newActivities.splice(fromIndex, 1);
      newActivities.splice(toIndex, 0, movedActivity);
      return newActivities;
    });
  };

  // Add activity to editing lesson
  const handleAddActivity = (activity: any) => {
    const newActivity = {
      ...activity,
      _editId: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    setEditingLessonActivities(prev => [...prev, newActivity]);
    setShowActivityPicker(false);
    setActivitySearchQuery('');
    setSelectedCategory('all');
  };

  // Filter activities for the picker
  const filteredActivities = useMemo(() => {
    if (!allActivities) return [];
    
    return allActivities.filter((activity: any) => {
      const matchesSearch = !activitySearchQuery || 
        activity.activity.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
        getPlainTextFromHtml(activity.description).toLowerCase().includes(activitySearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allActivities, activitySearchQuery, selectedCategory]);

  // Filter and sort lessons
  const filteredAndSortedLessons = useMemo(() => {
    let filtered = lessonNumbers.filter(lessonNum => {
      const lessonData = allLessonsData[lessonNum];
      if (!lessonData) return false;
      
      // Filter by search query
      if (searchQuery) {
        const matchesSearch = 
          lessonNum.includes(searchQuery) || 
          (lessonData.title && lessonData.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          Object.values(lessonData.grouped).some((activities: any) => 
            activities.some((activity: any) => 
              activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
              getPlainTextFromHtml(activity.description).toLowerCase().includes(searchQuery.toLowerCase())
            )
          );
        
        if (!matchesSearch) return false;
      }
      
      // Filter by half-term using dynamic data instead of static mapping
      if (selectedHalfTerm !== 'all') {
        const lessonHalfTerm = getLessonHalfTerm(lessonNum);
        if (lessonHalfTerm !== selectedHalfTerm) return false;
      }
      
      return true;
    });

    // Sort lessons
    filtered.sort((a, b) => {
      const lessonA = allLessonsData[a];
      const lessonB = allLessonsData[b];
      
      if (!lessonA || !lessonB) return 0;
      
      let comparison = 0;
      
      switch (sortBy) {
        case 'number':
          comparison = parseInt(a) - parseInt(b);
          break;
        case 'title':
          comparison = (lessonA.title || `Lesson ${a}`).localeCompare(lessonB.title || `Lesson ${b}`);
          break;
        case 'activities':
          const activitiesA = Object.values(lessonA.grouped).reduce((sum: number, acts: any) => sum + acts.length, 0);
          const activitiesB = Object.values(lessonB.grouped).reduce((sum: number, acts: any) => sum + acts.length, 0);
          comparison = activitiesA - activitiesB;
          break;
        case 'time':
          comparison = lessonA.totalTime - lessonB.totalTime;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [lessonNumbers, allLessonsData, searchQuery, selectedHalfTerm, sortBy, sortOrder, halfTerms]);

  const toggleSort = (field: 'number' | 'title' | 'activities' | 'time') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleLessonClick = (lessonNumber: string) => {
    if (onLessonSelect) {
      onLessonSelect(lessonNumber);
    } else {
      setSelectedLessonForDetails(lessonNumber);
    }
  };

  const handleAssignToHalfTerm = (lessonNumber: string, halfTermId: string) => {
    console.log('LessonLibrary: Assigning lesson', lessonNumber, 'to half-term', halfTermId);
    if (onAssignToUnit) {
      onAssignToUnit(lessonNumber, halfTermId);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Lesson Library</h2>
              <p className="text-green-100 text-sm">
                {filteredAndSortedLessons.length} of {lessonNumbers.length} lessons
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'grid' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'list' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'compact' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-300" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-green-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
              dir="ltr"
            />
          </div>
          
          <select
            value={selectedHalfTerm}
            onChange={(e) => setSelectedHalfTerm(e.target.value)}
            className="px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
            dir="ltr"
          >
            <option value="all" className="text-gray-900">All Half-Terms</option>
            {HALF_TERMS.map(term => (
              <option key={term.id} value={term.id} className="text-gray-900">
                {term.name} ({term.months})
              </option>
            ))}
          </select>
          
          <div className="flex space-x-2">
            <button
              onClick={() => toggleSort('number')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'number' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="text-sm">#</span>
              {sortBy === 'number' && (sortOrder === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />)}
            </button>
            <button
              onClick={() => toggleSort('time')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'time' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Clock className="h-4 w-4" />
              {sortBy === 'time' && (sortOrder === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />)}
            </button>
            <button
              onClick={() => toggleSort('activities')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'activities' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Tag className="h-4 w-4" />
              {sortBy === 'activities' && (sortOrder === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />)}
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Grid */}
      <div className="p-6">
        {filteredAndSortedLessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedHalfTerm !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No lessons available in the library'
              }
            </p>
            {(searchQuery || selectedHalfTerm !== 'all') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedHalfTerm('all');
                }}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
              viewMode === 'list' ? 'space-y-4' :
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
            }
          `}>
            {filteredAndSortedLessons.map((lessonNum, index) => {
              const lessonData = allLessonsData[lessonNum];
              if (!lessonData) return null;
              
              return (
                <LessonLibraryCard
                  key={lessonNum}
                  lessonNumber={lessonNum}
                  displayNumber={index + 1}
                  lessonData={lessonData}
                  viewMode={viewMode}
                  onClick={() => handleLessonClick(lessonNum)}
                  theme={theme}
                  onAssignToUnit={handleAssignToHalfTerm}
                  halfTerms={HALF_TERMS}
                  onEdit={() => handleStartEditing(lessonNum)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Activity Picker Modal */}
      {showActivityPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Activity to Lesson</h3>
                <button
                  onClick={() => setShowActivityPicker(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Search and Filter */}
              <div className="flex space-x-3 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  <option value="all" className="text-gray-900">All Categories</option>
                  {categories?.map((category: any) => (
                    <option key={category.name} value={category.name} className="text-gray-900">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActivities.map((activity: any, index: number) => (
                  <button
                    key={`${activity.id || index}-${activity.activity}`}
                    onClick={() => handleAddActivity(activity)}
                    className="text-left p-4 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">
                          {activity.activity}
                        </h4>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-600">
                            {activity.category}
                          </span>
                          {activity.time > 0 && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {activity.time}m
                            </span>
                          )}
                        </div>
                        <div 
                          className="text-xs text-gray-600 line-clamp-2 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={renderHtmlContent(activity.description)}
                        />
                      </div>
                      <Plus className="h-5 w-5 text-blue-600 ml-2 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
              
              {filteredActivities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No activities found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lesson Edit Modal */}
      {showEditModal && editingLessonNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Edit Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit3 className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">
                    Editing: {allLessonsData[editingLessonNumber]?.title || `Lesson ${editingLessonNumber}`}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveEditing}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Activities List - Editable */}
            <div className="flex-1 overflow-hidden">
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {editingLessonActivities.map((activity: any, activityIndex: number) => (
                    <div key={activity._editId} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-base mb-2">
                            {activity.activity}
                          </h4>
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                              {activity.category}
                            </span>
                            {activity.time > 0 && (
                              <span className="text-sm text-gray-600 flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {activity.time} minutes
                              </span>
                            )}
                          </div>
                          <div 
                            className="text-sm text-gray-700 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={renderHtmlContent(activity.description)}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {/* Move Up */}
                          {activityIndex > 0 && (
                            <button
                              onClick={() => handleReorderActivity(activityIndex, activityIndex - 1)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Move up"
                            >
                              <ChevronUp className="h-5 w-5" />
                            </button>
                          )}
                          
                          {/* Move Down */}
                          {activityIndex < editingLessonActivities.length - 1 && (
                            <button
                              onClick={() => handleReorderActivity(activityIndex, activityIndex + 1)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Move down"
                            >
                              <ChevronDown className="h-5 w-5" />
                            </button>
                          )}
                          
                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteActivity(activityIndex)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete activity"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {editingLessonActivities.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg">No activities in this lesson</p>
                    <p className="text-sm">Add activities to build your lesson</p>
                  </div>
                )}
              </div>

              {/* Add Activity Button */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <button
                  onClick={() => setShowActivityPicker(true)}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Activity to Lesson</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Exporter */}
      {selectedLessonForExport && (
        <LessonExporter
          lessonNumber={selectedLessonForExport}
          onClose={() => setSelectedLessonForExport(null)}
        />
      )}

      {/* Lesson Details Modal */}
      {selectedLessonForDetails && (
        <LessonDetailsModal
          lessonNumber={selectedLessonForDetails}
          onClose={() => setSelectedLessonForDetails(null)}
          theme={theme}
          onExport={() => {
            setSelectedLessonForExport(selectedLessonForDetails);
            setSelectedLessonForDetails(null);
          }}
        />
      )}
    </div>
  );
}