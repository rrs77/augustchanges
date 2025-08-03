import React, { useState, useEffect } from 'react';
import { X, Calendar, Eye, Save, Star, Clock, Search, Tag, CheckCircle, Download } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { LessonDetailsModal } from './LessonDetailsModal';
import { HalfTermView } from './HalfTermView';
import { LessonPrintModal } from './LessonPrintModal';

interface LessonSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  halfTermId: string;
  halfTermName: string;
  halfTermMonths: string;
  halfTermColor: string;
  selectedLessons: string[];
  onSave: (lessons: string[], isComplete?: boolean) => void;
}

export function LessonSelectionModal({
  isOpen,
  onClose,
  halfTermId,
  halfTermName,
  halfTermMonths,
  halfTermColor,
  selectedLessons,
  onSave
}: LessonSelectionModalProps) {
  // FIXED: Added halfTerms to the destructuring to check lesson assignments
  const { lessonNumbers, allLessonsData, currentSheetInfo, halfTerms } = useData();
  const { getThemeForClass } = useSettings();
  // Initialize with all assigned lessons selected (since they're already assigned)
  const [localSelectedLessons, setLocalSelectedLessons] = useState<string[]>(selectedLessons);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHalfTermView, setShowHalfTermView] = useState(false);
  const [orderedLessons, setOrderedLessons] = useState<string[]>(selectedLessons);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedLessonForDetails, setSelectedLessonForDetails] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // Load completion status from localStorage
  React.useEffect(() => {
    const savedHalfTerms = localStorage.getItem(`half-terms-${currentSheetInfo.sheet}`);
    if (savedHalfTerms) {
      try {
        const parsedHalfTerms = JSON.parse(savedHalfTerms);
        const halfTerm = parsedHalfTerms.find((term: any) => term.id === halfTermId);
        if (halfTerm) {
          setIsComplete(halfTerm.isComplete || false);
        }
      } catch (error) {
        console.error('Error parsing saved half-terms:', error);
      }
    }
  }, [halfTermId, currentSheetInfo.sheet]);

  if (!isOpen) return null;

  // FIXED: Only show lessons already assigned to THIS half-term
  const filteredLessons = lessonNumbers.filter(lessonNum => {
    const lessonData = allLessonsData[lessonNum];
    if (!lessonData) return false;
    
    // Check if this lesson is assigned to THIS specific half-term
    const thisHalfTerm = halfTerms.find(term => term.id === halfTermId);
    const isAssignedToThisTerm = thisHalfTerm && thisHalfTerm.lessons.includes(lessonNum);
    
    // Only show lessons that are already assigned to this half-term
    if (!isAssignedToThisTerm) return false;
    
    // Apply search filtering
    if (searchQuery) {
      const matchesSearch = 
        lessonNum.includes(searchQuery) || 
        (lessonData.title && lessonData.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        Object.values(lessonData.grouped).some(activities => 
          activities.some(activity => 
            activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  // Handle lesson selection
  const handleLessonSelection = (lessonNumber: string) => {
    setLocalSelectedLessons(prev => {
      if (prev.includes(lessonNumber)) {
        // Remove lesson if already selected
        return prev.filter(num => num !== lessonNumber);
      } else {
        // Add lesson if not selected
        return [...prev, lessonNumber];
      }
    });
  };

  // Handle save
  const handleSave = () => {
    onSave(showHalfTermView ? orderedLessons : localSelectedLessons, isComplete);
    onClose();
  };

  // Toggle completion status
  const toggleComplete = () => {
    setIsComplete(!isComplete);
  };

  // Handle lesson reordering
  const handleReorderLessons = (dragIndex: number, hoverIndex: number) => {
    const draggedLesson = orderedLessons[dragIndex];
    const newOrderedLessons = [...orderedLessons];
    newOrderedLessons.splice(dragIndex, 1);
    newOrderedLessons.splice(hoverIndex, 0, draggedLesson);
    setOrderedLessons(newOrderedLessons);
  };

  // Handle export PDF - FIXED VERSION
  const handleExportPDF = () => {
    // Don't call onSave here - just show the print modal
    setShowPrintModal(true);
  };

  // Handle view lesson details
  const handleViewLessonDetails = (lessonNumber: string) => {
    setSelectedLessonForDetails(lessonNumber);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div 
          className="p-6 text-white relative"
          style={{ 
            background: `linear-gradient(135deg, ${halfTermColor} 0%, ${halfTermColor}99 100%)` 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{halfTermName} - {halfTermMonths}</h2>
              <p className="text-white text-opacity-90">
                {showHalfTermView 
                  ? `${orderedLessons.length} lessons in this half-term` 
                  : 'Manage lessons assigned to this half-term'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Mark Complete Checkbox */}
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium">Mark Complete</span>
                <button
                  onClick={toggleComplete}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    isComplete 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white bg-opacity-50 text-transparent'
                  }`}
                >
                  {isComplete && <CheckCircle className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Export PDF Button - Single Click */}
              {showHalfTermView && orderedLessons.length > 0 && (
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  title="Export PDF"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium">Export PDF</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  if (showHalfTermView) {
                    setShowHalfTermView(false);
                  } else {
                    setShowHalfTermView(true);
                    setOrderedLessons([...localSelectedLessons]);
                  }
                }}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {showHalfTermView ? (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>View All Lessons</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    <span>Half-Term View</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showHalfTermView && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {showHalfTermView ? (
            /* Half-term view - ordered lessons */
            <HalfTermView
              halfTermId={halfTermId}
              halfTermName={halfTermName}
              halfTermColor={halfTermColor}
              orderedLessons={orderedLessons}
              isComplete={isComplete}
              onReorderLessons={handleReorderLessons}
              onRemoveLesson={(lessonNumber) => {
                const newOrderedLessons = orderedLessons.filter(num => num !== lessonNumber);
                setOrderedLessons(newOrderedLessons);
                setLocalSelectedLessons(prev => prev.filter(num => num !== lessonNumber));
              }}
              onViewLessonDetails={handleViewLessonDetails}
              onPrintHalfTerm={() => setShowPrintModal(true)}
            />
          ) : (
            /* Lesson selection view */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Manage Lessons for {halfTermName}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage lessons assigned to this half-term. Click lessons to remove them from this half-term.
                  {filteredLessons.length === 0 ? ' No lessons assigned to this half-term yet.' : ''}
                </p>
              </div>

              {filteredLessons.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Tag className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Lessons Assigned</h3>
                  <p className="text-gray-600">
                    {searchQuery 
                      ? 'No assigned lessons match your search criteria.' 
                      : 'No lessons have been assigned to this half-term yet. Use the Lesson Library to assign lessons to half-terms.'}
                  </p>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLessons.map((lessonNum, index) => {
                    const lessonData = allLessonsData[lessonNum];
                    if (!lessonData) return null;
                    
                    const isSelected = localSelectedLessons.includes(lessonNum);
                    
                    return (
                      <div 
                        key={lessonNum}
                        className={`bg-white rounded-lg border p-4 cursor-pointer transition-all duration-200 relative ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-red-300 bg-red-50 hover:border-red-400'
                        }`}
                        onClick={() => handleLessonSelection(lessonNum)}
                      >
                        {/* Star icon for selection (filled = assigned, empty = will be removed) */}
                        <div className="absolute top-2 right-2">
                          <Star className={`h-5 w-5 ${isSelected ? 'text-blue-500 fill-blue-500' : 'text-red-400 fill-red-400'}`} />
                        </div>
                        <div className="pr-6">
                          {/* FIXED: Show sequential lesson number instead of actual lesson number */}
                          <h4 className="font-semibold text-gray-900 mb-1">Lesson {index + 1}</h4>
                          {/* FIXED: Also update the fallback title to use sequential numbering */}
                          <p className="text-sm text-gray-600 mb-2">{lessonData.title || `Lesson ${index + 1}`}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                            <Clock className="h-3 w-3" />
                            <span>{lessonData.totalTime} mins</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {lessonData.categoryOrder.slice(0, 3).map(category => (
                              <span 
                                key={category}
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {category}
                              </span>
                            ))}
                            {lessonData.categoryOrder.length > 3 && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{lessonData.categoryOrder.length - 3}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewLessonDetails(lessonNum);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View Details</span>
                            </button>
                          </div>
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
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">
              {showHalfTermView 
                ? `${orderedLessons.length} lessons in order` 
                : `${localSelectedLessons.length} lessons will remain assigned`}
            </span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save {showHalfTermView ? 'Order' : 'Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Details Modal */}
      {selectedLessonForDetails && (
        <LessonDetailsModal
          lessonNumber={selectedLessonForDetails}
          onClose={() => setSelectedLessonForDetails(null)}
          theme={theme}
          halfTermId={halfTermId}
          halfTermName={halfTermName}
        />
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <LessonPrintModal
          lessonNumbers={orderedLessons}
          onClose={() => setShowPrintModal(false)}
          halfTermId={halfTermId}
          halfTermName={halfTermName}
          isUnitPrint={true}
        />
      )}
    </div>
  );
}