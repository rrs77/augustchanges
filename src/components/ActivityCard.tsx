import React, { useState, useRef, useEffect } from 'react';
import { 
  Clock, 
  Video, 
  Music, 
  FileText, 
  Link as LinkIcon, 
  Image, 
  Volume2, 
  Save, 
  X, 
  GripVertical,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useDrag } from 'react-dnd';
import { RichTextEditor } from './RichTextEditor';
import type { Activity } from '../contexts/DataContext';

interface ActivityCardProps {
  activity: Activity;
  onUpdate?: (updatedActivity: Activity) => void;
  onDelete?: (activityId: string) => void;
  onDuplicate?: (activity: Activity) => void;
  isEditing?: boolean;
  onEditToggle?: () => void;
  categoryColor?: string;
  viewMode?: 'compact' | 'detailed' | 'minimal';
  onResourceClick?: (url: string, title: string, type: string) => void;
  onActivityClick?: (activity: Activity) => void;
  draggable?: boolean;
}

// Character limit for truncated description
const DESCRIPTION_CHAR_LIMIT = 150;

export function ActivityCard({ 
  activity, 
  onUpdate, 
  onDelete, 
  onDuplicate, 
  isEditing = false, 
  onEditToggle,
  categoryColor,
  viewMode = 'detailed',
  onResourceClick,
  onActivityClick,
  draggable = false
}: ActivityCardProps) {
  const { getCategoryColor } = useSettings();
  const [editedActivity, setEditedActivity] = useState<Activity>(activity);
  const [showResources, setShowResources] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Set up drag and drop
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'activity',
    item: { activity },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: () => draggable
  }), [activity, draggable]);
  
  useEffect(() => {
    setEditedActivity(activity);
  }, [activity]);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedActivity);
    }
    if (onEditToggle) {
      onEditToggle();
    }
  };

  const handleCancel = () => {
    setEditedActivity(activity);
    if (onEditToggle) {
      onEditToggle();
    }
  };

  // Format description with line breaks
  const formatDescription = (text: string) => {
    if (!text) return '';
    
    // If already HTML, return as is
    if (text.includes('<')) {
      return text;
    }
    
    // Replace newlines with <br> tags
    return text.replace(/\n/g, '<br>');
  };

  // Check if description is long enough to truncate
  const isDescriptionLong = activity.description && 
    (activity.description.length > DESCRIPTION_CHAR_LIMIT || 
     activity.description.includes('\n') || 
     activity.description.includes('<br>') ||
     activity.description.includes('<li>'));

  // Get truncated description
  const getTruncatedDescription = () => {
    if (!activity.description) return '';
    
    // If it's HTML, try to extract text
    if (activity.description.includes('<')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = activity.description;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      return textContent.substring(0, DESCRIPTION_CHAR_LIMIT) + (textContent.length > DESCRIPTION_CHAR_LIMIT ? '...' : '');
    }
    
    // Otherwise just truncate the text
    return activity.description.substring(0, DESCRIPTION_CHAR_LIMIT) + 
           (activity.description.length > DESCRIPTION_CHAR_LIMIT ? '...' : '');
  };

  const resources = [
    { label: 'Video', url: activity.videoLink, icon: Video, color: 'text-red-600 bg-red-50 border-red-200', type: 'video' },
    { label: 'Music', url: activity.musicLink, icon: Music, color: 'text-green-600 bg-green-50 border-green-200', type: 'music' },
    { label: 'Backing', url: activity.backingLink, icon: Volume2, color: 'text-blue-600 bg-blue-50 border-blue-200', type: 'backing' },
    { label: 'Resource', url: activity.resourceLink, icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-200', type: 'resource' },
    { label: 'Link', url: activity.link, icon: LinkIcon, color: 'text-gray-600 bg-gray-50 border-gray-200', type: 'link' },
    { label: 'Vocals', url: activity.vocalsLink, icon: Volume2, color: 'text-orange-600 bg-orange-50 border-orange-200', type: 'vocals' },
    { label: 'Image', url: activity.imageLink, icon: Image, color: 'text-pink-600 bg-pink-50 border-pink-200', type: 'image' },
  ].filter(resource => resource.url && resource.url.trim());

  // Get category color from context or use provided color
  const cardColor = getCategoryColor(activity.category) || categoryColor || '#6B7280';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on a button or link
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    
    if (onActivityClick) {
      onActivityClick(activity);
    } else if (isDescriptionLong) {
      setIsExpanded(!isExpanded);
    }
  };

  if (viewMode === 'minimal') {
    return (
      <div
        ref={draggable ? drag : undefined}
        className={`bg-white rounded-lg shadow-sm border-l-4 p-3 transition-all duration-200 hover:shadow-md ${draggable ? 'cursor-move' : 'cursor-pointer'} h-full ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ borderLeftColor: cardColor }}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate" dir="ltr">{activity.activity}</h4>
            <p className="text-xs text-gray-500" dir="ltr">{activity.category}</p>
          </div>
          {activity.time > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2">
              {activity.time}m
            </span>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div
        ref={draggable ? drag : undefined}
        className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${draggable ? 'cursor-move' : 'cursor-pointer'} ${
          isEditing ? 'ring-4 ring-blue-300' : 'border-gray-200 hover:border-gray-300'
        } ${isDragging ? 'opacity-50' : ''} h-full flex flex-col`}
        style={{ borderLeftColor: cardColor, borderLeftWidth: '6px' }}
        onClick={handleCardClick}
      >
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900 text-base leading-tight" dir="ltr">{activity.activity}</h4>
            <div className="flex items-center space-x-1 ml-2">
              {activity.time > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {activity.time}m
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2" dir="ltr">{activity.category}</p>
          
          {activity.level && (
            <span 
              className="inline-block px-2 py-1 text-white text-xs font-medium rounded-full"
              style={{ backgroundColor: cardColor }}
            >
              {activity.level}
            </span>
          )}
          
          <div className="mt-auto">
            {resources.length > 0 && (
              <div className="flex items-center space-x-1 mt-2">
                {resources.slice(0, 3).map((resource, index) => {
                  const IconComponent = resource.icon;
                  return (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onResourceClick) onResourceClick(resource.url, `${activity.activity} - ${resource.label}`, resource.type);
                      }}
                      className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <IconComponent className="h-3 w-3 text-gray-600" />
                    </button>
                  );
                })}
                {resources.length > 3 && (
                  <span className="text-xs text-gray-500">+{resources.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Detailed view (default)
  return (
    <div
      ref={draggable ? drag : undefined}
      className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${draggable ? 'cursor-move' : 'cursor-pointer'} overflow-hidden ${
        isEditing ? 'ring-4 ring-blue-300' : 'border-gray-200 hover:border-gray-300'
      } ${isDragging ? 'opacity-50' : ''} h-full flex flex-col`}
      style={{ borderLeftColor: cardColor, borderLeftWidth: '6px' }}
      onClick={handleCardClick}
    >
      {/* Card Header */}
      <div 
        className="p-4 text-white relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}CC 100%)` 
        }}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editedActivity.activity}
                  onChange={(e) => setEditedActivity(prev => ({ ...prev, activity: e.target.value }))}
                  className="w-full bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 border border-white border-opacity-30 rounded-lg px-3 py-2 text-lg font-bold"
                  placeholder="Activity name"
                  onClick={(e) => e.stopPropagation()}
                  dir="ltr"
                />
              ) : (
                <h3 className="text-lg font-bold leading-tight" dir="ltr">{activity.activity}</h3>
              )}
              
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-sm opacity-90" dir="ltr">{activity.category}</span>
                {activity.level && (
                  <span className="px-2 py-1 bg-white bg-opacity-20 text-xs font-medium rounded-full">
                    {activity.level}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-3">
              {activity.time > 0 && (
                <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{activity.time}m</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Description */}
        <div className="mb-4 flex-grow">
          {isEditing ? (
            <div onClick={(e) => e.stopPropagation()}>
              <RichTextEditor
                value={editedActivity.description}
                onChange={(value) => setEditedActivity(prev => ({ ...prev, description: value }))}
                placeholder="Enter activity description..."
                minHeight="100px"
              />
            </div>
          ) : (
            <>
              {isDescriptionLong && !isExpanded ? (
                <div>
                  <div className="text-gray-700 leading-relaxed line-clamp-3" dir="ltr">
                    {getTruncatedDescription()}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(true);
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span>Show more</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div 
                    className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatDescription(activity.description) }}
                    dir="ltr"
                  />
                  {isDescriptionLong && isExpanded && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(false);
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                    >
                      <ChevronUp className="h-4 w-4" />
                      <span>Show less</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Unit Name */}
        {(activity.unitName || isEditing) && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Unit
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedActivity.unitName}
                onChange={(e) => setEditedActivity(prev => ({ ...prev, unitName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Unit name"
                onClick={(e) => e.stopPropagation()}
                dir="ltr"
              />
            ) : (
              <p className="text-sm text-gray-700 font-medium" dir="ltr">{activity.unitName}</p>
            )}
          </div>
        )}

        {/* EYFS Standards */}
        {activity.eyfsStandards && activity.eyfsStandards.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center space-x-1">
              <Tag className="h-3 w-3" />
              <span>EYFS</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {activity.eyfsStandards.slice(0, 2).map((standard, index) => (
                <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full" dir="ltr">
                  {standard.split(':')[1] || standard}
                </span>
              ))}
              {activity.eyfsStandards.length > 2 && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                  +{activity.eyfsStandards.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Resources */}
        {(showResources || isEditing || resources.length > 0) && (
          <div className="space-y-3 mt-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Resources</h4>
              {!isEditing && resources.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowResources(!showResources);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showResources ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                {[
                  { key: 'videoLink', label: 'Video', icon: Video },
                  { key: 'musicLink', label: 'Music', icon: Music },
                  { key: 'backingLink', label: 'Backing', icon: Volume2 },
                  { key: 'resourceLink', label: 'Resource', icon: FileText },
                  { key: 'link', label: 'Link', icon: LinkIcon },
                  { key: 'vocalsLink', label: 'Vocals', icon: Volume2 },
                  { key: 'imageLink', label: 'Image', icon: Image },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <input
                      type="url"
                      value={editedActivity[key as keyof Activity] as string}
                      onChange={(e) => setEditedActivity(prev => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder={`${label} URL`}
                      dir="ltr"
                    />
                  </div>
                ))}
              </div>
            ) : (
              showResources && (
                <div className="grid grid-cols-2 gap-2">
                  {resources.map((resource, index) => {
                    const IconComponent = resource.icon;
                    return (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onResourceClick) {
                            onResourceClick(resource.url, `${activity.activity} - ${resource.label}`, resource.type);
                          }
                        }}
                        className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-sm ${resource.color}`}
                      >
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate" dir="ltr">{resource.label}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}

        {/* Edit Actions */}
        {isEditing && onEditToggle && (
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}