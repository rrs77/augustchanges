import React, { useState } from 'react';
import { Clock, Users, Tag, Star, Eye, Calendar, Edit3 } from 'lucide-react';
import type { LessonData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { AssignToHalfTermModal } from './AssignToHalfTermModal';

interface HalfTerm {
  id: string;
  name: string;
  months: string;
}

interface LessonLibraryCardProps {
  lessonNumber: string;
  displayNumber: number;
  lessonData: LessonData;
  viewMode: 'grid' | 'list' | 'compact';
  onClick: () => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  onAssignToUnit?: (lessonNumber: string, halfTermId: string) => void;
  halfTerms?: HalfTerm[];
  onEdit?: () => void;
}

export function LessonLibraryCard({
  lessonNumber,
  displayNumber,
  lessonData,
  viewMode,
  onClick,
  onEdit,
  theme,
  onAssignToUnit,
  halfTerms = []
}: LessonLibraryCardProps) {
  // Debug console log
  console.log('DEBUG - LessonLibraryCard received onEdit:', {
    lessonNumber,
    onEdit: typeof onEdit,
    onEditExists: !!onEdit
  });

  const { getCategoryColor } = useSettings();
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Calculate total activities
  const totalActivities = React.useMemo(() => {
    try {
      if (!lessonData || !lessonData.grouped) return 0;
      return Object.values(lessonData.grouped).reduce(
        (sum, activities) => sum + (Array.isArray(activities) ? activities.length : 0),
        0
      );
    } catch (error) {
      console.error('Error calculating total activities:', error);
      return 0;
    }
  }, [lessonData]);

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowAssignModal(true);
  };

  const handleAssignToHalfTerm = (halfTermId: string) => {
    if (onAssignToUnit) {
      onAssignToUnit(lessonNumber, halfTermId);
      setShowAssignModal(false);
    }
  };

  if (viewMode === 'compact') {
    return (
      <div className="relative group">
        <div 
          className="bg-white rounded-lg shadow-sm border-l-4 p-3 transition-all duration-200 hover:shadow-md cursor-pointer h-full"
          style={{ borderLeftColor: theme.primary }}
          onClick={onClick}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm truncate" dir="ltr">{lessonData.title || `Lesson ${displayNumber}`}</h4>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{lessonData.totalTime} mins</span>
                <span>•</span>
                <span>{totalActivities} activities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons - Assign and Edit buttons */}
        {((onAssignToUnit && halfTerms.length > 0) || onEdit) && (
          <div className="absolute top-0 right-0 h-full flex items-center pr-2">
            <div className="flex items-center space-x-2">
              {onAssignToUnit && halfTerms.length > 0 && (
                <button
                  onClick={handleAssignClick}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                  title="Assign to Unit"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Assign</span>
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                  title="Edit lesson activities"
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="text-xs">Edit</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && (
          <AssignToHalfTermModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onAssign={handleAssignToHalfTerm}
            lessonNumber={displayNumber.toString()}
            halfTerms={halfTerms}
          />
        )}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="relative group">
        <div 
          className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg cursor-pointer hover:border-blue-300"
          onClick={onClick}
        >
          <div className="flex items-start">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mr-4"
              style={{ backgroundColor: theme.primary }}
            >
              {displayNumber}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 text-base truncate" dir="ltr">{lessonData.title || `Lesson ${displayNumber}`}</h4>
              </div>
              
              <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{lessonData.totalTime} mins</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{totalActivities} activities</span>
                </div>
              </div>
              
              <p className="mt-2 text-sm text-gray-600 line-clamp-1" dir="ltr">
                {lessonData.description || ''}
              </p>
            </div>
          </div>
        </div>
        
        {/* Action buttons - Assign and Edit buttons */}
        {((onAssignToUnit && halfTerms.length > 0) || onEdit) && (
          <div className="absolute top-2 right-2 flex items-center space-x-2">
            {onAssignToUnit && halfTerms.length > 0 && (
              <button
                onClick={handleAssignClick}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                title="Assign to Unit"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Assign</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                title="Edit Lesson"
              >
                <Edit3 className="h-4 w-4" />
                <span className="text-xs">Edit</span>
              </button>
            )}
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && (
          <AssignToHalfTermModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onAssign={handleAssignToHalfTerm}
            lessonNumber={displayNumber.toString()}
            halfTerms={halfTerms}
          />
        )}
      </div>
    );
  }

  // Default grid view
  return (
    <div className="relative group">
      <div 
        className="bg-white rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden hover:scale-[1.02] h-full flex flex-col"
        style={{ borderColor: theme.primary, borderWidth: '1px' }}
        onClick={onClick}
      >
        {/* Colorful Header */}
        <div 
          className="p-4 text-white relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
          }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">
                Lesson {displayNumber}
              </h3>
            </div>
            <p className="text-white text-opacity-90 text-sm font-medium" dir="ltr">
              {lessonData.title || `Lesson ${displayNumber}`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-grow flex flex-col">
          <div className="flex items-center space-x-4 text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{lessonData.totalTime} mins</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">{totalActivities} activities</span>
            </div>
          </div>
          
          {/* Categories */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {lessonData.categoryOrder.slice(0, 4).map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 rounded-full text-sm font-medium border shadow-sm"
                  style={{
                    backgroundColor: `${getCategoryColor(category)}20`,
                    color: getCategoryColor(category),
                    borderColor: `${getCategoryColor(category)}40`
                  }}
                >
                  {category}
                </span>
              ))}
              {lessonData.categoryOrder.length > 4 && (
                <span className="px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
                  +{lessonData.categoryOrder.length - 4} more
                </span>
              )}
            </div>
          </div>
          
          {/* Description Preview */}
          <p className="mt-2 text-sm text-gray-600 line-clamp-1" dir="ltr">
            {lessonData.description || ''}
          </p>
        </div>
        
        {/* Action buttons - Assign and Edit buttons */}
        {((onAssignToUnit && halfTerms.length > 0) || onEdit) && (
          <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
            {onAssignToUnit && halfTerms.length > 0 && (
              <button
                onClick={handleAssignClick}
                className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-sm text-blue-600 hover:text-blue-800 transition-colors"
                title="Assign to Unit"
              >
                <Calendar className="h-4 w-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-sm text-green-600 hover:text-green-800 transition-colors"
                title="Edit Lesson"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignToHalfTermModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignToHalfTerm}
          lessonNumber={displayNumber.toString()}
          halfTerms={halfTerms}
        />
      )}
    </div>
  );
}