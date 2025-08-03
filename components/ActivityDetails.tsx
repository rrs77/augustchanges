import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, Video, Music, FileText, Link as LinkIcon, Image, Volume2, Maximize2, Minimize2, ExternalLink, Tag, Plus, Save, Upload, Edit3, Check, Trash2 } from 'lucide-react';
import { EditableText } from './EditableText';
import { RichTextEditor } from './RichTextEditor';
import { LinkViewer } from './LinkViewer';
import type { Activity } from '../contexts/DataContext';
import { useData } from '../contexts/DataContext';

interface ActivityDetailsProps {
  activity: Activity;
  onClose: () => void;
  onAddToLesson?: () => void;
  isEditing?: boolean;
  onUpdate?: (updatedActivity: Activity) => void;
  initialResource?: {url: string, title: string, type: string} | null;
  onDelete?: (activityId: string) => void;
}

export function ActivityDetails({ 
  activity, 
  onClose, 
  onAddToLesson,
  isEditing = false,
  onUpdate,
  initialResource = null,
  onDelete
}: ActivityDetailsProps) {
  const { allEyfsStatements, eyfsStatements, addEyfsToLesson, removeEyfsFromLesson } = useData();
  const [selectedLink, setSelectedLink] = useState<{ url: string; title: string; type: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEyfsSelector, setShowEyfsSelector] = useState(false);
  const [selectedEyfs, setSelectedEyfs] = useState<string[]>(activity.eyfsStandards || []);
  const [editedActivity, setEditedActivity] = useState<Activity>({...activity});
  const [isEditMode, setIsEditMode] = useState(isEditing);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Set the initial resource if provided
  useEffect(() => {
    if (initialResource) {
      setSelectedLink(initialResource);
    }
  }, [initialResource]);

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize edited activity when the component mounts or activity changes
  useEffect(() => {
    setEditedActivity({...activity});
    setSelectedEyfs(activity.eyfsStandards || []);
    setIsEditMode(isEditing);
  }, [activity, isEditing]);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...editedActivity,
        eyfsStandards: selectedEyfs
      });
    }
    setIsEditMode(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for demo purposes
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setEditedActivity(prev => ({
        ...prev,
        imageLink: imageUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      // Use the activity's ID instead of its name for deletion
      onDelete(activity._id || activity.id || '');
      onClose();
    }
    setShowDeleteConfirm(false);
  };

  const renderDescription = () => {
    if (isEditMode) {
      return (
        <RichTextEditor
          value={editedActivity.description}
          onChange={(value) => setEditedActivity(prev => ({ ...prev, description: value }))}
          placeholder="Enter activity description..."
          minHeight="150px"
        />
      );
    }
    
    if (activity.htmlDescription) {
      // Render HTML description with basic formatting
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: activity.htmlDescription }}
          dir="ltr"
        />
      );
    }
    
    // Render plain text with markdown-style formatting or HTML
    if (activity.description.includes('<')) {
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: activity.description }}
          dir="ltr"
        />
      );
    }
    
    // Format plain text with line breaks and basic markdown
    const formattedDescription = activity.description
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/\n/g, '<br>');
    
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: formattedDescription }}
        dir="ltr"
      />
    );
  };

  const renderActivityText = () => {
    if (isEditMode) {
      return (
        <RichTextEditor
          value={editedActivity.activityText || ''}
          onChange={(value) => setEditedActivity(prev => ({ ...prev, activityText: value }))}
          placeholder="Enter activity instructions..."
          minHeight="100px"
        />
      );
    }
    
    // If there's activity text, display it
    if (activity.activityText) {
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: activity.activityText }}
          dir="ltr"
        />
      );
    }
    
    return null; // Don't show anything if there's no activity text
  };

  const resources = [
    { label: 'Video', url: isEditMode ? editedActivity.videoLink : activity.videoLink, icon: Video, color: 'text-red-600 bg-red-50 border-red-200', type: 'video' },
    { label: 'Music', url: isEditMode ? editedActivity.musicLink : activity.musicLink, icon: Music, color: 'text-green-600 bg-green-50 border-green-200', type: 'music' },
    { label: 'Backing', url: isEditMode ? editedActivity.backingLink : activity.backingLink, icon: Volume2, color: 'text-blue-600 bg-blue-50 border-blue-200', type: 'backing' },
    { label: 'Resource', url: isEditMode ? editedActivity.resourceLink : activity.resourceLink, icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-200', type: 'resource' },
    { label: 'Link', url: isEditMode ? editedActivity.link : activity.link, icon: LinkIcon, color: 'text-gray-600 bg-gray-50 border-gray-200', type: 'link' },
    { label: 'Vocals', url: isEditMode ? editedActivity.vocalsLink : activity.vocalsLink, icon: Volume2, color: 'text-orange-600 bg-orange-50 border-orange-200', type: 'vocals' },
    { label: 'Image', url: isEditMode ? editedActivity.imageLink : activity.imageLink, icon: Image, color: 'text-pink-600 bg-pink-50 border-pink-200', type: 'image' },
  ].filter(resource => resource.url && resource.url.trim());

  const handleResourceClick = (resource: any) => {
    setSelectedLink({
      url: resource.url,
      title: `${activity.activity} - ${resource.label}`,
      type: resource.type
    });
  };

  const handleEyfsToggle = (eyfsStatement: string) => {
    if (selectedEyfs.includes(eyfsStatement)) {
      setSelectedEyfs(prev => prev.filter(s => s !== eyfsStatement));
      if (activity.lessonNumber) {
        removeEyfsFromLesson(activity.lessonNumber, eyfsStatement);
      }
    } else {
      setSelectedEyfs(prev => [...prev, eyfsStatement]);
      if (activity.lessonNumber) {
        addEyfsToLesson(activity.lessonNumber, eyfsStatement);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div 
          ref={containerRef}
          className={`bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden modal-content modal-responsive ${
            isFullscreen ? 'fixed inset-0 rounded-none max-w-none max-h-none' : ''
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              {isEditMode ? (
                <input
                  type="text"
                  value={editedActivity.activity}
                  onChange={(e) => setEditedActivity(prev => ({ ...prev, activity: e.target.value }))}
                  className="text-xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                  dir="ltr"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900">{activity.activity}</h2>
              )}
              <div className="flex items-center space-x-3 mt-1">
                {isEditMode ? (
                  <select
                    value={editedActivity.category}
                    onChange={(e) => setEditedActivity(prev => ({ ...prev, category: e.target.value }))}
                    className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1"
                    dir="ltr"
                  >
                    <option value="">Select Category</option>
                    <option value="Welcome">Welcome</option>
                    <option value="Kodaly Songs">Kodaly Songs</option>
                    <option value="Kodaly Action Songs">Kodaly Action Songs</option>
                    <option value="Action/Games Songs">Action/Games Songs</option>
                    <option value="Rhythm Sticks">Rhythm Sticks</option>
                    <option value="Scarf Songs">Scarf Songs</option>
                    <option value="General Game">General Game</option>
                    <option value="Core Songs">Core Songs</option>
                    <option value="Parachute Games">Parachute Games</option>
                    <option value="Percussion Games">Percussion Games</option>
                    <option value="Teaching Units">Teaching Units</option>
                    <option value="Goodbye">Goodbye</option>
                    <option value="Kodaly Rhythms">Kodaly Rhythms</option>
                    <option value="Kodaly Games">Kodaly Games</option>
                    <option value="IWB Games">IWB Games</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-600">{activity.category}</p>
                )}
                {activity.level && !isEditMode && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {activity.level}
                  </span>
                )}
                {isEditMode && (
                  <select
                    value={editedActivity.level}
                    onChange={(e) => setEditedActivity(prev => ({ ...prev, level: e.target.value }))}
                    className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1"
                    dir="ltr"
                  >
                    <option value="">Select Level</option>
                    <option value="All">All</option>
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="Reception">Reception</option>
                  </select>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditMode && onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete Activity"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              {!isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit Activity"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setShowEyfsSelector(!showEyfsSelector)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="EYFS Standards"
              >
                <Tag className="h-5 w-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* EYFS Standards Selector (conditionally shown) */}
            {showEyfsSelector && activity.lessonNumber && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-semibold text-blue-900 flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>EYFS Standards for this Activity</span>
                  </h3>
                  <button
                    onClick={() => setShowEyfsSelector(false)}
                    className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto p-2">
                  {allEyfsStatements.map(statement => (
                    <div 
                      key={statement}
                      className="flex items-center space-x-2 p-2 hover:bg-blue-100 rounded-lg cursor-pointer"
                      onClick={() => handleEyfsToggle(statement)}
                    >
                      <div className={`w-5 h-5 flex-shrink-0 rounded border ${
                        selectedEyfs.includes(statement)
                          ? 'bg-blue-600 border-blue-600 flex items-center justify-center'
                          : 'border-gray-300'
                      }`}>
                        {selectedEyfs.includes(statement) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-700" dir="ltr">{statement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time */}
            {(activity.time > 0 || isEditMode) && (
              <div className="flex items-center space-x-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="h-5 w-5 text-blue-600" />
                {isEditMode ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-900">Duration:</span>
                    <input
                      type="number"
                      value={editedActivity.time}
                      onChange={(e) => setEditedActivity(prev => ({ ...prev, time: parseInt(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      dir="ltr"
                    />
                    <span className="text-sm font-medium text-blue-900">minutes</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-blue-900">
                    Duration: {activity.time} minutes
                  </span>
                )}
              </div>
            )}

            {/* Activity Text - NEW FIELD */}
            {(editedActivity.activityText || isEditMode) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <EditableText 
                    id="activity-text-heading" 
                    fallback="Activity"
                  />
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  {renderActivityText()}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <EditableText 
                  id="activity-description-heading" 
                  fallback="Description"
                />
              </h3>
              <div className="text-gray-700 leading-relaxed">
                {renderDescription()}
              </div>
            </div>

            {/* Unit Name */}
            {(activity.unitName || isEditMode) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <EditableText 
                    id="activity-unit-heading" 
                    fallback="Unit"
                  />
                </h3>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedActivity.unitName}
                    onChange={(e) => setEditedActivity(prev => ({ ...prev, unitName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter unit name"
                    dir="ltr"
                  />
                ) : (
                  <p className="text-gray-700" dir="ltr">{activity.unitName}</p>
                )}
              </div>
            )}

            {/* EYFS Standards (if any) */}
            {selectedEyfs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span>EYFS Standards</span>
                </h3>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <ul className="space-y-2">
                    {selectedEyfs.map((standard, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700" dir="ltr">{standard}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Image Upload (only in edit mode) */}
            {isEditMode && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Image</h3>
                <div className="flex items-center space-x-4">
                  {editedActivity.imageLink ? (
                    <div className="relative">
                      <img 
                        src={editedActivity.imageLink} 
                        alt="Activity" 
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => setEditedActivity(prev => ({ ...prev, imageLink: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Upload an image for this activity or provide an image URL
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center space-x-1"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <input
                        type="url"
                        value={editedActivity.imageLink}
                        onChange={(e) => setEditedActivity(prev => ({ ...prev, imageLink: e.target.value }))}
                        placeholder="Or paste image URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <EditableText 
                  id="activity-resources-heading" 
                  fallback="Resources"
                />
              </h3>
              
              {isEditMode ? (
                <div className="space-y-4">
                  {[
                    { key: 'videoLink', label: 'Video URL', icon: Video },
                    { key: 'musicLink', label: 'Music URL', icon: Music },
                    { key: 'backingLink', label: 'Backing Track URL', icon: Volume2 },
                    { key: 'resourceLink', label: 'Resource URL', icon: FileText },
                    { key: 'link', label: 'Additional Link', icon: LinkIcon },
                    { key: 'vocalsLink', label: 'Vocals URL', icon: Volume2 },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <input
                        type="url"
                        value={editedActivity[key as keyof Activity] as string}
                        onChange={(e) => setEditedActivity(prev => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={label}
                        dir="ltr"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {resources.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {resources.map((resource, index) => {
                        const IconComponent = resource.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => handleResourceClick(resource)}
                            className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-sm ${resource.color}`}
                          >
                            <IconComponent className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium truncate" dir="ltr">{resource.label}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        <EditableText 
                          id="activity-no-resources-message" 
                          fallback="No additional resources available"
                        />
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
            {isEditMode ? (
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            ) : (
              <>
                {onAddToLesson && (
                  <button
                    onClick={onAddToLesson}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Lesson</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <EditableText 
                    id="activity-close-button" 
                    fallback="Close"
                  />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* LinkViewer Modal - Replaced ResourceViewer with LinkViewer */}
      {selectedLink && (
        <LinkViewer
          url={selectedLink.url}
          title={selectedLink.title}
          type={selectedLink.type as 'video' | 'music' | 'backing' | 'resource' | 'link' | 'vocals' | 'image'}
          onClose={() => setSelectedLink(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Activity</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{activity.activity}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Activity</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}