import React from 'react';
import { Calendar, Clock, X, Eye, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { jsPDF } from 'jspdf';

interface HalfTermViewProps {
  halfTermId: string;
  halfTermName: string;
  halfTermColor: string;
  orderedLessons: string[];
  isComplete: boolean;
  onReorderLessons: (dragIndex: number, hoverIndex: number) => void;
  onRemoveLesson: (lessonNumber: string) => void;
  onViewLessonDetails: (lessonNumber: string) => void;
  onPrintHalfTerm?: () => void;
}

export function HalfTermView({
  halfTermId,
  halfTermName,
  halfTermColor,
  orderedLessons,
  isComplete,
  onReorderLessons,
  onRemoveLesson,
  onViewLessonDetails,
  onPrintHalfTerm
}: HalfTermViewProps) {
  const { allLessonsData, currentSheetInfo } = useData();
  const { getThemeForClass, getCategoryColor } = useSettings();
  const theme = getThemeForClass('LKG'); // Default theme

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-4 mb-6 ${
        isComplete 
          ? 'bg-green-50 border-green-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className={`h-5 w-5 ${isComplete ? 'text-green-600' : 'text-blue-600'}`} />
            <h3 className="font-medium text-gray-900">{halfTermName} {isComplete ? 'Complete' : 'In Progress'}</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Drag and drop lessons to reorder them for this half-term
        </p>
      </div>

      {/* Printable content */}
      <div className="print-content">
        {orderedLessons.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons selected</h3>
            <p className="text-gray-600">
              Select lessons from the library to add to this half-term
            </p>
          </div>
        ) : (
          <>
            {/* Print-only header */}
            <div className="hidden print:block text-center border-b border-gray-200 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {currentSheetInfo.display} Half-Term Plan
              </h1>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {halfTermName}
              </h2>
              <div className="text-gray-600 font-medium">
                {orderedLessons.length} lessons
              </div>
              
              {/* Page number */}
              <div className="absolute top-0 right-0 text-xs text-gray-500">
                Page <span className="pageNumber"></span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:gap-2">
              {orderedLessons.map((lessonNum, index) => {
                const lessonData = allLessonsData[lessonNum];
                if (!lessonData) return null;
                
                return (
                  <div 
                    key={lessonNum} 
                    className="bg-white rounded-lg shadow-md border border-gray-200 p-4 print-activity"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', index.toString());
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      onReorderLessons(dragIndex, index);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {/* FIXED: Show sequential lesson number instead of actual lesson number */}
                      <h4 className="font-semibold text-gray-900">Lesson {index + 1}</h4>
                      <div className="flex items-center print:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveLesson(lessonNum);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {/* FIXED: Also update the fallback title to use sequential numbering */}
                    <p className="text-sm text-gray-600 mb-2">{lessonData.title || `Lesson ${index + 1}`}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>{lessonData.totalTime} mins</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {lessonData.categoryOrder.slice(0, 2).map(category => (
                        <span 
                          key={category}
                          className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                      {lessonData.categoryOrder.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{lessonData.categoryOrder.length - 2}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 print:hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewLessonDetails(lessonNum);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View Details</span>
                      </button>
                    </div>
                    <div className="mt-auto pt-2 flex items-center justify-end space-x-1">
                      {index > 0 && (
                        <button
                          onClick={() => onReorderLessons(index, index - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                      )}
                      {index < orderedLessons.length - 1 && (
                        <button
                          onClick={() => onReorderLessons(index, index + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Print-only footer */}
            <div className="hidden print:block mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>Curriculum Designer - {currentSheetInfo.display} - {halfTermName}</p>
              <p className="pageNumber">Page 1</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}