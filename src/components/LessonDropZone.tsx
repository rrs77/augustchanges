import React, { useRef, useState } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { 
  Plus, 
  Clock, 
  Users, 
  FileText, 
  GripVertical, 
  Trash2,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { ActivityDetails } from './ActivityDetails'; // Import the modal component
import { useData } from '../contexts/DataContext'; // Import to access updateActivity
import type { Activity } from '../contexts/DataContext';

interface LessonPlan {
  id: string;
  date: Date;
  week: number;
  className: string;
  activities: Activity[];
  duration: number;
  notes: string;
  status: 'planned' | 'completed' | 'cancelled';
}

interface LessonDropZoneProps {
  lessonPlan: LessonPlan;
  onActivityAdd: (activity: Activity) => void;
  onActivityRemove: (index: number) => void;
  onActivityReorder: (dragIndex: number, hoverIndex: number) => void;
  onNotesUpdate: (notes: string) => void;
  onLessonPlanFieldUpdate: (field: string, value: any) => void; // NEW: Add this for lesson naming
  isEditing: boolean;
  onSave?: () => void; // NEW: Add save lesson functionality
}

interface DraggableActivityProps {
  activity: Activity;
  index: number;
  onRemove: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  isEditing: boolean;
  onActivityClick: (activity: Activity) => void; // NEW: Add click handler prop
}

function DraggableActivity({ 
  activity, 
  index, 
  onRemove, 
  onReorder, 
  isEditing,
  onActivityClick // NEW: Receive click handler
}: DraggableActivityProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragStarted, setIsDragStarted] = useState(false);

  const [{ handlerId }, drop] = useDrop({
    accept: 'lesson-activity',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onReorder(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'lesson-activity',
    item: () => {
      setIsDragStarted(true);
      return { index };
    },
    end: () => {
      // Reset drag state after a delay to prevent click from firing
      setTimeout(() => setIsDragStarted(false), 100);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  // NEW: Handle activity click with drag prevention
  const handleActivityClick = (e: React.MouseEvent) => {
    // Prevent click if we just finished dragging
    if (isDragStarted) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Prevent click if target is a button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    e.stopPropagation();
    onActivityClick(activity);
  };

  const categoryColors: Record<string, string> = {
    'Welcome': '#F59E0B',
    'Kodaly Songs': '#8B5CF6',
    'Kodaly Action Songs': '#F97316',
    'Action/Games Songs': '#F97316',
    'Rhythm Sticks': '#D97706',
    'Scarf Songs': '#10B981',
    'General Game': '#3B82F6',
    'Core Songs': '#84CC16',
    'Parachute Games': '#EF4444',
    'Percussion Games': '#06B6D4',
    'Teaching Units': '#6366F1',
    'Goodbye': '#14B8A6'
  };

  const categoryColor = categoryColors[activity.category] || '#6B7280';

  return (
    <div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className="bg-white rounded-lg border-2 border-gray-200 p-4 transition-all duration-200 hover:shadow-md group cursor-pointer"
      onClick={handleActivityClick} // NEW: Add click handler
    >
      <div className="flex items-start space-x-3">
        {isEditing && (
          <div className="flex flex-col space-y-1 pt-1">
            <div className="cursor-move text-gray-400 hover:text-gray-600">
              <GripVertical className="h-5 w-5" />
            </div>
          </div>
        )}
        
        <div 
          className="w-1 h-full rounded-full flex-shrink-0"
          style={{ backgroundColor: categoryColor, minHeight: '60px' }}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-base leading-tight">
                {activity.activity}
              </h4>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-600">{activity.category}</span>
                {activity.level && (
                  <span 
                    className="px-2 py-1 text-white text-xs font-medium rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {activity.level}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-3">
              {activity.time > 0 && (
                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{activity.time}m</span>
                </div>
              )}
              

              
              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200 opacity-0 group-hover:opacity-100"
                  title="Remove Activity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {activity.description && (
            <div 
              className="text-sm text-gray-600 leading-relaxed line-clamp-2"
              dangerouslySetInnerHTML={{ __html: activity.description }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function LessonDropZone({
  lessonPlan,
  onActivityAdd,
  onActivityRemove,
  onActivityReorder,
  onNotesUpdate,
  onLessonPlanFieldUpdate, // NEW: Add this prop
  isEditing,
  onSave // NEW: Add save functionality
}: LessonDropZoneProps) {
  // NEW: Add modal state management and activity editing
  const { updateActivity, deleteActivity } = useData(); // Access data context functions
  const [selectedActivityDetails, setSelectedActivityDetails] = useState<Activity | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [initialResource, setInitialResource] = useState<{url: string, title: string, type: string} | null>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'activity',
    drop: (item: { activity: Activity }) => {
      onActivityAdd(item.activity);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // NEW: Handle activity click to open modal
  const handleViewActivityDetails = (activity: Activity, initialResource?: {url: string, title: string, type: string}) => {
    setSelectedActivityDetails(activity);
    if (initialResource) {
      setInitialResource(initialResource);
    } else {
      setInitialResource(null);
    }
  };

  // NEW: Handle activity update
  const handleActivityUpdate = async (updatedActivity: Activity) => {
    try {
      // Convert any "EYFS U" levels to "UKG"
      if (updatedActivity.level === "EYFS U") {
        updatedActivity.level = "UKG";
      }
      
      await updateActivity(updatedActivity);
      setEditingActivity(null);
      setSelectedActivityDetails(null);
    } catch (error) {
      console.error('Failed to update activity:', error);
      alert('Failed to update activity. Please try again.');
    }
  };

  // NEW: Handle edit activity - this enables edit mode
  const handleEditActivity = () => {
    if (selectedActivityDetails) {
      // Convert any "EYFS U" levels to "UKG"
      const activity = { ...selectedActivityDetails };
      if (activity.level === "EYFS U") {
        activity.level = "UKG";
      }
      
      setEditingActivity(activity);
    }
  };

  // NEW: Handle resource click
  const handleResourceClick = (url: string, title: string, type: string) => {
    setInitialResource({url, title, type});
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {/* Lesson Name Input */}
              <input
                type="text"
                value={lessonPlan.title || ''}
                onChange={(e) => onLessonPlanFieldUpdate('title', e.target.value)}
                placeholder="Lesson Name"
                className="w-full text-2xl font-bold text-white border-b border-white border-opacity-30 focus:border-opacity-100 focus:outline-none bg-transparent placeholder-green-100"
              />
              <div className="flex items-center flex-wrap gap-3 mt-2">
                <div className="flex items-center space-x-2 text-green-100">
                  <span>{lessonPlan.className}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-green-100">
                  <Clock className="h-4 w-4" />
                  <span>{lessonPlan.duration} minutes</span>
                </div>
                
                <div className="flex items-center space-x-2 text-green-100">
                  <Users className="h-4 w-4" />
                  <span>{lessonPlan.activities.length} activities</span>
                </div>
              </div>
            </div>
            
            {/* NEW: Save Lesson Button */}
            {onSave && (
              <button
                onClick={onSave}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md ml-4"
              >
                <Save className="h-4 w-4" />
                <span>Save Lesson</span>
              </button>
            )}
          </div>
        </div>

        {/* Drop Zone */}
        <div
          ref={drop}
          className={`p-6 min-h-[400px] transition-colors duration-200 ${
            isOver ? 'bg-blue-50 border-blue-300' : ''
          }`}
        >
          {lessonPlan.activities.length === 0 ? (
            <div className="text-center py-16">
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-colors duration-200 ${
                isOver ? 'bg-blue-200' : 'bg-gray-100'
              }`}>
                <Plus className={`h-12 w-12 transition-colors duration-200 ${
                  isOver ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isOver ? 'Drop activity here' : 'No activities planned'}
              </h3>
              <p className="text-gray-600">
                {isOver 
                  ? 'Release to add this activity to your lesson plan'
                  : 'Drag activities from the library to build your lesson plan'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lessonPlan.activities.map((activity, index) => (
                <DraggableActivity
                  key={`${activity.activity}-${index}`}
                  activity={activity}
                  index={index}
                  onRemove={() => onActivityRemove(index)}
                  onReorder={onActivityReorder}
                  isEditing={isEditing}
                  onActivityClick={handleViewActivityDetails} // NEW: Pass click handler
                />
              ))}
              
              {isEditing && (
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                  isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <Plus className={`h-8 w-8 mx-auto mb-2 transition-colors duration-200 ${
                    isOver ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className={`font-medium transition-colors duration-200 ${
                    isOver ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {isOver ? 'Drop to add activity' : 'Drag more activities here'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Lesson Notes</h3>
          </div>
          
          {isEditing ? (
            <textarea
              value={lessonPlan.notes}
              onChange={(e) => onNotesUpdate(e.target.value)}
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              placeholder="Add notes about this lesson plan..."
            />
          ) : (
            <div className="text-gray-700">
              {lessonPlan.notes ? (
                <p className="whitespace-pre-wrap">{lessonPlan.notes}</p>
              ) : (
                <p className="text-gray-500 italic">No notes added yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NEW: Activity Details Modal */}
      {selectedActivityDetails && (
        <ActivityDetails
          activity={selectedActivityDetails}
          onClose={() => {
            setSelectedActivityDetails(null);
            setEditingActivity(null);
            setInitialResource(null);
          }}
          onAddToLesson={undefined} // No "Add to Lesson" button needed - already in lesson
          isEditing={editingActivity !== null && selectedActivityDetails === editingActivity}
          onUpdate={handleActivityUpdate}
          onEdit={handleEditActivity} // This should trigger edit mode
          initialResource={initialResource}
          onDelete={deleteActivity}
        />
      )}
    </>
  );
}