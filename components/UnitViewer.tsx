import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  FolderOpen, 
  Search, 
  EyeOff, 
  ChevronLeft, 
  Clock, 
  BookOpen, 
  Calendar, 
  Tag, 
  X,
  Edit3,
  Eye,
  Plus,
  Check,
  Save,
  CheckCircle,
  Printer
} from 'lucide-react';
import { UnitCard } from './UnitCard';
import { LessonLibraryCard } from './LessonLibraryCard';
import { ActivityDetails } from './ActivityDetails';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { LessonExporter } from './LessonExporter';
import { HalfTermCard } from './HalfTermCard';
import { LessonSelectionModal } from './LessonSelectionModal';
import { HalfTermView } from './HalfTermView';
import { LessonDetailsModal } from './LessonDetailsModal';
import { LessonPrintModal } from './LessonPrintModal';
import type { Activity } from '../contexts/DataContext';

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

// Define half-term periods
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

// Map term IDs to readable names
const TERM_NAMES: Record<string, string> = {
  'A1': 'Autumn 1 (Sep-Oct)',
  'A2': 'Autumn 2 (Nov-Dec)',
  'SP1': 'Spring 1 (Jan-Feb)',
  'SP2': 'Spring 2 (Mar-Apr)',
  'SM1': 'Summer 1 (Apr-May)',
  'SM2': 'Summer 2 (Jun-Jul)',
};

// Map term IDs to colors
const TERM_COLORS: Record<string, string> = {
  'A1': '#F59E0B', // Amber
  'A2': '#EA580C', // Orange
  'SP1': '#10B981', // Emerald
  'SP2': '#059669', // Green
  'SM1': '#3B82F6', // Blue
  'SM2': '#6366F1', // Indigo
};

