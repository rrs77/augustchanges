import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import { UnitViewer } from "./UnitViewer";
import { LessonPlanBuilder } from "./LessonPlanBuilder";
import { LessonPlannerCalendar } from "./LessonPlannerCalendar";
import { ActivityLibrary } from "./ActivityLibrary";
import { LessonLibrary } from "./LessonLibrary";
import { Calendar, BookOpen, Edit3, GraduationCap, FolderOpen, Tag, Book } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../hooks/useAuth';
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

// Define half-term periods (for reference only)
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

export function Dashboard() {
  const { user } = useAuth();
  const { currentSheetInfo, allLessonsData, updateHalfTerm, getLessonsForHalfTerm } = useData();
  const { getThemeForClass } = useSettings();
  const [activeTab, setActiveTab] = useState('unit-viewer');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [units, setUnits] = useState<Unit[]>([]);
  
  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // Helper function to get sequential lesson number within a half-term
  const getSequentialLessonNumber = (lessonNumber: string, halfTermId: string) => {
    const lessonsInHalfTerm = getLessonsForHalfTerm(halfTermId);
    const sortedLessons = [...lessonsInHalfTerm].sort((a, b) => parseInt(a) - parseInt(b));
    return sortedLessons.indexOf(lessonNumber) + 1;
  };

  // Load lesson plans from localStorage
  React.useEffect(() => {
    const savedPlans = localStorage.getItem('lesson-plans');
    if (savedPlans) {
      const plans = JSON.parse(savedPlans).map((plan: any) => ({
        ...plan,
        date: new Date(plan.date),
        createdAt: new Date(plan.createdAt),
        updatedAt: new Date(plan.updatedAt),
      }));
      setLessonPlans(plans);
    }

    // Load units from localStorage
    const savedUnits = localStorage.getItem('units');
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
      // Create some sample units if none exist
      const sampleUnits: Unit[] = [
        {
          id: 'unit-1',
          name: 'Welcome Songs',
          description: 'A collection of welcome songs and activities to start the lesson.',
          lessonNumbers: ['1', '2', '3'],
          color: '#3B82F6',
          term: 'A1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'unit-2',
          name: 'Rhythm Activities',
          description: 'Activities focused on developing rhythm skills using percussion instruments.',
          lessonNumbers: ['4', '5', '6'],
          color: '#F59E0B',
          term: 'A2',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'unit-3',
          name: 'Movement and Dance',
          description: 'Activities that combine music with movement and dance elements.',
          lessonNumbers: ['7', '8', '9'],
          color: '#10B981',
          term: 'SP1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setUnits(sampleUnits);
      localStorage.setItem('units', JSON.stringify(sampleUnits));
    }
  }, []);

  // Save lesson plans to localStorage
  const saveLessonPlans = (plans: any[]) => {
    localStorage.setItem('lesson-plans', JSON.stringify(plans));
    setLessonPlans(plans);
  };

  // Save units to localStorage
  const saveUnits = (updatedUnits: Unit[]) => {
    localStorage.setItem('units', JSON.stringify(updatedUnits));
    setUnits(updatedUnits);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setActiveTab('lesson-builder');
  };

  const handleCreateLessonPlan = (date: Date) => {
    const weekNumber = Math.ceil(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 
      (7 * 24 * 60 * 60 * 1000)
    );

    const newPlan = {
      id: crypto.randomUUID(),
      date,
      week: weekNumber,
      className: currentSheetInfo.sheet,
      activities: [],
      duration: 0,
      notes: '',
      status: 'planned',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedPlans = [...lessonPlans, newPlan];
    saveLessonPlans(updatedPlans);
    setActiveTab('lesson-builder');
  };

  const handleUpdateLessonPlan = (updatedPlan: any) => {
    const updatedPlans = lessonPlans.map(plan => 
      plan.id === updatedPlan.id ? { ...updatedPlan, updatedAt: new Date() } : plan
    );
    
    if (!lessonPlans.find(plan => plan.id === updatedPlan.id)) {
      updatedPlans.push({ ...updatedPlan, updatedAt: new Date() });
    }
    
    saveLessonPlans(updatedPlans);
  };

  const handleActivityAdd = (activity: Activity) => {
    // This would be handled by the LessonPlanBuilder component
    console.log('Activity added:', activity);
  };

  const handleLessonSelect = (lessonNumber: string) => {
    // Navigate to lesson builder with the selected lesson
    setActiveTab('lesson-builder');
    // The LessonPlanBuilder would need to be updated to accept an initialLessonId prop
    // and load that lesson when it mounts
  };

  // FIXED: Now uses sequential lesson numbering in error messages
  const handleAssignLessonToHalfTerm = (lessonNumber: string, halfTermId: string) => {
    console.log('Dashboard: Assigning lesson', lessonNumber, 'to half-term', halfTermId);
    
    // Get current lessons for this half-term from DataContext
    const currentLessons = getLessonsForHalfTerm(halfTermId);
    
    // Check if lesson is already assigned to another half-term
    const existingHalfTerm = HALF_TERMS.find(term => {
      const lessonsInTerm = getLessonsForHalfTerm(term.id);
      return lessonsInTerm.includes(lessonNumber);
    });
    
    if (existingHalfTerm) {
      // Get sequential number for the lesson in the existing half-term
      const sequentialNumber = getSequentialLessonNumber(lessonNumber, existingHalfTerm.id);
      alert(`Lesson ${sequentialNumber} is already assigned to ${existingHalfTerm.name}.`);
      return;
    }
    
    // Add the lesson if it's not already there
    if (!currentLessons.includes(lessonNumber)) {
      const updatedLessons = [...currentLessons, lessonNumber];
      
      // Use DataContext's updateHalfTerm function
      updateHalfTerm(halfTermId, updatedLessons, false);
      
      // Show a success message with sequential numbering
      const halfTermName = HALF_TERMS.find(t => t.id === halfTermId)?.name;
      const sequentialNumber = updatedLessons.sort((a, b) => parseInt(a) - parseInt(b)).indexOf(lessonNumber) + 1;
      alert(`Lesson ${sequentialNumber} has been added to the ${halfTermName} half-term.`);
    } else {
      // Get sequential number for this lesson in the target half-term
      const sequentialNumber = getSequentialLessonNumber(lessonNumber, halfTermId);
      const halfTermName = HALF_TERMS.find(t => t.id === halfTermId)?.name;
      alert(`Lesson ${sequentialNumber} is already assigned to ${halfTermName}.`);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="bg-white shadow-md rounded-xl p-1 border border-gray-200 w-full">
              <TabsTrigger 
                value="unit-viewer"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                style={{ 
                  '--tw-gradient-from': theme.primary,
                  '--tw-gradient-to': theme.secondary
                } as React.CSSProperties}
                data-tab="unit-viewer"
              >
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>Unit Viewer</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="lesson-library"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                data-tab="lesson-library"
              >
                <div className="flex items-center space-x-2">
                  <Book className="h-5 w-5" />
                  <span>Lesson Library</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="lesson-builder"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                data-tab="lesson-builder"
              >
                <div className="flex items-center space-x-2">
                  <Edit3 className="h-5 w-5" />
                  <span>Lesson Builder</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="activity-library"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                data-tab="activity-library"
              >
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5" />
                  <span>Activity Library</span>
                </div>
              </TabsTrigger>
              
              {/* CALENDAR TAB - TEMPORARILY DISABLED */}
              {/* To re-enable: uncomment the block below */}
              {/*
              <TabsTrigger 
                value="calendar"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                data-tab="calendar"
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Calendar</span>
                </div>
              </TabsTrigger>
              */}
            </TabsList>

            <TabsContent value="unit-viewer" className="mt-3">
              <UnitViewer />
            </TabsContent>

            <TabsContent value="lesson-library" className="mt-3">
              <LessonLibrary 
                className={currentSheetInfo.sheet}
                onAssignToUnit={handleAssignLessonToHalfTerm}
              />
            </TabsContent>

            <TabsContent value="lesson-builder" className="mt-3">
              <LessonPlanBuilder />
            </TabsContent>

            <TabsContent value="activity-library" className="mt-3">
              <ActivityLibrary
                onActivitySelect={handleActivityAdd}
                selectedActivities={[]}
                className={currentSheetInfo.sheet}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </TabsContent>

            {/* CALENDAR TAB CONTENT - TEMPORARILY DISABLED */}
            {/* To re-enable: uncomment the block below */}
            {/*
            <TabsContent value="calendar" className="mt-6">
              <LessonPlannerCalendar
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                lessonPlans={lessonPlans}
                onUpdateLessonPlan={handleUpdateLessonPlan}
                onCreateLessonPlan={handleCreateLessonPlan}
                className={currentSheetInfo.sheet}
              />
            </TabsContent>
            */}
          </Tabs>
        </div>
      </div>
    </DndProvider>
  );
}