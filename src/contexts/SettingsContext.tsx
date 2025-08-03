import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserSettings {
  schoolName: string;
  schoolLogo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customTheme: boolean;
}

export interface CategorySettings {
  name: string;
  color: string;
  position: number;
}

export interface YearGroup {
  id: string;
  name: string;
  color?: string;
}

interface SettingsContextType {
  settings: UserSettings;
  categories: CategorySettings[];
  customYearGroups: YearGroup[];
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateCategories: (newCategories: CategorySettings[]) => void;
  updateYearGroups: (newYearGroups: YearGroup[]) => void;
  resetToDefaults: () => void;
  resetCategoriesToDefaults: () => void;
  resetYearGroupsToDefaults: () => void;
  getThemeForClass: (className: string) => {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  getCategoryColor: (categoryName: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

// Default class-based themes - Consistent with Rhythmstix branding
const CLASS_THEMES = {
  'LKG': {
    primary: '#10B981', // Emerald
    secondary: '#059669',
    accent: '#34D399',
    gradient: 'from-emerald-500 to-green-600'
  },
  'UKG': {
    primary: '#3B82F6', // Blue - matches Rhythmstix brand
    secondary: '#2563EB',
    accent: '#60A5FA',
    gradient: 'from-blue-500 to-indigo-600'
  },
  'Reception': {
    primary: '#8B5CF6', // Purple
    secondary: '#7C3AED',
    accent: '#A78BFA',
    gradient: 'from-purple-500 to-violet-600'
  }
};

const DEFAULT_SETTINGS: UserSettings = {
  schoolName: 'Curriculum Designer',
  schoolLogo: '/RLOGO.png',
  primaryColor: '#3B82F6',
  secondaryColor: '#2563EB',
  accentColor: '#60A5FA',
  customTheme: false
};

// Default categories with colors
const DEFAULT_CATEGORIES: CategorySettings[] = [
  { name: 'Welcome', color: '#F59E0B', position: 0 },
  { name: 'Kodaly Songs', color: '#8B5CF6', position: 1 },
  { name: 'Kodaly Action Songs', color: '#F97316', position: 2 },
  { name: 'Action/Games Songs', color: '#F97316', position: 3 },
  { name: 'Rhythm Sticks', color: '#D97706', position: 4 },
  { name: 'Scarf Songs', color: '#10B981', position: 5 },
  { name: 'General Game', color: '#3B82F6', position: 6 },
  { name: 'Core Songs', color: '#84CC16', position: 7 },
  { name: 'Parachute Games', color: '#EF4444', position: 8 },
  { name: 'Percussion Games', color: '#06B6D4', position: 9 },
  { name: 'Teaching Units', color: '#6366F1', position: 10 },
  { name: 'Goodbye', color: '#14B8A6', position: 11 },
  { name: 'Kodaly Rhythms', color: '#9333EA', position: 12 },
  { name: 'Kodaly Games', color: '#F59E0B', position: 13 },
  { name: 'IWB Games', color: '#FBBF24', position: 14 }
];

// Default year groups
const DEFAULT_YEAR_GROUPS: YearGroup[] = [
  { id: 'LKG', name: 'Lower Kindergarten', color: '#10B981' },
  { id: 'UKG', name: 'Upper Kindergarten', color: '#3B82F6' },
  { id: 'Reception', name: 'Reception', color: '#8B5CF6' }
];

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<CategorySettings[]>(DEFAULT_CATEGORIES);
  const [customYearGroups, setCustomYearGroups] = useState<YearGroup[]>(DEFAULT_YEAR_GROUPS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('lesson-viewer-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
      
      const savedCategories = localStorage.getItem('lesson-viewer-categories');
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        setCategories(parsed);
      }
      
      const savedYearGroups = localStorage.getItem('custom-year-groups');
      if (savedYearGroups) {
        const parsed = JSON.parse(savedYearGroups);
        setCustomYearGroups(parsed);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lesson-viewer-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);
  
  // Save categories to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lesson-viewer-categories', JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  }, [categories]);
  
  // Save year groups to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('custom-year-groups', JSON.stringify(customYearGroups));
    } catch (error) {
      console.error('Failed to save year groups:', error);
    }
  }, [customYearGroups]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const updateCategories = (newCategories: CategorySettings[]) => {
    setCategories(newCategories);
  };
  
  const updateYearGroups = (newYearGroups: YearGroup[]) => {
    setCustomYearGroups(newYearGroups);
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('lesson-viewer-settings');
  };
  
  const resetCategoriesToDefaults = () => {
    setCategories(DEFAULT_CATEGORIES);
    localStorage.removeItem('lesson-viewer-categories');
  };
  
  const resetYearGroupsToDefaults = () => {
    setCustomYearGroups(DEFAULT_YEAR_GROUPS);
    localStorage.removeItem('custom-year-groups');
  };

  const getThemeForClass = (className: string) => {
    // If custom theme is enabled, use user's custom colors
    if (settings.customTheme) {
      return {
        primary: settings.primaryColor,
        secondary: settings.secondaryColor,
        accent: settings.accentColor,
        gradient: `from-[${settings.primaryColor}] to-[${settings.secondaryColor}]`
      };
    }

    // Find the custom year group
    const yearGroup = customYearGroups.find(group => group.id === className);
    if (yearGroup && yearGroup.color) {
      // If the year group has a custom color, use it
      return {
        primary: yearGroup.color,
        secondary: adjustColor(yearGroup.color, -20),
        accent: adjustColor(yearGroup.color, 20),
        gradient: `from-[${yearGroup.color}] to-[${adjustColor(yearGroup.color, -20)}]`
      };
    }

    // Otherwise, use class-based theme
    return CLASS_THEMES[className as keyof typeof CLASS_THEMES] || CLASS_THEMES.LKG;
  };
  
  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#6B7280'; // Default gray if not found
  };
  
  // Helper function to adjust a color's brightness
  const adjustColor = (color: string, amount: number): string => {
    // Convert hex to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // Adjust RGB values
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const value = {
    settings,
    categories,
    customYearGroups,
    updateSettings,
    updateCategories,
    updateYearGroups,
    resetToDefaults,
    resetCategoriesToDefaults,
    resetYearGroupsToDefaults,
    getThemeForClass,
    getCategoryColor
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}