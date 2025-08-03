import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as XLSX from 'xlsx';
import { activitiesApi, lessonsApi, eyfsApi } from '../config/api';
import { supabase, TABLES, isSupabaseConfigured } from '../config/supabase';

export interface Activity {
  id?: string;
  _id?: string;
  activity: string;
  description: string;
  activityText?: string; // New field for activity text
  htmlDescription?: string;
  time: number;
  videoLink: string;
  musicLink: string;
  backingLink: string;
  resourceLink: string;
  link: string;
  vocalsLink: string;
  imageLink: string;
  teachingUnit: string;
  category: string;
  level: string;
  unitName: string;
  lessonNumber: string;
  eyfsStandards?: string[];
  _uniqueId?: string; // Added for drag and drop uniqueness
}

export interface LessonData {
  grouped: Record<string, Activity[]>;
  categoryOrder: string[];
  totalTime: number;
  eyfsStatements?: string[];
  title?: string; // Added title field for lessons
}

export interface SheetInfo {
  sheet: string;
  display: string;
  eyfs: string;
}

export interface LessonPlan {
  id: string;
  date: Date;
  week: number;
  className: string;
  activities: Activity[];
  duration: number;
  notes: string;
  status: 'planned' | 'completed' | 'cancelled' | 'draft';
  unitId?: string;
  unitName?: string;
  lessonNumber?: string;
  title?: string;
  term?: string;
  time?: string; // Added time field for scheduled lessons
  createdAt: Date;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  name: string;
  description: string;
  lessonNumbers: string[];
  color: string;
  term?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HalfTerm {
  id: string;
  name: string;
  months: string;
  lessons: string[];
  isComplete: boolean;
}

interface DataContextType {
  currentSheetInfo: SheetInfo;
  setCurrentSheetInfo: (info: SheetInfo) => void;
  lessonNumbers: string[];
  teachingUnits: string[];
  allLessonsData: Record<string, LessonData>;
  eyfsStatements: Record<string, string[]>;
  allEyfsStatements: string[];
  loading: boolean;
  refreshData: () => Promise<void>;
  uploadExcelFile: (file: File) => Promise<void>;
  addEyfsToLesson: (lessonNumber: string, eyfsStatement: string) => void;
  removeEyfsFromLesson: (lessonNumber: string, eyfsStatement: string) => void;
  updateAllEyfsStatements: (statements: string[]) => void;
  updateLessonTitle: (lessonNumber: string, title: string) => void;
  userCreatedLessonPlans: LessonPlan[]; // New property for user-created lesson plans
  addOrUpdateUserLessonPlan: (plan: LessonPlan) => void; // New function to add/update user lesson plans
  deleteUserLessonPlan: (planId: string) => void; // New function to delete user lesson plans
  deleteLesson: (lessonNumber: string) => void; // New function to delete a lesson
  allActivities: Activity[]; // Centralized activities
  addActivity: (activity: Activity) => Promise<Activity>; // Add a new activity
  updateActivity: (activity: Activity) => Promise<Activity>; // Update an existing activity
  deleteActivity: (activityId: string) => Promise<void>; // Delete an activity
  units: Unit[]; // Units for the current class
  updateUnit: (unit: Unit) => void; // Update a unit
  deleteUnit: (unitId: string) => void; // Delete a unit
  halfTerms: HalfTerm[]; // Half-terms for the current class
  updateHalfTerm: (halfTermId: string, lessons: string[], isComplete: boolean) => void; // Update a half-term
  getLessonsForHalfTerm: (halfTermId: string) => string[]; // ADDED: Get lessons for a half-term
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

// Define the preferred category order
const CATEGORY_ORDER = [
  'Welcome',
  'Kodaly Songs',
  'Kodaly Action Songs',
  'Action/Games Songs',
  'Rhythm Sticks',
  'Scarf Songs',
  'General Game',
  'Core Songs',
  'Parachute Games',
  'Percussion Games',
  'Goodbye',
  'Teaching Units',
  'Kodaly Rhythms',
  'Kodaly Games',
  'IWB Games'
];

// EYFS statements for all age groups
const DEFAULT_EYFS_STATEMENTS = [
  "Communication and Language: 🎧 Listens carefully to rhymes and songs",
  "Communication and Language: 🎧 Enjoys singing and making sounds",
  "Communication and Language: 🎧 Joins in with familiar songs and rhymes",
  "Communication and Language: 🎧 Understands and responds to simple questions or instructions",
  "Communication and Language: 🗣️ Uses talk to express ideas and feelings",
  "Listening, Attention and Understanding: 🎧 Listens with increased attention to sounds",
  "Listening, Attention and Understanding: 🎧 Responds to what they hear with relevant actions",
  "Listening, Attention and Understanding: 🎧 Follows directions with two or more steps",
  "Listening, Attention and Understanding: 🎧 Understands simple concepts such as in, on, under",
  "Speaking: 🗣️ Begins to use longer sentences",
  "Speaking: 🗣️ Retells events or experiences in sequence",
  "Speaking: 🗣️ Uses new vocabulary in different contexts",
  "Speaking: 🗣️ Talks about what they are doing or making",
  "Personal, Social and Emotional Development: 🧠 Shows confidence to try new activities",
  "Personal, Social and Emotional Development: 🧠 Takes turns and shares with others",
  "Personal, Social and Emotional Development: 🧠 Expresses own feelings and considers others'",
  "Personal, Social and Emotional Development: 🧠 Shows resilience and perseverance",
  "Physical Development: 🕺 Moves energetically, e.g., running, jumping, dancing",
  "Physical Development: 🕺 Uses large and small motor skills for coordinated movement",
  "Physical Development: 🕺 Moves with control and coordination",
  "Physical Development: 🕺 Shows strength, balance and coordination",
  "Expressive Arts and Design: 🎨 Creates collaboratively, sharing ideas and resources",
  "Expressive Arts and Design: 🎨 Explores the sounds of instruments",
  "Expressive Arts and Design: 🎨 Sings a range of well-known nursery rhymes and songs",
  "Expressive Arts and Design: 🎨 Performs songs, rhymes, poems and stories with others",
  "Expressive Arts and Design: 🎨 Responds imaginatively to music and dance",
  "Expressive Arts and Design: 🎨 Develops storylines in pretend play"
];

// Default lesson titles based on categories
const generateDefaultLessonTitle = (lessonData: LessonData): string => {
  // Get the main categories in this lesson
  const categories = lessonData.categoryOrder;
  
  if (categories.length === 0) return "Untitled Lesson";
  
  // If it has Welcome and Goodbye, it's a standard lesson
  if (categories.includes('Welcome') && categories.includes('Goodbye')) {
    // Find the main content category (not Welcome or Goodbye)
    const mainCategories = categories.filter(cat => cat !== 'Welcome' && cat !== 'Goodbye');
    if (mainCategories.length > 0) {
      return `${mainCategories[0]} Lesson`;
    }
    return "Standard Lesson";
  }
  
  // If it has a specific focus
  if (categories.includes('Kodaly Songs')) return "Kodaly Lesson";
  if (categories.includes('Rhythm Sticks')) return "Rhythm Sticks Lesson";
  if (categories.includes('Percussion Games')) return "Percussion Lesson";
  if (categories.includes('Scarf Songs')) return "Movement with Scarves";
  if (categories.includes('Parachute Games')) return "Parachute Activities";
  if (categories.includes('Action/Games Songs')) return "Action Games Lesson";
  
  // Default to the first category
  return `${categories[0]} Lesson`;
};

// Define half-term periods
const DEFAULT_HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct', lessons: [], isComplete: false },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec', lessons: [], isComplete: false },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb', lessons: [], isComplete: false },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr', lessons: [], isComplete: false },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May', lessons: [], isComplete: false },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul', lessons: [], isComplete: false },
];