export function UnitViewer() {
  const { currentSheetInfo, allLessonsData, halfTerms, updateHalfTerm, getLessonsForHalfTerm } = useData();
  const { getThemeForClass } = useSettings();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedLessonForExport, setSelectedLessonForExport] = useState<string | null>(null);
  const [focusedHalfTermId, setFocusedHalfTermId] = useState<string | null>(null);
  const [selectedHalfTerm, setSelectedHalfTerm] = useState<string | null>(null);
  const [showLessonSelectionModal, setShowLessonSelectionModal] = useState(false);
  const [selectedLessonForDetails, setSelectedLessonForDetails] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printHalfTermId, setPrintHalfTermId] = useState<string | null>(null);
  const [printHalfTermName, setPrintHalfTermName] = useState<string | null>(null);
  const [printUnitId, setPrintUnitId] = useState<string | null>(null);
  const [printUnitName, setPrintUnitName] = useState<string | null>(null);
  
  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // FIXED: Function to check if a lesson is assigned to any half-term
  const isLessonAssignedToHalfTerm = (lessonNumber: string): boolean => {
    return halfTerms.some(halfTerm => halfTerm.lessons.includes(lessonNumber));
  };

  // Load units from localStorage
  useEffect(() => {
    const savedUnits = localStorage.getItem(`units-${currentSheetInfo.sheet}`);
    if (savedUnits) {
      try {
        const parsedUnits = JSON.parse(savedUnits).map((unit: any) => ({
          ...unit,
          createdAt: new Date(unit.createdAt),
          updatedAt: new Date(unit.updatedAt),
        }));
        setUnits(parsedUnits);
      } catch (error) {
        console.error('Error parsing saved units:', error);
        setUnits([]);
      }
    } else {
      // Initialize with an empty array
      setUnits([]);
      localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify([]));
    }
  }, [currentSheetInfo.sheet]);

  // Group units by half-term
  const unitsByHalfTerm = React.useMemo(() => {
    const grouped: Record<string, Unit[]> = {};
    
    // Initialize all half-terms with empty arrays
    Object.keys(TERM_NAMES).forEach(termId => {
      grouped[termId] = [];
    });
    
    // Group units by term
    units.forEach(unit => {
      if (unit.term) {
        if (!grouped[unit.term]) {
          grouped[unit.term] = [];
        }
        grouped[unit.term].push(unit);
      } else {
        // If no term is specified, put in Autumn 1 by default
        if (!grouped['A1']) {
          grouped['A1'] = [];
        }
        grouped['A1'].push(unit);
      }
    });
    
    return grouped;
  }, [units]);

  // Handle unit selection
  const handleUnitSelect = (unit: Unit) => {
    setSelectedUnit(unit);
  };

  // Handle back button click
  const handleBackToUnits = () => {
    setSelectedUnit(null);
  };

  // Handle activity click
  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  // Handle lesson export
  const handleLessonExport = (lessonNumber: string) => {
    setSelectedLessonForExport(lessonNumber);
  };

  // Handle focusing on a specific half-term
  const handleFocusHalfTerm = (termId: string) => {
    setFocusedHalfTermId(termId === focusedHalfTermId ? null : termId);
    // Reset the term filter when focusing on a specific half-term
    setSelectedTerm('all');
  };

  // Handle half-term card click
  const handleHalfTermClick = (halfTermId: string) => {
    setSelectedHalfTerm(halfTermId);
    setShowLessonSelectionModal(true);
  };

  // Check if a half-term is marked as complete
  const isHalfTermComplete = (halfTermId: string) => {
    const halfTerm = halfTerms.find(term => term.id === halfTermId);
    return halfTerm ? halfTerm.isComplete || false : false;
  };

  // Handle lesson reordering
  const handleReorderLessons = (dragIndex: number, hoverIndex: number) => {
    if (!selectedHalfTerm) return;
    
    const lessons = getLessonsForHalfTerm(selectedHalfTerm);
    const draggedLesson = lessons[dragIndex];
    const newLessons = [...lessons];
    newLessons.splice(dragIndex, 1);
    newLessons.splice(hoverIndex, 0, draggedLesson);
    updateHalfTerm(selectedHalfTerm, newLessons, isHalfTermComplete(selectedHalfTerm));
  };

  // Handle lesson removal
  const handleRemoveLesson = (halfTermId: string, lessonNumber: string) => {
    const lessons = getLessonsForHalfTerm(halfTermId);
    const newLessons = lessons.filter(num => num !== lessonNumber);
    
    // If all lessons are removed, automatically set isComplete to false
    const isComplete = newLessons.length > 0 ? isHalfTermComplete(halfTermId) : false;
    
    updateHalfTerm(halfTermId, newLessons, isComplete);
  };

  // Handle view lesson details
  const handleViewLessonDetails = (lessonNumber: string) => {
    setSelectedLessonForDetails(lessonNumber);
  };

  // Create a new unit
  const handleCreateUnit = () => {
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      name: 'New Unit',
      description: 'Add a description for this unit',
      lessonNumbers: [],
      color: getRandomColor(),
      term: 'A1', // Default to Autumn 1
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedUnits = [...units, newUnit];
    setUnits(updatedUnits);
    localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
    
    // Select the new unit
    setSelectedUnit(newUnit);
  };

  // Generate a random color for new units
  const getRandomColor = () => {
    const colors = [
      '#3B82F6', // Blue
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#8B5CF6', // Violet
      '#EC4899', // Pink
      '#EF4444', // Red
      '#F97316', // Orange
      '#14B8A6', // Teal
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle printing a half-term
  const handlePrintHalfTerm = (halfTermId: string, halfTermName: string) => {
    setPrintHalfTermId(halfTermId);
    setPrintHalfTermName(halfTermName);
    setShowPrintModal(true);
  };

  // Handle printing a unit
  const handlePrintUnit = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setPrintUnitId(unitId);
      setPrintUnitName(unit.name);
      setShowPrintModal(true);
    }
  };

  // If a unit is selected, show its details
  if (selectedUnit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Unit Header */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div 
              className="p-6 text-white relative"
              style={{ 
                background: `linear-gradient(135deg, ${selectedUnit.color || theme.primary} 0%, ${theme.secondary} 100%)` 
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <button
                      onClick={handleBackToUnits}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
                      title="Back to all units"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-bold">{selectedUnit.name}</h1>
                  </div>
                  <div className="flex items-center space-x-4 text-white text-opacity-90">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span className="font-medium">{selectedUnit.lessonNumbers.length} lessons</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">{TERM_NAMES[selectedUnit.term || 'A1'] || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePrintUnit(selectedUnit.id)}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                    title="Export Unit to PDF"
                  >
                    <Printer className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">Export PDF</span>
                  </button>
                  <button
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                    title="Edit Unit"
                  >
                    <Edit3 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">Edit Unit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Description */}
          {selectedUnit.description && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Unit Description</h2>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedUnit.description }}
              />
            </div>
          )}

          {/* Lessons in this Unit */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lessons in this Unit</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedUnit.lessonNumbers.map(lessonNumber => {
                const lessonData = allLessonsData[lessonNumber];
                
                // FIXED: Only show lessons that exist in allLessonsData AND are assigned to a half-term
                if (!lessonData || !isLessonAssignedToHalfTerm(lessonNumber)) {
                  return null;
                }
                
                return (
                  <div key={lessonNumber} className="relative group">
                    <LessonLibraryCard
                      lessonNumber={lessonNumber}
                      lessonData={lessonData}
                      viewMode="grid"
                      onClick={() => handleViewLessonDetails(lessonNumber)}
                      theme={theme}
                    />
                    
                    {/* Overlay buttons that appear on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLessonExport(lessonNumber);
                        }}
                        className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg shadow-sm text-gray-700 hover:text-gray-900"
                        title="Export Lesson"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Back to Units Button */}
          <div className="text-center">
            <button
              onClick={handleBackToUnits}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to All Units</span>
            </button>
          </div>
        </div>

        {/* Activity Details Modal */}
        {selectedActivity && (
          <ActivityDetails
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
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
            unitId={selectedUnit.id}
            unitName={selectedUnit.name}
          />
        )}

        {/* Print Modal */}
        {showPrintModal && (
          <LessonPrintModal
            lessonNumbers={selectedUnit.lessonNumbers.filter(lessonNumber => 
              allLessonsData[lessonNumber] && isLessonAssignedToHalfTerm(lessonNumber)
            )}
            onClose={() => {
              setShowPrintModal(false);
              setPrintHalfTermId(null);
              setPrintHalfTermName(null);
              setPrintUnitId(null);
              setPrintUnitName(null);
            }}
            unitId={printUnitId || selectedUnit.id}
            unitName={printUnitName || selectedUnit.name}
            isUnitPrint={true}
          />
        )}
      </div>
    );
  }

  // Default view - half-term cards
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header - Updated with search field on the right */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FolderOpen className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Half-Term Planner</h2>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Search field - moved to the right */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-300" />
                    <input
                      type="text"
                      placeholder="Search units..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-indigo-200 focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Focused Half-Term Indicator */}
          {focusedHalfTermId && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Focused on {TERM_NAMES[focusedHalfTermId]}</h3>
                  <p className="text-sm text-gray-600">Showing only units from this half-term</p>
                </div>
              </div>
              <button
                onClick={() => setFocusedHalfTermId(null)}
                className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium"
              >
                Show All Half-Terms
              </button>
            </div>
          )}

          {/* Half-Term Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {HALF_TERMS.map((halfTerm) => {
              const lessons = getLessonsForHalfTerm(halfTerm.id);
              const isComplete = isHalfTermComplete(halfTerm.id);
              
              return (
                <HalfTermCard
                  key={halfTerm.id}
                  id={halfTerm.id}
                  name={halfTerm.name}
                  months={halfTerm.months}
                  color={TERM_COLORS[halfTerm.id]}
                  lessonCount={lessons.length}
                  onClick={() => handleHalfTermClick(halfTerm.id)}
                  isComplete={isComplete}
                />
              );
            })}
          </div>
        </div>

        {/* Activity Details Modal */}
        {selectedActivity && (
          <ActivityDetails
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}

        {/* Lesson Exporter */}
        {selectedLessonForExport && (
          <LessonExporter
            lessonNumber={selectedLessonForExport}
            onClose={() => setSelectedLessonForExport(null)}
          />
        )}

        {/* Lesson Selection Modal */}
        {showLessonSelectionModal && selectedHalfTerm && (
          <LessonSelectionModal
            isOpen={showLessonSelectionModal}
            onClose={() => {
              setShowLessonSelectionModal(false);
              setSelectedHalfTerm(null);
            }}
            halfTermId={selectedHalfTerm}
            halfTermName={HALF_TERMS.find(term => term.id === selectedHalfTerm)?.name || ''}
            halfTermMonths={HALF_TERMS.find(term => term.id === selectedHalfTerm)?.months || ''}
            halfTermColor={TERM_COLORS[selectedHalfTerm]}
            selectedLessons={getLessonsForHalfTerm(selectedHalfTerm)}
            onSave={(lessons, isComplete) => {
              updateHalfTerm(selectedHalfTerm, lessons, isComplete);
              setShowLessonSelectionModal(false);
              setSelectedHalfTerm(null);
            }}
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

        {/* Print Modal - FIXED VERSION */}
        {showPrintModal && (
          <LessonPrintModal
            lessonNumbers={
              printUnitId 
                ? (units.find(u => u.id === printUnitId)?.lessonNumbers.filter(lessonNumber => 
                    allLessonsData[lessonNumber] && isLessonAssignedToHalfTerm(lessonNumber)
                  ) || [])
                : printHalfTermId 
                  ? getLessonsForHalfTerm(printHalfTermId)
                  : []
            }
            onClose={() => {
              setShowPrintModal(false);
              setPrintHalfTermId(null);
              setPrintHalfTermName(null);
              setPrintUnitId(null);
              setPrintUnitName(null);
            }}
            halfTermId={printHalfTermId || undefined}
            halfTermName={printHalfTermName || undefined}
            unitId={printUnitId || undefined}
            unitName={printUnitName || undefined}
            isUnitPrint={!!printUnitId}
          />
        )}
      </div>
    </DndProvider>
  );
}