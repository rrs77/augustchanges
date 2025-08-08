import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as XLSX from 'xlsx';
import { activitiesApi, lessonsApi, eyfsApi } from '../config/api';
import { supabase, TABLES, isSupabaseConfigured } from '../config/supabase';

// Define types locally to avoid circular imports
export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface SubjectCategory {
  id: string;
  subject_id: string;
  name: string;
  description?: string;
  color: string;
  sort_order: number;
  is_locked: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface UserSubjectAccess {
  id: string;
  user_id: string;
  subject_id: string;
  access_level: 'read' | 'write' | 'admin';
  created_at?: string;
}

export interface Activity {
  id?: string;
  _id?: string;
  activity: string;
  description: string;
  activityText?: string;
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
  _uniqueId?: string;
}

export interface LessonData {
  grouped: Record<string, Activity[]>;
  categoryOrder: string[];
  totalTime: number;
  eyfsStatements?: string[];
  title?: string;
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
  time?: string;
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
  userCreatedLessonPlans: LessonPlan[];
  addOrUpdateUserLessonPlan: (plan: LessonPlan) => void;
  updateLessonData?: (lessonNumber: string, updatedData: any) => void;
  deleteUserLessonPlan: (planId: string) => void;
  deleteLesson: (lessonNumber: string) => void;
  allActivities: Activity[];
  addActivity: (activity: Activity) => Promise<Activity>;
  updateActivity: (activity: Activity) => Promise<Activity>;
  deleteActivity: (activityId: string) => Promise<void>;
  units: Unit[];
  updateUnit: (unit: Unit) => void;
  deleteUnit: (unitId: string) => void;
  halfTerms: HalfTerm[];
  updateHalfTerm: (halfTermId: string, lessons: string[], isComplete: boolean) => void;
  getLessonsForHalfTerm: (halfTermId: string) => string[];
  
  // Subject Management
  subjects: Subject[];
  subjectCategories: SubjectCategory[];
  currentSubject: Subject | null;
  setCurrentSubject: (subject: Subject | null) => void;
  loadSubjects: () => Promise<void>;
  loadSubjectCategories: (subjectId: string) => Promise<void>;
  createSubject: (subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => Promise<Subject>;
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<Subject>;
  deleteSubject: (id: string) => Promise<void>;
  createSubjectCategory: (category: Omit<SubjectCategory, 'id' | 'created_at' | 'updated_at'>) => Promise<SubjectCategory>;
  updateSubjectCategory: (id: string, category: Partial<SubjectCategory>) => Promise<SubjectCategory>;
  deleteSubjectCategory: (id: string) => Promise<void>;
  reorderSubjectCategories: (subjectId: string, categoryIds: string[]) => Promise<void>;
  toggleCategoryLock: (id: string) => Promise<void>;
  toggleCategoryVisibility: (id: string) => Promise<void>;
  debugSubjectSetup?: () => Promise<void>;
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
  const categories = lessonData.categoryOrder;
  if (categories.length === 0) return "Untitled Lesson";
  
  if (categories.includes('Welcome') && categories.includes('Goodbye')) {
    const mainCategories = categories.filter(cat => cat !== 'Welcome' && cat !== 'Goodbye');
    if (mainCategories.length > 0) {
      return `${mainCategories[0]} Lesson`;
    }
    return "Standard Lesson";
  }
  
  if (categories.includes('Kodaly Songs')) return "Kodaly Lesson";
  if (categories.includes('Rhythm Sticks')) return "Rhythm Sticks Lesson";
  if (categories.includes('Percussion Games')) return "Percussion Lesson";
  if (categories.includes('Scarf Songs')) return "Movement with Scarves";
  if (categories.includes('Parachute Games')) return "Parachute Activities";
  if (categories.includes('Action/Games Songs')) return "Action Games Lesson";
  
  return `${categories[0]} Lesson`;
};

// Default half-term periods
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
  const [dataWasCleared, setDataWasCleared] = useState(false);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [halfTerms, setHalfTerms] = useState<HalfTerm[]>(DEFAULT_HALF_TERMS);
  
  // Subject Management state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectCategories, setSubjectCategories] = useState<SubjectCategory[]>([]);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsLoadAttempted, setSubjectsLoadAttempted] = useState(false);

  // Helper function to sort categories by order
  const sortCategoriesByOrder = (categories: string[]): string[] => {
    return categories.sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return a.localeCompare(b);
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

  // Debug function to help diagnose database issues
  const debugSubjectSetup = async () => {
    console.log('🔧 DEBUGGING SUBJECT SETUP...');
    
    const isConfigured = isSupabaseConfigured();
    console.log('📊 Supabase configured:', isConfigured);
    
    if (!isConfigured) {
      console.log('❌ Supabase is not configured. Check your environment variables.');
      return;
    }
    
    try {
      console.log('🔗 Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('subjects')
        .select('count(*)', { count: 'exact', head: true });
      
      if (testError) {
        console.error('❌ Connection test failed:', testError);
        
        if (testError.message.includes('relation "subjects" does not exist')) {
          console.error('💥 SUBJECTS TABLE DOES NOT EXIST! Please create it in Supabase.');
          console.log('📝 Run this SQL in your Supabase SQL editor:');
          console.log(`
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE subject_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Insert sample subjects
INSERT INTO subjects (name, description, color) VALUES 
  ('Music', 'Music education activities and lessons', '#3b82f6'),
  ('Drama', 'Drama and performance activities', '#ef4444'),
  ('EYFS', 'Early Years Foundation Stage activities', '#10b981');
          `);
        }
        return;
      }
      
      console.log('✅ Connection successful!');
      
      const { data: subjects, error: dataError } = await supabase
        .from('subjects')
        .select('*');
        
      if (dataError) {
        console.error('❌ Error fetching subjects:', dataError);
        return;
      }
      
      console.log('📊 Found subjects:', subjects?.length || 0);
      console.log('📋 Subjects data:', subjects);
      
    } catch (error) {
      console.error('💥 Debug failed:', error);
    }
  };

  // Subject Management functions
  const loadSubjects = async (): Promise<void> => {
    try {
      console.log('🔄 Loading subjects...');
      
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase is not configured. Setting empty subjects array.');
        setSubjects([]);
        return;
      }
      
      console.log('📡 Querying subjects from Supabase...');
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('❌ Failed to load subjects from Supabase:', error);
        console.log('🔧 Running debug to help diagnose the issue...');
        await debugSubjectSetup();
        setSubjects([]);
        return;
      }
      
      console.log('✅ Successfully loaded subjects:', data?.length || 0, 'subjects');
      setSubjects(data || []);
      setSubjectsLoading(false);
    } catch (error) {
      console.error('💥 Exception while loading subjects:', error);
      setSubjects([]);
    } finally {
      console.log('🏁 Setting subjectsLoading to false');
      setSubjectsLoading(false);
      setSubjectsLoadAttempted(true);
    }
  };

  const loadSubjectCategories = async (subjectId: string): Promise<void> => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('subject_categories')
          .select('*')
          .eq('subject_id', subjectId)
          .order('sort_order');
        
        if (error) {
          console.error('Failed to load subject categories from Supabase:', error);
          return;
        }
        
        setSubjectCategories(data || []);
      }
    } catch (error) {
      console.error('Failed to load subject categories:', error);
    }
  };

  const createSubject = async (subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('subjects')
        .insert([subject])
        .select()
        .single();

      if (error) {
        console.error('Failed to create subject:', error);
        throw error;
      }

      const newSubject = data as Subject;
      setSubjects(prev => [...prev, newSubject]);
      return newSubject;
    } catch (error) {
      console.error('Failed to create subject:', error);
      throw error;
    }
  };

  const updateSubject = async (id: string, subject: Partial<Subject>): Promise<Subject> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('subjects')
        .update(subject)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update subject:', error);
        throw error;
      }

      const updatedSubject = data as Subject;
      setSubjects(prev => prev.map(s => s.id === id ? updatedSubject : s));
      return updatedSubject;
    } catch (error) {
      console.error('Failed to update subject:', error);
      throw error;
    }
  };

  const deleteSubject = async (id: string): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { error } = await supabase
        .from('subjects')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Failed to delete subject:', error);
        throw error;
      }

      setSubjects(prev => prev.filter(s => s.id !== id));
      
      if (currentSubject?.id === id) {
        setCurrentSubject(null);
        setSubjectCategories([]);
      }
    } catch (error) {
      console.error('Failed to delete subject:', error);
      throw error;
    }
  };

  const createSubjectCategory = async (category: Omit<SubjectCategory, 'id' | 'created_at' | 'updated_at'>): Promise<SubjectCategory> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('subject_categories')
        .insert([category])
        .select()
        .single();

      if (error) {
        console.error('Failed to create subject category:', error);
        throw error;
      }

      const newCategory = data as SubjectCategory;
      setSubjectCategories(prev => [...prev, newCategory].sort((a, b) => a.sort_order - b.sort_order));
      return newCategory;
    } catch (error) {
      console.error('Failed to create subject category:', error);
      throw error;
    }
  };

  const updateSubjectCategory = async (id: string, category: Partial<SubjectCategory>): Promise<SubjectCategory> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('subject_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update subject category:', error);
        throw error;
      }

      const updatedCategory = data as SubjectCategory;
      setSubjectCategories(prev => prev.map(c => c.id === id ? updatedCategory : c).sort((a, b) => a.sort_order - b.sort_order));
      return updatedCategory;
    } catch (error) {
      console.error('Failed to update subject category:', error);
      throw error;
    }
  };

  const deleteSubjectCategory = async (id: string): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { error } = await supabase
        .from('subject_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete subject category:', error);
        throw error;
      }

      setSubjectCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete subject category:', error);
      throw error;
    }
  };

  const reorderSubjectCategories = async (subjectId: string, categoryIds: string[]): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const updates = categoryIds.map((categoryId, index) => ({
        id: categoryId,
        sort_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('subject_categories')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) {
          console.error('Failed to reorder subject category:', error);
          throw error;
        }
      }

      await loadSubjectCategories(subjectId);
    } catch (error) {
      console.error('Failed to reorder subject categories:', error);
      throw error;
    }
  };

  const toggleCategoryLock = async (id: string): Promise<void> => {
    try {
      const category = subjectCategories.find(c => c.id === id);
      if (!category) return;

      await updateSubjectCategory(id, { is_locked: !category.is_locked });
    } catch (error) {
      console.error('Failed to toggle category lock:', error);
      throw error;
    }
  };

  const toggleCategoryVisibility = async (id: string): Promise<void> => {
    try {
      const category = subjectCategories.find(c => c.id === id);
      if (!category) return;

      await updateSubjectCategory(id, { is_active: !category.is_active });
    } catch (error) {
      console.error('Failed to toggle category visibility:', error);
      throw error;
    }
  };

  const handleSetCurrentSubject = (subject: Subject | null) => {
    setCurrentSubject(subject);
    if (subject) {
      loadSubjectCategories(subject.id);
    } else {
      setSubjectCategories([]);
    }
  };

  // Load units for the current class
  const loadUnits = () => {
    try {
      if (dataWasCleared) {
        setUnits([]);
        return;
      }
      
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
        setUnits([]);
        localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Failed to load units:', error);
      setUnits([]);
    }
  };

  const updateUnit = (unit: Unit) => {
    setUnits(prev => {
      const index = prev.findIndex(u => u.id === unit.id);
      if (index !== -1) {
        const updatedUnits = [...prev];
        updatedUnits[index] = { ...unit, updatedAt: new Date() };
        localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
        return updatedUnits;
      } else {
        const newUnits = [...prev, { ...unit, createdAt: new Date(), updatedAt: new Date() }];
        localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(newUnits));
        return newUnits;
      }
    });
  };

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
      if (dataWasCleared) {
        setHalfTerms(DEFAULT_HALF_TERMS);
        return;
      }
      
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
        setHalfTerms(DEFAULT_HALF_TERMS);
        localStorage.setItem(`half-terms-${currentSheetInfo.sheet}`, JSON.stringify(DEFAULT_HALF_TERMS));
      }
    } catch (error) {
      console.error('Failed to load half-terms:', error);
      setHalfTerms(DEFAULT_HALF_TERMS);
    }
  };

  const updateHalfTerm = (halfTermId: string, lessons: string[], isComplete: boolean) => {
    setHalfTerms(prev => {
      const updatedHalfTerms = prev.map(term => 
        term.id === halfTermId ? { ...term, lessons, isComplete } : term
      );
      localStorage.setItem(`half-terms-${currentSheetInfo.sheet}`, JSON.stringify(updatedHalfTerms));
      return updatedHalfTerms;
    });
  };

  const getLessonsForHalfTerm = (halfTermId: string): string[] => {
    const halfTerm = halfTerms.find(term => term.id === halfTermId);
    return halfTerm ? halfTerm.lessons : [];
  };

  // Load all activities
  const loadActivities = async () => {
    try {
      setLoading(true);
      
      if (dataWasCleared) {
        setAllActivities([]);
        return;
      }
      
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
      
      const savedActivities = localStorage.getItem('library-activities');
      if (savedActivities) {
        setAllActivities(JSON.parse(savedActivities));
        return;
      }
      
      const extractedActivities: Activity[] = [];
      Object.values(allLessonsData).forEach(lessonData => {
        Object.values(lessonData.grouped).forEach(categoryActivities => {
          extractedActivities.push(...categoryActivities);
        });
      });
      
      const uniqueActivities = extractedActivities.filter((activity, index, self) => 
        index === self.findIndex(a => a.activity === activity.activity && a.category === activity.category)
      );
      
      setAllActivities(uniqueActivities);
      localStorage.setItem('library-activities', JSON.stringify(uniqueActivities));
      
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
      let newActivity = activity;
      if (isSupabaseConfigured()) {
        try {
          newActivity = await activitiesApi.create(activity);
        } catch (error) {
          console.warn('Failed to add activity to Supabase:', error);
          newActivity = { ...activity, _id: `local-${Date.now()}` };
        }
      } else {
        newActivity = { ...activity, _id: `local-${Date.now()}` };
      }
      
      setAllActivities(prev => [...prev, newActivity]);
      
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
      let updatedActivity = activity;
      if (isSupabaseConfigured() && activity._id) {
        try {
          updatedActivity = await activitiesApi.update(activity._id, activity);
        } catch (error) {
          console.warn('Failed to update activity in Supabase:', error);
        }
      }
      
      setAllActivities(prev => prev.map(a => (a._id === activity._id) ? updatedActivity : a));
      
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
      if (isSupabaseConfigured()) {
        try {
          await activitiesApi.delete(activityId);
        } catch (error) {
          console.warn('Failed to delete activity from Supabase:', error);
        }
      }
      
      setAllActivities(prev => prev.filter(a => a._id !== activityId && a.id !== activityId));
      
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
      if (dataWasCleared) {
        setUserCreatedLessonPlans([]);
        return;
      }
      
      if (isSupabaseConfigured()) {
        supabase
          .from(TABLES.LESSON_PLANS)
          .select('*')
          .then(({ data, error }) => {
            if (error) {
              console.warn('Failed to load lesson plans from Supabase:', error);
              loadUserCreatedLessonPlansFromLocalStorage();
            } else if (data) {
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
      localStorage.setItem('user-created-lesson-plans', JSON.stringify(plans));
      
      if (isSupabaseConfigured()) {
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
      const existingPlanIndex = prev.findIndex(p => p.id === plan.id);
      
      let updatedPlans: LessonPlan[];
      if (existingPlanIndex >= 0) {
        updatedPlans = [...prev];
        updatedPlans[existingPlanIndex] = { ...plan, updatedAt: new Date() };
      } else {
        updatedPlans = [...prev, { ...plan, createdAt: new Date(), updatedAt: new Date() }];
      }
      
      saveUserCreatedLessonPlans(updatedPlans);
      
      if (plan.lessonNumber) {
        updateAllLessonsDataWithUserPlan(plan);
      }
      
      return updatedPlans;
    });
  };

  const updateLessonData = (lessonNumber: string, updatedData: any) => {
    setAllLessonsData(prev => ({
      ...prev,
      [lessonNumber]: updatedData
    }));
  };

  // FIXED: Delete a user-created lesson plan with automatic reindexing
  const deleteUserLessonPlan = async (planId: string) => {
    try {
      const lessonToDelete = userCreatedLessonPlans.find(p => p.id === planId);
      
      if (!lessonToDelete || !lessonToDelete.lessonNumber) {
        setUserCreatedLessonPlans(prev => {
          const updatedPlans = prev.filter(p => p.id !== planId);
          localStorage.setItem('user-created-lesson-plans', JSON.stringify(updatedPlans));
          return updatedPlans;
        });
        return;
      }
      
      const deletedLessonNumber = parseInt(lessonToDelete.lessonNumber);
      
      setUserCreatedLessonPlans(prev => {
        let updatedPlans = prev.filter(p => p.id !== planId);
        
        const classLessons = updatedPlans
          .filter(plan => plan.className === lessonToDelete.className && plan.lessonNumber)
          .sort((a, b) => parseInt(a.lessonNumber!) - parseInt(b.lessonNumber!));
        
        const lessonNumberMapping: Record<string, string> = {};
        
        classLessons.forEach((lesson, index) => {
          const oldNumber = parseInt(lesson.lessonNumber!);
          const newNumber = (index + 1).toString();
          
          lessonNumberMapping[lesson.lessonNumber!] = newNumber;
          
          lesson.lessonNumber = newNumber;
          lesson.updatedAt = new Date();
        });
        
        setAllLessonsData(prevLessonsData => {
          const updatedLessonsData = { ...prevLessonsData };
          
          delete updatedLessonsData[deletedLessonNumber.toString()];
          
          Object.keys(lessonNumberMapping).forEach(oldNumber => {
            const newNumber = lessonNumberMapping[oldNumber];
            if (updatedLessonsData[oldNumber] && oldNumber !== newNumber) {
              updatedLessonsData[newNumber] = updatedLessonsData[oldNumber];
              delete updatedLessonsData[oldNumber];
              
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
        
        setLessonNumbers(prevNumbers => {
          const updatedNumbers = prevNumbers
            .filter(num => num !== deletedLessonNumber.toString())
            .map(num => lessonNumberMapping[num] || num)
            .sort((a, b) => parseInt(a) - parseInt(b));
          
          return updatedNumbers;
        });
        
        setEyfsStatements(prevStatements => {
          const updatedStatements = { ...prevStatements };
          
          delete updatedStatements[deletedLessonNumber.toString()];
          
          Object.keys(lessonNumberMapping).forEach(oldNumber => {
            const newNumber = lessonNumberMapping[oldNumber];
            if (updatedStatements[oldNumber] && oldNumber !== newNumber) {
              updatedStatements[newNumber] = updatedStatements[oldNumber];
              delete updatedStatements[oldNumber];
            }
          });
          
          return updatedStatements;
        });
        
        setHalfTerms(prevHalfTerms => {
          const updatedHalfTerms = prevHalfTerms.map(term => {
            const updatedLessons = term.lessons
              .filter(lessonNum => lessonNum !== deletedLessonNumber.toString())
              .map(lessonNum => lessonNumberMapping[lessonNum] || lessonNum);
            
            return { ...term, lessons: updatedLessons };
          });
          
          localStorage.setItem(`half-terms-${lessonToDelete.className}`, JSON.stringify(updatedHalfTerms));
          return updatedHalfTerms;
        });
        
        const savedUnits = localStorage.getItem(`units-${lessonToDelete.className}`);
        if (savedUnits) {
          try {
            const units = JSON.parse(savedUnits);
            const updatedUnits = units.map((unit: any) => {
              const updatedLessonNumbers = unit.lessonNumbers
                .filter((num: string) => num !== deletedLessonNumber.toString())
                .map((num: string) => lessonNumberMapping[num] || num);
              
              return { ...unit, lessonNumbers: updatedLessonNumbers, updatedAt: new Date() };
            });
            
            localStorage.setItem(`units-${lessonToDelete.className}`, JSON.stringify(updatedUnits));
            setUnits(updatedUnits);
          } catch (error) {
            console.error('Failed to update units after lesson deletion:', error);
          }
        }
        
        localStorage.setItem('user-created-lesson-plans', JSON.stringify(updatedPlans));
        
        const dataToSave = {
          allLessonsData: allLessonsData,
          lessonNumbers: lessonNumbers,
          teachingUnits,
          eyfsStatements
        };
        
        localStorage.setItem(`lesson-data-${lessonToDelete.className}`, JSON.stringify(dataToSave));
        
        return updatedPlans;
      });
      
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
    setAllLessonsData(prev => {
      const updated = { ...prev };
      delete updated[lessonNumber];
      return updated;
    });

    setLessonNumbers(prev => prev.filter(num => num !== lessonNumber));

    setEyfsStatements(prev => {
      const updated = { ...prev };
      delete updated[lessonNumber];
      return updated;
    });

    const dataToSave = {
      allLessonsData: { ...allLessonsData },
      lessonNumbers: lessonNumbers.filter(num => num !== lessonNumber),
      teachingUnits,
      eyfsStatements: { ...eyfsStatements }
    };

    delete dataToSave.allLessonsData[lessonNumber];
    delete dataToSave.eyfsStatements[lessonNumber];

    localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));

    if (isSupabaseConfigured()) {
      lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave)
        .catch(error => console.warn(`Failed to update Supabase after deleting lesson ${lessonNumber}:`, error));
    }

    setUserCreatedLessonPlans(prev => {
      const updatedPlans = prev.filter(plan => plan.lessonNumber !== lessonNumber);
      saveUserCreatedLessonPlans(updatedPlans);
      return updatedPlans;
    });

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

    try {
      const savedHalfTerms = localStorage.getItem(`half-terms-${currentSheetInfo.sheet}`);
      if (savedHalfTerms) {
        const halfTerms = JSON.parse(savedHalfTerms);
        let halfTermsUpdated = false;

        const updatedHalfTerms = halfTerms.map((term: any) => {
          if (term.lessons.includes(lessonNumber)) {
            halfTermsUpdated = true;
            return { ...term, lessons: term.lessons.filter((num: string) => num !== lessonNumber) };
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
    
    const grouped: Record<string, Activity[]> = {};
    const categoriesInLesson = new Set<string>();
    let totalTime = 0;
    
    plan.activities.forEach(activity => {
      if (!grouped[activity.category]) {
        grouped[activity.category] = [];
      }
      grouped[activity.category].push({ ...activity, lessonNumber: plan.lessonNumber || '' });
      categoriesInLesson.add(activity.category);
      totalTime += activity.time || 0;
    });
    
    const categoryOrder = sortCategoriesByOrder(Array.from(categoriesInLesson));
    
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
    
    setLessonNumbers(prev => {
      if (!prev.includes(plan.lessonNumber!)) {
        const updated = [...prev, plan.lessonNumber!];
        return updated.sort((a, b) => parseInt(a) - parseInt(b));
      }
      return prev;
    });
    
    const dataToSave = {
      allLessonsData: { ...allLessonsData, [plan.lessonNumber!]: lessonData },
      lessonNumbers: lessonNumbers.includes(plan.lessonNumber!) 
        ? lessonNumbers 
        : [...lessonNumbers, plan.lessonNumber!].sort((a, b) => parseInt(a) - parseInt(b)),
      teachingUnits,
      eyfsStatements
    };
    
    localStorage.setItem(`lesson-data-${currentSheetInfo.sheet}`, JSON.stringify(dataToSave));
    
    if (isSupabaseConfigured()) {
      lessonsApi.updateSheet(currentSheetInfo.sheet, dataToSave)
        .catch(error => console.warn(`Failed to update Supabase with user plan for lesson ${plan.lessonNumber}:`, error));
    }
  };

  const loadEyfsStatements = async () => {
    try {
      if (dataWasCleared) {
        setAllEyfsStatements(DEFAULT_EYFS_STATEMENTS);
        return;
      }
      
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
      
      const savedStandards = localStorage.getItem(`eyfs-standards-${currentSheetInfo.sheet}`);
      if (savedStandards) {
        try {
          const parsedStandards = JSON.parse(savedStandards);
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
      
      if (dataWasCleared) {
        console.log(`Data was cleared, setting empty state for ${currentSheetInfo.sheet}`);
        setAllLessonsData({});
        setLessonNumbers([]);
        setTeachingUnits([]);
        setEyfsStatements({});
        setLoading(false);
        return;
      }
      
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
      
      const savedData = localStorage.getItem(`lesson-data-${currentSheetInfo.sheet}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setAllLessonsData(parsedData.allLessonsData || {});
        setLessonNumbers(parsedData.lessonNumbers || []);
        setTeachingUnits(parsedData.teachingUnits || []);
        setEyfsStatements(parsedData.eyfsStatements || {});
        console.log(`Loaded ${currentSheetInfo.sheet} data from localStorage`);
        
        if (isSupabaseConfigured()) {
          lessonsApi.updateSheet(currentSheetInfo.sheet, parsedData)
            .then(() => console.log(`Migrated ${currentSheetInfo.sheet} data to Supabase`))
            .catch(serverError => console.warn(`Failed to migrate ${currentSheetInfo.sheet} data to Supabase:`, serverError));
        }
      } else {
        if (dataWasCleared) {
          console.log(`Data was cleared, setting empty state for ${currentSheetInfo.sheet}`);
          setAllLessonsData({});
          setLessonNumbers([]);
          setTeachingUnits([]);
          setEyfsStatements({});
          setDataWasCleared(false);
        } else {
          await loadSampleData();
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      if (dataWasCleared) {
        console.log(`Data was cleared, setting empty state for ${currentSheetInfo.sheet}`);
        setAllLessonsData({});
        setLessonNumbers([]);
        setTeachingUnits([]);
        setEyfsStatements({});
        setDataWasCleared(false);
      } else {
        await loadSampleData();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = async () => {
    try {
      console.log(`Loading sample data for ${currentSheetInfo.sheet}`);
      setLessonNumbers([]);
      setTeachingUnits([]);
      setAllLessonsData({});
      setEyfsStatements({});
      console.log(`Set empty data for ${currentSheetInfo.sheet}`);
    } catch (error) {
      console.error(`Sample data loading failed for ${currentSheetInfo.sheet}:`, error);
      setLessonNumbers([]);
      setTeachingUnits([]);
      setAllLessonsData({});
      setEyfsStatements({});
    }
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
        if (!row || row.length < 3) continue;

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

        if (!category || !activityName) continue;

        if (lessonNumber) {
          currentLessonNumber = lessonNumber;
          lessonNumbersSet.add(lessonNumber);
        }

        categoriesSet.add(category);

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
          lessonNumber: currentLessonNumber || '1',
          eyfsStandards: []
        };

        activities.push(activity);
        
        if (isSupabaseConfigured()) {
          try {
            const { id, _uniqueId, ...activityForSupabase } = activity;
            
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

      const sortedLessonNumbers = Array.from(lessonNumbersSet)
        .filter(num => num && !isNaN(parseInt(num)))
        .sort((a, b) => parseInt(a) - parseInt(b));
      
      setLessonNumbers(sortedLessonNumbers);
      setTeachingUnits(Array.from(categoriesSet).sort());

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

        const categoryOrder = sortCategoriesByOrder(Array.from(categoriesInLesson));

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
          title
        };
      });

      console.log(`${currentSheetInfo.sheet} lessons data structure:`, Object.keys(lessonsData));
      console.log(`Sample ${currentSheetInfo.sheet} lesson category order:`, lessonsData[sortedLessonNumbers[0]]?.categoryOrder);
      setAllLessonsData(lessonsData);

      const eyfsStatementsMap: Record<string, string[]> = {};
      sortedLessonNumbers.forEach(lessonNum => {
        eyfsStatementsMap[lessonNum] = [];
      });
      setEyfsStatements(eyfsStatementsMap);

      saveDataToLocalStorage(lessonsData, sortedLessonNumbers, Array.from(categoriesSet), eyfsStatementsMap);
      
      if (isSupabaseConfigured()) {
        try {
          await saveDataToSupabase(lessonsData, sortedLessonNumbers, Array.from(categoriesSet), eyfsStatementsMap);
        } catch (error) {
          console.warn(`Failed to save ${currentSheetInfo.sheet} data to Supabase, but data is saved locally:`, error);
        }
      }

      setAllActivities(prev => {
        const existingMap = new Map(prev.map(a => [`${a.activity}-${a.category}-${a.lessonNumber}`, a]));
        
        activities.forEach(activity => {
          const key = `${activity.activity}-${activity.category}-${activity.lessonNumber}`;
          existingMap.set(key, activity);
        });
        
        const combinedActivities = Array.from(existingMap.values());
        
        localStorage.setItem('library-activities', JSON.stringify(combinedActivities));
        
        return combinedActivities;
      });

    } catch (error) {
      console.error(`Error processing ${currentSheetInfo.sheet} sheet data:`, error);
      setLessonNumbers([]);
      setTeachingUnits([]);
      setAllLessonsData({});
      setEyfsStatements({});
      
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
      
      const data = await readExcelFile(file);
      
      if (!data || data.length === 0) {
        throw new Error('No data found in the file.');
      }
      
      console.log('Excel data loaded:', data.slice(0, 5));
      
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
    await loadSubjects();
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
      
      saveDataToLocalStorage(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
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
      
      saveDataToLocalStorage(
        allLessonsData, 
        lessonNumbers, 
        teachingUnits, 
        updatedStatements
      );
      
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
    
    localStorage.setItem(`eyfs-statements-flat-${currentSheetInfo.sheet}`, JSON.stringify(statements));
    localStorage.setItem(`eyfs-standards-${currentSheetInfo.sheet}`, JSON.stringify(structureEyfsStatements(statements)));
    
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
        
        saveDataToLocalStorage(
          updatedLessonsData,
          lessonNumbers,
          teachingUnits,
          eyfsStatements
        );
        
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

  // Load data on mount and when sheet changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cleared = urlParams.get('cleared');
    if (cleared === 'true') {
      setDataWasCleared(true);
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    loadData();
    loadEyfsStatements();
    loadUserCreatedLessonPlans();
    loadActivities();
    loadUnits();
    loadHalfTerms();
  }, [currentSheetInfo]);

  // Load subjects separately (only once on mount)
  useEffect(() => {
    loadSubjects();
  }, []);

  // Context value
  const contextValue: DataContextType = {
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
    updateLessonData,
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
    getLessonsForHalfTerm,
    
    // Subject Management
    subjects,
    subjectCategories,
    currentSubject,
    setCurrentSubject: handleSetCurrentSubject,
    loadSubjects,
    loadSubjectCategories,
    createSubject,
    updateSubject,
    deleteSubject,
    createSubjectCategory,
    updateSubjectCategory,
    deleteSubjectCategory,
    reorderSubjectCategories,
    toggleCategoryLock,
    toggleCategoryVisibility,
    debugSubjectSetup,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}