export function DataProvider({ children }: DataProviderProps) {
  const [currentSheetInfo, setCurrentSheetInfo] = useState<SheetInfo>({
    sheet: 'LKG',
    display: 'Lower Kindergarten',
    eyfs: 'LKG Statements'
  });
  
  const [lessonNumbers, setLessonNumbers] = useState<string[]>([]);
  const [teachingUnits, setTeachingUnits] = useState<string[]>([]);
  const [allLessonsData, setAllLessonsData] = useState<Record<string, LessonData>>({});
  const [eyfsStatements, setEyfsStatements] = useState<Record<string, string[]>>({});
  const [allEyfsStatements, setAllEyfsStatements] = useState<string[]>(DEFAULT_EYFS_STATEMENTS);
  const [loading, setLoading] = useState(true);
  const [userCreatedLessonPlans, setUserCreatedLessonPlans] = useState<LessonPlan[]>([]);
  // Flag to track if data was just cleared
  const [dataWasCleared, setDataWasCleared] = useState(false);
  // Centralized activities state
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  // Half-terms state
  const [halfTerms, setHalfTerms] = useState<HalfTerm[]>(DEFAULT_HALF_TERMS);

  useEffect(() => {
    // Check if data was just cleared by looking for a URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const cleared = urlParams.get('cleared');
    if (cleared === 'true') {
      setDataWasCleared(true);
      // Remove the parameter from the URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    loadData();
    // Load EYFS statements
    loadEyfsStatements();
    // Load user-created lesson plans
    loadUserCreatedLessonPlans();
    // Load activities
    loadActivities();
    // Load units
    loadUnits();
    // Load half-terms
    loadHalfTerms();
  }, [currentSheetInfo]);

  // Load units for the current class
  const loadUnits = () => {
    try {
      // If data was cleared, set empty state
      if (dataWasCleared) {
        setUnits([]);
        return;
      }
      
      // Load from localStorage
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
    } catch (error) {
      console.error('Failed to load units:', error);
      setUnits([]);
    }
  };

  // Update a unit
  const updateUnit = (unit: Unit) => {
    setUnits(prev => {
      const index = prev.findIndex(u => u.id === unit.id);
      if (index !== -1) {
        // Update existing unit
        const updatedUnits = [...prev];
        updatedUnits[index] = {
          ...unit,
          updatedAt: new Date()
        };
        localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
        return updatedUnits;
      } else {
        // Add new unit
        const newUnits = [...prev, {
          ...unit,
          createdAt: new Date(),
          updatedAt: new Date()
        }];
        localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(newUnits));
        return newUnits;
      }
    });
  };

  // Delete a unit
  const deleteUnit = (unitId: string) => {
    setUnits(prev => {
      const updatedUnits = prev.filter(u => u.id !== unitId);
      localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
      return updatedUnits;
    });
  };

  // Load half-terms for the current class
  const loadHalfTerms = () => {
    try {
      // If data was cleared, set empty state
      if (dataWasCleared) {
        setHalfTerms(DEFAULT_HALF_TERMS);
        return;
      }
      
      // Load from localStorage
      const savedHalfTerms = localStorage.getItem(`half-terms-${currentSheetInfo.sheet}`);
      if (savedHalfTerms) {
        try {
          const parsedHalfTerms = JSON.parse(savedHalfTerms);
          setHalfTerms(parsedHalfTerms);
        } catch (error) {
          console.error('Error parsing saved half-terms:', error);
          setHalfTerms(DEFAULT_HALF_TERMS);
        }
      } else {
        // Initialize with default half-terms
        setHalfTerms(DEFAULT_HALF_TERMS);
        localStorage.setItem(`half-terms-${currentSheetInfo.sheet}`, JSON.stringify(DEFAULT_HALF_TERMS));
      }
    } catch (error) {
      console.error('Failed to load half-terms:', error);
      setHalfTerms(DEFAULT_HALF_TERMS);
    }
  };

  // Update a half-term
  const updateHalfTerm = (halfTermId: string, lessons: string[], isComplete: boolean) => {
    setHalfTerms(prev => {
      const updatedHalfTerms = prev.map(term => 
        term.id === halfTermId ? { ...term, lessons, isComplete } : term
      );
      localStorage.setItem(`half-terms-${currentSheetInfo.sheet}`, JSON.stringify(updatedHalfTerms));
      return updatedHalfTerms;
    });
  };

  // ADDED: Get lessons for a specific half-term
  const getLessonsForHalfTerm = (halfTermId: string): string[] => {
    const halfTerm = halfTerms.find(term => term.id === halfTermId);
    return halfTerm ? halfTerm.lessons : [];
  };

  // Load all activities
  const loadActivities = async () => {
    try {
      setLoading(true);
      
      // If data was cleared, set empty state
      if (dataWasCleared) {
        setAllActivities([]);
        return;
      }
      
      // Try to load from Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          const activities = await activitiesApi.getAll();
          if (activities && activities.length > 0) {
            setAllActivities(activities);
            return;
          }
        } catch (error) {
          console.warn('Failed to load activities from Supabase:', error);
        }
      }
      
      // Fallback to localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        setAllActivities(JSON.parse(savedActivities));
        return;
      }
      
      // If no saved activities, extract from lessons data
      const extractedActivities: Activity[] = [];
      Object.values(allLessonsData).forEach(lessonData => {
        Object.values(lessonData.grouped).forEach(categoryActivities => {
          extractedActivities.push(...categoryActivities);
        });
      });
      
      // Remove duplicates based on activity name and category
      const uniqueActivities = extractedActivities.filter((activity, index, self) => 
        index === self.findIndex(a => a.activity === activity.activity && a.category === activity.category)
      );
      
      setAllActivities(uniqueActivities);
      
      // Save to localStorage
      localStorage.setItem('library-activities', JSON.stringify(uniqueActivities));
      
      // Try to add each activity to the server
      if (isSupabaseConfigured()) {
        uniqueActivities.forEach(async (activity) => {
          try {
            await activitiesApi.create(activity);
          } catch (error) {
            console.warn('Failed to add activity to Supabase:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      setAllActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new activity
  const addActivity = async (activity: Activity): Promise<Activity> => {
    try {
      // Try to add to Supabase if connected
      let newActivity = activity;
      if (isSupabaseConfigured()) {
        try {
          newActivity = await activitiesApi.create(activity);
        } catch (error) {
          console.warn('Failed to add activity to Supabase:', error);
          // Generate a local ID
          newActivity = {
            ...activity,
            _id: `local-${Date.now()}`
          };
        }
      } else {
        // Generate a local ID
        newActivity = {
          ...activity,
          _id: `local-${Date.now()}`
        };
      }
      
      // Update local state
      setAllActivities(prev => [...prev, newActivity]);
      
      // Save to localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        activities.push(newActivity);
        localStorage.setItem('library-activities', JSON.stringify(activities));
      } else {
        localStorage.setItem('library-activities', JSON.stringify([newActivity]));
      }
      
      return newActivity;
    } catch (error) {
      console.error('Failed to add activity:', error);
      throw error;
    }
  };

  // Update an existing activity
  const updateActivity = async (activity: Activity): Promise<Activity> => {
    try {
      // Try to update in Supabase if connected
      let updatedActivity = activity;
      if (isSupabaseConfigured() && (activity._id)) {
        try {
          updatedActivity = await activitiesApi.update(activity._id, activity);
        } catch (error) {
          console.warn('Failed to update activity in Supabase:', error);
        }
      }
      // Update local state
      setAllActivities(prev => prev.map(a => (a._id === activity._id) ? updatedActivity : a));
      
      // Save to localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        const updatedActivities = activities.map((a: Activity) => (a._id === activity._id) ? updatedActivity : a);
        localStorage.setItem('library-activities', JSON.stringify(updatedActivities));
      }
      
      return updatedActivity;
    } catch (error) {
      console.error('Failed to update activity:', error);
      throw error;
    }
  };

  // Delete an activity
  const deleteActivity = async (activityId: string): Promise<void> => {
    try {
      // Try to delete from Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          await activitiesApi.delete(activityId);
        } catch (error) {
          console.warn('Failed to delete activity from Supabase:', error);
        }
      }
      
      // Update local state
      setAllActivities(prev => prev.filter(a => a._id !== activityId && a.id !== activityId));
      
      // Save to localStorage
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        const updatedActivities = activities.filter((a: Activity) => a._id !== activityId && a.id !== activityId);
        localStorage.setItem('library-activities', JSON.stringify(updatedActivities));
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
      throw error;
    }
  };

  const loadUserCreatedLessonPlans = () => {
    try {
      // If data was cleared, don't load any plans
      if (dataWasCleared) {
        setUserCreatedLessonPlans([]);
        return;
      }
      
      // First try to load from Supabase if connected
      if (isSupabaseConfigured()) {
        supabase
          .from(TABLES.LESSON_PLANS)
          .select('*')
          .then(({ data, error }) => {
            if (error) {
              console.warn('Failed to load lesson plans from Supabase:', error);
              loadUserCreatedLessonPlansFromLocalStorage();
            } else if (data) {
              // Convert dates and snake_case to camelCase
              const plans = data.map(plan => ({
                id: plan.id,
                date: new Date(plan.date),
                week: plan.week,
                className: plan.class_name,
                activities: plan.activities || [],
                duration: plan.duration || 0,
                notes: plan.notes || '',
                status: plan.status || 'planned',
                unitId: plan.unit_id,
                unitName: plan.unit_name,
                lessonNumber: plan.lesson_number,
                title: plan.title,
                term: plan.term,
                time: plan.time,
                createdAt: new Date(plan.created_at),
                updatedAt: new Date(plan.updated_at)
              }));
              setUserCreatedLessonPlans(plans);
            }
          });
      } else {
        loadUserCreatedLessonPlansFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load user-created lesson plans:', error);
      loadUserCreatedLessonPlansFromLocalStorage();
    }
  };

  const loadUserCreatedLessonPlansFromLocalStorage = () => {
    try {
      // If data was cleared, don't load any plans
      if (dataWasCleared) {
        setUserCreatedLessonPlans([]);
        return;
      }
      
      const savedPlans = localStorage.getItem('user-created-lesson-plans');
      if (savedPlans) {
        const plans = JSON.parse(savedPlans).map((plan: any) => ({
          ...plan,
          date: new Date(plan.date),
          createdAt: new Date(plan.createdAt),
          updatedAt: new Date(plan.updatedAt),
        }));
        setUserCreatedLessonPlans(plans);
      }
    } catch (error) {
      console.error('Failed to load user-created lesson plans from localStorage:', error);
      setUserCreatedLessonPlans([]);
    }
  };

  const saveUserCreatedLessonPlans = async (plans: LessonPlan[]) => {
    try {
      // Save to localStorage first (this is guaranteed to work)
      localStorage.setItem('user-created-lesson-plans', JSON.stringify(plans));
      
      // Then try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        // Convert plans to the format expected by Supabase
        const supabasePlans = plans.map(plan => ({
          id: plan.id,
          date: plan.date.toISOString(),
          week: plan.week,
          class_name: plan.className,
          activities: plan.activities,
          duration: plan.duration,
          notes: plan.notes,
          status: plan.status,
          unit_id: plan.unitId,
          unit_name: plan.unitName,
          lesson_number: plan.lessonNumber,
          title: plan.title,
          term: plan.term,
          time: plan.time
        }));
        
        // Use upsert to handle both inserts and updates
        const { error } = await supabase
          .from(TABLES.LESSON_PLANS)
          .upsert(supabasePlans, { onConflict: 'id' });
        
        if (error) {
          console.warn('Failed to save lesson plans to Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Failed to save user-created lesson plans:', error);
    }
  };

  // Add or update a user-created lesson plan
  const addOrUpdateUserLessonPlan = async (plan: LessonPlan) => {
    setUserCreatedLessonPlans(prev => {
      // Check if the plan already exists
      const existingPlanIndex = prev.findIndex(p => p.id === plan.id);
      
      let updatedPlans: LessonPlan[];
      if (existingPlanIndex >= 0) {
        // Update existing plan
        updatedPlans = [...prev];
        updatedPlans[existingPlanIndex] = {
          ...plan,
          updatedAt: new Date()
        };
      } else {
        // Add new plan
        updatedPlans = [...prev, {
          ...plan,
          createdAt: new Date(),
          updatedAt: new Date()
        }];
      }
      
      // Save to localStorage and Supabase
      saveUserCreatedLessonPlans(updatedPlans);
      
      // Add to allLessonsData so it appears in Lesson Library (but Unit Viewer will filter by half-term assignment)
      if (plan.lessonNumber) {
        updateAllLessonsDataWithUserPlan(plan);
      }
      
      return updatedPlans;
    });
  };

  // FIXED: Delete a user-created lesson plan with automatic reindexing
  const deleteUserLessonPlan = async (planId: string) => {
    try {
      // Find the lesson being deleted to get its lesson number
      const lessonToDelete = userCreatedLessonPlans.find(p => p.id === planId);
      
      if (!lessonToDelete || !lessonToDelete.lessonNumber) {
        // If no lesson number, just delete normally
        setUserCreatedLessonPlans(prev => {
          const updatedPlans = prev.filter(p => p.id !== planId);
          localStorage.setItem('user-created-lesson-plans', JSON.stringify(updatedPlans));
          return updatedPlans;
        });
        return;
      }
      
      const deletedLessonNumber = parseInt(lessonToDelete.lessonNumber);
      
      setUserCreatedLessonPlans(prev => {
        // Remove the deleted lesson
        let updatedPlans = prev.filter(p => p.id !== planId);
        
        // Filter lessons for the same class and sort by lesson number
        const classLessons = updatedPlans
          .filter(plan => plan.className === lessonToDelete.className && plan.lessonNumber)
          .sort((a, b) => parseInt(a.lessonNumber!) - parseInt(b.lessonNumber!));
        
        // Create a mapping of old lesson numbers to new lesson numbers
        const lessonNumberMapping: Record<string, string> = {};
        
        // Reindex lessons that come after the deleted lesson
        classLessons.forEach((lesson, index) => {
          const oldNumber = parseInt(lesson.lessonNumber!);
          const newNumber = (index + 1).toString(); // Sequential numbering starting from 1
          
          lessonNumberMapping[lesson.lessonNumber!] = newNumber;
          
          // Update the lesson number
          lesson.lessonNumber = newNumber;
          lesson.updatedAt = new Date();
        });
        
        // Update allLessonsData with new lesson numbers
        setAllLessonsData(prevLessonsData => {
          const updatedLessonsData = { ...prevLessonsData };
          
          // Remove the deleted lesson from allLessonsData
          delete updatedLessonsData[deletedLessonNumber.toString()];
          
          // Update lesson numbers in allLessonsData
          Object.keys(lessonNumberMapping).forEach(oldNumber => {
            const newNumber = lessonNumberMapping[oldNumber];
            if (updatedLessonsData[oldNumber] && oldNumber !== newNumber) {
              // Move lesson data to new number
              updatedLessonsData[newNumber] = updatedLessonsData[oldNumber];
              delete updatedLessonsData[oldNumber];
              
              // Update activity lesson numbers within the lesson data
              if (updatedLessonsData[newNumber].grouped) {
                Object.values(updatedLessonsData[newNumber].grouped).forEach(activities => {
                  activities.forEach(activity => {
                    activity.lessonNumber = newNumber;
                  });
                });
              }
            }
          });
          
          return updatedLessonsData;
        });
        
        // Update lesson numbers list
        setLessonNumbers(prevNumbers => {
          const updatedNumbers = prevNumbers
            .filter(num => num !== deletedLessonNumber.toString())
            .map(num => lessonNumberMapping[num] || num)
            .sort((a, b) => parseInt(a) - parseInt(b));
          
          return updatedNumbers;
        });
        
        // Update EYFS statements with new lesson numbers
        setEyfsStatements(prevStatements => {
          const updatedStatements = { ...prevStatements };
          
          // Remove deleted lesson
          delete updatedStatements[deletedLessonNumber.toString()];
          
          // Update lesson numbers in EYFS statements
          Object.keys(lessonNumberMapping).forEach(oldNumber => {
            const newNumber = lessonNumberMapping[oldNumber];
            if (updatedStatements[oldNumber] && oldNumber !== newNumber) {
              updatedStatements[newNumber] = updatedStatements[oldNumber];
              delete updatedStatements[oldNumber];
            }
          });
          
          return updatedStatements;
        });
        
        // Update half-terms with new lesson numbers
        setHalfTerms(prevHalfTerms => {
          const updatedHalfTerms = prevHalfTerms.map(term => {
            const updatedLessons = term.lessons
              .filter(lessonNum => lessonNum !== deletedLessonNumber.toString()) // Remove deleted lesson
              .map(lessonNum => lessonNumberMapping[lessonNum] || lessonNum); // Update with new numbers
            
            return {
              ...term,
              lessons: updatedLessons
            };
          });
          
          localStorage.setItem(`half-terms-${lessonToDelete.className}`, JSON.stringify(updatedHalfTerms));
          return updatedHalfTerms;
        });
        
        // Update units with new lesson numbers
        const savedUnits = localStorage.getItem(`units-${lessonToDelete.className}`);
        if (savedUnits) {
          try {
            const units = JSON.parse(savedUnits);
            const updatedUnits = units.map((unit: any) => {
              const updatedLessonNumbers = unit.lessonNumbers
                .filter((num: string) => num !== deletedLessonNumber.toString()) // Remove deleted lesson
                .map((num: string) => lessonNumberMapping[num] || num); // Update with new numbers
              
              return {
                ...unit,
                lessonNumbers: updatedLessonNumbers,
                updatedAt: new Date()
              };
            });
            
            localStorage.setItem(`units-${lessonToDelete.className}`, JSON.stringify(updatedUnits));
            setUnits(updatedUnits);
          } catch (error) {
            console.error('Failed to update units after lesson deletion:', error);
          }
        }
        
        // Save updated lesson plans to localStorage
        localStorage.setItem('user-created-lesson-plans', JSON.stringify(updatedPlans));
        
        // Save updated lesson data to localStorage
        const dataToSave = {
          allLessonsData: allLessonsData,
          lessonNumbers: lessonNumbers,
          teachingUnits,
          eyfsStatements
        };
        
        localStorage.setItem(`lesson-data-${lessonToDelete.className}`, JSON.stringify(dataToSave));
        
        return updatedPlans;
      });
      
      // Try to delete from Supabase if connected
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from(TABLES.LESSON_PLANS)
          .delete()
          .eq('id', planId);
        
        if (error) {
          console.warn('Failed to delete lesson plan from Supabase:', error);
        }
      }
      
    } catch (error) {
      console.error('Failed to delete and reindex lesson plan:', error);
    }
  };

  // Delete a lesson
  const deleteLesson = (lessonNumber: string) => {
    // Remove the lesson from allLessonsData
    setAllLessonsData(prev => {
      const updated = { ...prev };
      delete updated[lessonNumber];
      return updated;
    });

    // Remove the lesson from lessonNumbers
    setLessonNumbers(prev => prev.filter(num => num !== lessonNumber));

    // Remove the lesson from eyfsStatements
    setEyfsStatements(prev => {
      const updated = { ...prev };
      delete updated[lessonNumber];
      return updated;
    });

    // Save the updated data to localStorage
    const dataToSave = {
      allLessonsData: { ...allLessonsData },
      lessonNumbers: lessonNumbers.filter(num => num !== lessonNumber),
      teachingUnits,
      eyfsStatements: { ...eyfsStatements }
    };

    // Delete the lesson from allLessonsData
    delete dataToSave.allLessonsData[lessonNumber];
    // Delete the lesson from eyfsStatements
    delete dataToSave.eyfsStatements[lessonNumber];

    localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));

    // Try to update the Supabase data
    if (isSupabaseConfigured()) {
      lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave)
        .catch(error => console.warn(`Failed to update Supabase after deleting lesson ${lessonNumber}:`, error));
    }

    // Also remove this lesson from any user-created lesson plans
    setUserCreatedLessonPlans(prev => {
      const updatedPlans = prev.filter(plan => plan.lessonNumber !== lessonNumber);
      saveUserCreatedLessonPlans(updatedPlans);
      return updatedPlans;
    });

    // Also update any units that contain this lesson
    try {
      const savedUnits = localStorage.getItem(`units-${currentSheetInfo.sheet}`);
      if (savedUnits) {
        const units = JSON.parse(savedUnits);
        let unitsUpdated = false;

        const updatedUnits = units.map((unit: any) => {
          if (unit.lessonNumbers.includes(lessonNumber)) {
            unitsUpdated = true;
            return {
              ...unit,
              lessonNumbers: unit.lessonNumbers.filter((num: string) => num !== lessonNumber),
              updatedAt: new Date()
            };
          }
          return unit;
        });

        if (unitsUpdated) {
          localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
          setUnits(updatedUnits);
        }
      }
    } catch (error) {
      console.error('Failed to update units after deleting lesson:', error);
    }

    // Also update any half-terms that contain this lesson
    try {
      const savedHalfTerms = localStorage.getItem(`half-terms-${currentSheetInfo.sheet}`);
      if (savedHalfTerms) {
        const halfTerms = JSON.parse(savedHalfTerms);
        let halfTermsUpdated = false;

        const updatedHalfTerms = halfTerms.map((term: any) => {
          if (term.lessons.includes(lessonNumber)) {
            halfTermsUpdated = true;
            return {
              ...term,
              lessons: term.lessons.filter((num: string) => num !== lessonNumber)
            };
          }
          return term;
        });

        if (halfTermsUpdated) {
          localStorage.setItem(`half-terms-${currentSheetInfo.sheet}`, JSON.stringify(updatedHalfTerms));
          setHalfTerms(updatedHalfTerms);
        }
      }
    } catch (error) {
      console.error('Failed to update half-terms after deleting lesson:', error);
    }
  };

  // Update allLessonsData with a user-created lesson plan
  const updateAllLessonsDataWithUserPlan = (plan: LessonPlan) => {
    if (!plan.lessonNumber) return;
    
    // Group activities by category
    const grouped: Record<string, Activity[]> = {};
    const categoriesInLesson = new Set<string>();
    let totalTime = 0;
    
    plan.activities.forEach(activity => {
      if (!grouped[activity.category]) {
        grouped[activity.category] = [];
      }
      grouped[activity.category].push({
        ...activity,
        lessonNumber: plan.lessonNumber || ''
      });
      categoriesInLesson.add(activity.category);
      totalTime += activity.time || 0;
    });
    
    // Sort categories according to the predefined order
    const categoryOrder = sortCategoriesByOrder(Array.from(categoriesInLesson));
    
    // Create or update the lesson data
    const lessonData: LessonData = {
      grouped,
      categoryOrder,
      totalTime,
      title: plan.title,
      eyfsStatements: []
    };
    
    setAllLessonsData(prev => {
      const updated = { ...prev };
      updated[plan.lessonNumber!] = lessonData;
      return updated;
    });
    
    // Update lesson numbers if needed
    setLessonNumbers(prev => {
      if (!prev.includes(plan.lessonNumber!)) {
        const updated = [...prev, plan.lessonNumber!];
        // Sort numerically
        return updated.sort((a, b) => parseInt(a) - parseInt(b));
      }
      return prev;
    });
    
    // Save the updated data to localStorage
    const dataToSave = {
      allLessonsData: {
        ...allLessonsData,
        [plan.lessonNumber!]: lessonData
      },
      lessonNumbers: lessonNumbers.includes(plan.lessonNumber!) 
        ? lessonNumbers 
        : [...lessonNumbers, plan.lessonNumber!].sort((a, b) => parseInt(a) - parseInt(b)),
      teachingUnits,
      eyfsStatements
    };
    
    localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));
    
    // Try to update Supabase if connected
    if (isSupabaseConfigured()) {
      lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave)
        .catch(error => console.warn(`Failed to update Supabase with user plan for lesson ${plan.lessonNumber}:`, error));
    }
  };

  const loadEyfsStatements = async () => {
    try {
      // If data was cleared, set empty state
      if (dataWasCleared) {
        setAllEyfsStatements(DEFAULT_EYFS_STATEMENTS);
        return;
      }
      
      // Try to load from Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          const response = await eyfsApi.getBySheet(currentSheetInfo.sheet);
          if (response && response.allStatements) {
            setAllEyfsStatements(response.allStatements);
            return;
          }
        } catch (serverError) {
          console.warn('Failed to load EYFS statements from Supabase:', serverError);
        }
      }
      
      // Fallback to localStorage
      const savedStandards = localStorage.getItem(`eyfs-standards-${currentSheetInfo.sheet}`);
      if (savedStandards) {
        try {
          const parsedStandards = JSON.parse(savedStandards);
          // Convert from object format to flat array
          const flatStandards: string[] = [];
          Object.entries(parsedStandards).forEach(([area, details]) => {
            (details as string[]).forEach(detail => {
              flatStandards.push(`${area}: ${detail}`);
            });
          });
          setAllEyfsStatements(flatStandards.length > 0 ? flatStandards : DEFAULT_EYFS_STATEMENTS);
        } catch (error) {
          console.error('Error parsing saved EYFS standards:', error);
          setAllEyfsStatements(DEFAULT_EYFS_STATEMENTS);
        }
      } else {
        // Use default standards if none saved
        setAllEyfsStatements(DEFAULT_EYFS_STATEMENTS);
      }
    } catch (error) {
      console.error('Error loading EYFS statements:', error);
      setAllEyfsStatements(DEFAULT_EYFS_STATEMENTS);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // If data was cleared, set empty state
      if (dataWasCleared) {
        console.log(`Data was cleared, setting empty state for ${currentSheetInfo.sheet}`);
        setAllLessonsData({});
        setLessonNumbers([]);
        setTeachingUnits([]);
        setEyfsStatements({});
        setLoading(false);
        return;
      }
      
      // Try to load from Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          const lessonData = await lessonsApi.getBySheet(currentSheetInfo.sheet);
          if (lessonData && Object.keys(lessonData).length > 0) {
            setAllLessonsData(lessonData.allLessonsData || {});
            setLessonNumbers(lessonData.lessonNumbers || []);
            setTeachingUnits(lessonData.teachingUnits || []);
            setEyfsStatements(lessonData.eyfsStatements || {});
            console.log(`Loaded ${currentSheetInfo.sheet} data from Supabase`);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn(`Supabase data fetch failed for ${currentSheetInfo.sheet}, trying localStorage:`, error);
        }
      }
      
      // Try to load from localStorage as fallback
      const savedData = localStorage.getItem(`lesson-data-${currentSheetInfo.sheet}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setAllLessonsData(parsedData.allLessonsData || {});
        setLessonNumbers(parsedData.lessonNumbers || []);
        setTeachingUnits(parsedData.teachingUnits || []);
        setEyfsStatements(parsedData.eyfsStatements || {});
        console.log(`Loaded ${currentSheetInfo.sheet} data from localStorage`);
        
        // Try to save to Supabase for future use, but don't wait for it
        if (isSupabaseConfigured()) {
          lessonsApi.updateSheet(currentSheetInfo.sheet, parsedData)
            .then(() => console.log(`Migrated ${currentSheetInfo.sheet} data to Supabase`))
            .catch(serverError => console.warn(`Failed to migrate ${currentSheetInfo.sheet} data to Supabase:`, serverError));
        }
      } else {
        // If no saved data and data was not just cleared, load sample data
        // Otherwise, set empty state
        if (dataWasCleared) {
          console.log(`Data was cleared, setting empty state for ${currentSheetInfo.sheet}`);
          setAllLessonsData({});
          setLessonNumbers([]);
          setTeachingUnits([]);
          setEyfsStatements({});
          setDataWasCleared(false); // Reset the flag
        } else {
          // Load sample data only if data wasn't cleared
          await loadSampleData();
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // If data was cleared, set empty state instead of loading sample data
      if (dataWasCleared) {
        console.log(`Data was cleared, setting empty state for ${currentSheetInfo.sheet}`);
        setAllLessonsData({});
        setLessonNumbers([]);
        setTeachingUnits([]);
        setEyfsStatements({});
        setDataWasCleared(false); // Reset the flag
      } else {
        // Load sample data only if data wasn't cleared
        await loadSampleData();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = async () => {
    try {
      console.log(`Loading sample data for ${currentSheetInfo.sheet}`);
      
      // Set empty data instead of sample data
      setLessonNumbers([]);
      setTeachingUnits([]);
      setAllLessonsData({});
      setEyfsStatements({});
      
      console.log(`Set empty data for ${currentSheetInfo.sheet}`);
    } catch (error) {
      console.error(`Sample data loading failed for ${currentSheetInfo.sheet}:`, error);
      
      // Set empty data instead of minimal fallback data
      setLessonNumbers([]);
      setTeachingUnits([]);
      setAllLessonsData({});
      setEyfsStatements({});
    }
  };

  const sortCategoriesByOrder = (categories: string[]): string[] => {
    // Sort categories according to the predefined order
    return categories.sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      
      // If both categories are in the predefined order, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one category is in the predefined order, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // If neither category is in the predefined order, sort alphabetically
      return a.localeCompare(b);
    });
  };

  const processSheetData = async (sheetData: string[][]) => {
    try {
      if (!sheetData || sheetData.length === 0) {
        console.warn(`No sheet data provided for ${currentSheetInfo.sheet}`);
        return;
      }
      
      console.log(`Processing ${currentSheetInfo.sheet} sheet data, rows:`, sheetData.length);
      
      const headers = sheetData[0];
      console.log('Headers:', headers);
      
      const activities: Activity[] = [];
      const lessonNumbersSet = new Set<string>();
      const categoriesSet = new Set<string>();
      let currentLessonNumber = '';

      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row || row.length < 3) continue; // Skip empty or incomplete rows

        // Safely extract data with fallbacks
        const lessonNumber = (row[0] || '').toString().trim();
        const category = (row[1] || '').toString().trim();
        const activityName = (row[2] || '').toString().trim();
        const description = (row[3] || '').toString().trim();
        const level = (row[4] || '').toString().trim();
        const timeStr = (row[5] || '0').toString().trim();
        const video = (row[6] || '').toString().trim();
        const music = (row[7] || '').toString().trim();
        const backing = (row[8] || '').toString().trim();
        const resource = (row[9] || '').toString().trim();
        const unitName = (row[10] || '').toString().trim();

        // Skip rows without category or activity name
        if (!category || !activityName) continue;

        // Handle lesson number logic - if empty, use the last seen lesson number
        if (lessonNumber) {
          currentLessonNumber = lessonNumber;
          lessonNumbersSet.add(lessonNumber);
        }

        categoriesSet.add(category);

        // Parse time safely
        let time = 0;
        try {
          const parsedTime = parseInt(timeStr);
          if (!isNaN(parsedTime) && parsedTime >= 0) {
            time = parsedTime;
          }
        } catch (e) {
          console.warn('Invalid time value:', timeStr);
        }

        const activity: Activity = {
          id: `${currentSheetInfo.sheet}-${activityName}-${category}-${Date.now()}`,
          activity: activityName,
          description: description.replace(/"/g, ''),
          time,
          videoLink: video,
          musicLink: music,
          backingLink: backing,
          resourceLink: resource,
          link: '',
          vocalsLink: '',
          imageLink: '',
          teachingUnit: category,
          category,
          level,
          unitName,
          lessonNumber: currentLessonNumber || '1', // Default to lesson 1 if no lesson number
          eyfsStandards: []
        };

        activities.push(activity);
        
        // Try to add to Supabase if connected
        if (isSupabaseConfigured()) {
          try {
            // Remove id as Supabase will generate its own id
            const { id, uniqueId, ...activityForSupabase } = activity;
            
            // Convert camelCase to snake_case for database
            const dbActivity = {
              activity: activityForSupabase.activity,
              description: activityForSupabase.description,
              activity_text: activityForSupabase.activityText,
              time: activityForSupabase.time,
              video_link: activityForSupabase.videoLink,
              music_link: activityForSupabase.musicLink,
              backing_link: activityForSupabase.backingLink,
              resource_link: activityForSupabase.resourceLink,
              link: activityForSupabase.link,
              vocals_link: activityForSupabase.vocalsLink,
              image_link: activityForSupabase.imageLink,
              teaching_unit: activityForSupabase.teachingUnit,
              category: activityForSupabase.category,
              level: activityForSupabase.level,
              unit_name: activityForSupabase.unitName,
              lesson_number: activityForSupabase.lessonNumber,
              eyfs_standards: activityForSupabase.eyfsStandards
            };
            
            supabase
              .from(TABLES.ACTIVITIES)
              .upsert([dbActivity], { 
                onConflict: 'activity,category,lesson_number',
                ignoreDuplicates: false
              })
              .then(({ error }) => {
                if (error) {
                  console.warn('Failed to add activity to Supabase:', error);
                }
              });
          } catch (error) {
            console.warn('Failed to add activity to Supabase:', error);
          }
        }
      }

      console.log(`Processed ${currentSheetInfo.sheet} activities:`, activities.length);
      console.log(`${currentSheetInfo.sheet} lesson numbers found:`, Array.from(lessonNumbersSet));
      console.log(`${currentSheetInfo.sheet} categories found:`, Array.from(categoriesSet));

      // Set lesson numbers and teaching units
      const sortedLessonNumbers = Array.from(lessonNumbersSet)
        .filter(num => num && !isNaN(parseInt(num)))
        .sort((a, b) => parseInt(a) - parseInt(b));
      
      setLessonNumbers(sortedLessonNumbers);
      setTeachingUnits(Array.from(categoriesSet).sort());

      // Group activities by lesson
      const lessonsData: Record<string, LessonData> = {};
      
      sortedLessonNumbers.forEach(lessonNum => {
        const lessonActivities = activities.filter(activity => activity.lessonNumber === lessonNum);

        const grouped: Record<string, Activity[]> = {};
        const categoriesInLesson = new Set<string>();
        let totalTime = 0;

        lessonActivities.forEach(activity => {
          if (!grouped[activity.category]) {
            grouped[activity.category] = [];
          }
          grouped[activity.category].push(activity);
          categoriesInLesson.add(activity.category);
          totalTime += activity.time;
        });

        // Sort categories according to the predefined order
        const categoryOrder = sortCategoriesByOrder(Array.from(categoriesInLesson));

        // Generate a title for the lesson based on its content
        const title = generateDefaultLessonTitle({
          grouped,
          categoryOrder,
          totalTime,
          eyfsStatements: []
        });

        lessonsData[lessonNum] = {
          grouped,
          categoryOrder,
          totalTime,
          eyfsStatements: [],
          title // Add the generated title
        };
      });

      console.log(`${currentSheetInfo.sheet} lessons data structure:`, Object.keys(lessonsData));
      console.log(`Sample ${currentSheetInfo.sheet} lesson category order:`, lessonsData[sortedLessonNumbers[0]]?.categoryOrder);
      setAllLessonsData(lessonsData);

      // Set EYFS statements for each lesson
      const eyfsStatementsMap: Record<string, string[]> = {};
      sortedLessonNumbers.forEach(lessonNum => {
        eyfsStatementsMap[lessonNum] = [];
      });
      setEyfsStatements(eyfsStatementsMap);

      // Save data to localStorage first (this is guaranteed to work)
      saveDataToLocalStorage(lessonsData, sortedLessonNumbers, Array.from(categoriesSet), eyfsStatementsMap);
      
      // Then try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        try {
          await saveDataToSupabase(lessonsData, sortedLessonNumbers, Array.from(categoriesSet), eyfsStatementsMap);
        } catch (error) {
          console.warn(`Failed to save ${currentSheetInfo.sheet} data to Supabase, but data is saved locally:`, error);
        }
      }

      // Update activities state with the new activities
      setAllActivities(prev => {
        // Combine existing activities with new ones, removing duplicates
        const existingMap = new Map(prev.map(a => [`${a.activity}-${a.category}-${a.lessonNumber}`, a]));
        
        activities.forEach(activity => {
          const key = `${activity.activity}-${activity.category}-${activity.lessonNumber}`;
          existingMap.set(key, activity);
        });
        
        const combinedActivities = Array.from(existingMap.values());
        
        // Save to localStorage
        localStorage.setItem('library-activities', JSON.stringify(combinedActivities));
        
        return combinedActivities;
      });

    } catch (error) {
      console.error(`Error processing ${currentSheetInfo.sheet} sheet data:`, error);
      // Set empty data instead of minimal fallback data
      setLessonNumbers([]);
      setTeachingUnits([]);
      setAllLessonsData({});
      setEyfsStatements({});
      
      // Save empty data to localStorage
      saveDataToLocalStorage({}, [], [], {});
    }
  };

  const saveDataToSupabase = async (
    lessonsData: Record<string, LessonData>, 
    lessonNums: string[], 
    categories: string[],
    eyfsStatementsData: Record<string, string[]>
  ) => {
    const dataToSave = {
      allLessonsData: lessonsData,
      lessonNumbers: lessonNums,
      teachingUnits: categories,
      eyfsStatements: eyfsStatementsData
    };
    
    try {
      await lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave);
      console.log(`Saved ${currentSheetInfo.sheet} data to Supabase`);
      return true;
    } catch (error) {
      console.warn(`Failed to save ${currentSheetInfo.sheet} data to Supabase:`, error);
      // Don't throw the error, just return false to indicate failure
      return false;
    }
  };

  const saveDataToLocalStorage = (
    lessonsData: Record<string, LessonData>, 
    lessonNums: string[], 
    categories: string[],
    eyfsStatementsData: Record<string, string[]>
  ) => {
    const dataToSave = {
      allLessonsData: lessonsData,
      lessonNumbers: lessonNums,
      teachingUnits: categories,
      eyfsStatements: eyfsStatementsData
    };
    
    localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));
    console.log(`Saved ${currentSheetInfo.sheet} data to localStorage (backup)`);
    return true;
  };

  const uploadExcelFile = async (file: File) => {
    try {
      setLoading(true);
      
      // Read the Excel file
      const data = await readExcelFile(file);
      
      if (!data || data.length === 0) {
        throw new Error('No data found in the file.');
      }
      
      console.log('Excel data loaded:', data.slice(0, 5)); // Log first 5 rows
      
      // Process the data
      await processSheetData(data);
      
      return true;
    } catch (error) {
      console.error('Excel upload failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('Failed to read file.'));
            return;
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          resolve(jsonData as string[][]);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file.'));
      };

      reader.readAsBinaryString(file);
    });
  };

  const refreshData = async () => {
    await loadData();
    await loadEyfsStatements();
    loadUserCreatedLessonPlans();
    loadActivities();
    loadUnits();
    loadHalfTerms();
  };

  // Add EYFS statement to a lesson
  const addEyfsToLesson = async (lessonNumber: string, eyfsStatement: string) => {
    setEyfsStatements(prev => {
      const updatedStatements = { ...prev };
      if (!updatedStatements[lessonNumber]) {
        updatedStatements[lessonNumber] = [];
      }
      if (!updatedStatements[lessonNumber].includes(eyfsStatement)) {
        updatedStatements[lessonNumber] = [...updatedStatements[lessonNumber], eyfsStatement];
      }
      
      // Save to localStorage first (this is guaranteed to work)
      saveDataToLocalStorage(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
      // Try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        saveDataToSupabase(
          allLessonsData, 
          lessonNumbers, 
          teachingUnits, 
          updatedStatements
        ).catch(error => console.warn('Failed to save EYFS statements to Supabase:', error));
      }
      
      return updatedStatements;
    });

    setAllLessonsData(prev => {
      const updatedLessonsData = { ...prev };
      if (updatedLessonsData[lessonNumber]) {
        const currentStatements = updatedLessonsData[lessonNumber].eyfsStatements || [];
        if (!currentStatements.includes(eyfsStatement)) {
          updatedLessonsData[lessonNumber] = {
            ...updatedLessonsData[lessonNumber],
            eyfsStatements: [...currentStatements, eyfsStatement]
          };
        }
      }
      return updatedLessonsData;
    });
  };

  // Remove EYFS statement from a lesson
  const removeEyfsFromLesson = async (lessonNumber: string, eyfsStatement: string) => {
    setEyfsStatements(prev => {
      const updatedStatements = { ...prev };
      if (updatedStatements[lessonNumber]) {
        updatedStatements[lessonNumber] = updatedStatements[lessonNumber].filter(
          statement => statement !== eyfsStatement
        );
      }
      
      // Save to localStorage first (this is guaranteed to work)
      saveDataToLocalStorage(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
      // Try to save to Supabase if connected
      if (isSupabaseConfigured()) {
        saveDataToSupabase(
          allLessonsData, 
          lessonNumbers, 
          teachingUnits, 
          updatedStatements
        ).catch(error => console.warn('Failed to save EYFS statements to Supabase:', error));
      }
      
      return updatedStatements;
    });

    setAllLessonsData(prev => {
      const updatedLessonsData = { ...prev };
      if (updatedLessonsData[lessonNumber] && updatedLessonsData[lessonNumber].eyfsStatements) {
        updatedLessonsData[lessonNumber] = {
          ...updatedLessonsData[lessonNumber],
          eyfsStatements: updatedLessonsData[lessonNumber].eyfsStatements!.filter(
            statement => statement !== eyfsStatement
          )
        };
      }
      return updatedLessonsData;
    });
  };

  // Update all EYFS statements
  const updateAllEyfsStatements = async (statements: string[]) => {
    setAllEyfsStatements(statements);
    
    // Save to localStorage first
    localStorage.setItem(`eyfs-statements-flat-${currentSheetInfo.sheet}`, JSON.stringify(statements));
    localStorage.setItem(`eyfs-standards-${currentSheetInfo.sheet}`, JSON.stringify(structureEyfsStatements(statements)));
    
    // Try to save to Supabase if connected
    if (isSupabaseConfigured()) {
      try {
        await eyfsApi.updateSheet(currentSheetInfo.sheet, {
          allStatements: statements,
          structuredStatements: structureEyfsStatements(statements)
        });
      } catch (error) {
        console.error('Failed to save EYFS statements to Supabase:', error);
      }
    }
  };

  // Update lesson title
  const updateLessonTitle = (lessonNumber: string, title: string) => {
    setAllLessonsData(prev => {
      const updatedLessonsData = { ...prev };
      if (updatedLessonsData[lessonNumber]) {
        updatedLessonsData[lessonNumber] = {
          ...updatedLessonsData[lessonNumber],
          title
        };
        
        // Save to localStorage first (this is guaranteed to work)
        saveDataToLocalStorage(
          updatedLessonsData,
          lessonNumbers,
          teachingUnits,
          eyfsStatements
        );
        
        // Try to save to Supabase if connected
        if (isSupabaseConfigured()) {
          saveDataToSupabase(
            updatedLessonsData,
            lessonNumbers,
            teachingUnits,
            eyfsStatements
          ).catch(error => console.warn('Failed to save lesson title to Supabase:', error));
        }
      }
      return updatedLessonsData;
    });
  };

  // Helper to structure EYFS statements by area
  const structureEyfsStatements = (statements: string[]) => {
    const structuredStatements: Record<string, string[]> = {};
    statements.forEach(statement => {
      const parts = statement.split(':');
      const area = parts[0].trim();
      const detail = parts.length > 1 ? parts[1].trim() : statement;
      
      if (!structuredStatements[area]) {
        structuredStatements[area] = [];
      }
      
      structuredStatements[area].push(detail);
    });
    return structuredStatements;
  };

  const value = {
    currentSheetInfo,
    setCurrentSheetInfo,
    lessonNumbers,
    teachingUnits,
    allLessonsData,
    eyfsStatements,
    allEyfsStatements,
    loading,
    refreshData,
    uploadExcelFile,
    addEyfsToLesson,
    removeEyfsFromLesson,
    updateAllEyfsStatements,
    updateLessonTitle,
    userCreatedLessonPlans,
    addOrUpdateUserLessonPlan,
    deleteUserLessonPlan,
    deleteLesson,
    allActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    units,
    updateUnit,
    deleteUnit,
    halfTerms,
    updateHalfTerm,
    getLessonsForHalfTerm  // ADDED: The missing function
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
