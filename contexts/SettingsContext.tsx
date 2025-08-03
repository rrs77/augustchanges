import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
}

interface SettingsContextType {
  // Theme management
  getThemeForClass: (className: string) => Theme;
  getThemeForSubject: (subjectId: string) => Theme;
  
  // Category management (now subject-specific)
  categories: any[]; // Legacy support
  getCategoryColor: (categoryName: string) => string;
  getCategoryByName: (categoryName: string) => any | null;
  
  // Subject-specific category functions
  getSubjectCategories: () => any[];
  getCategoryColorById: (categoryId: string) => string;
  getCategoryNameById: (categoryId: string) => string;
  
  // User preferences
  defaultViewMode: 'grid' | 'list' | 'compact';
  setDefaultViewMode: (mode: 'grid' | 'list' | 'compact') => void;
  
  // Admin settings
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { subjects, currentSubject, subjectCategories, getCategoryById } = useData();
  const [defaultViewMode, setDefaultViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [isAdmin, setIsAdmin] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = () => {
    // Load from localStorage
    const savedViewMode = localStorage.getItem('defaultViewMode') as 'grid' | 'list' | 'compact';
    if (savedViewMode) {
      setDefaultViewMode(savedViewMode);
    }
    
    // Check admin status (you can customize this)
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);
  };

  // Theme management
  const getThemeForClass = (className: string): Theme => {
    // Legacy function - now uses current subject theme
    return getThemeForSubject(currentSubject?.id || '');
  };

  const getThemeForSubject = (subjectId: string): Theme => {
    const subject = subjects.find(s => s.id === subjectId) || currentSubject;
    
    if (!subject) {
      return {
        primary: '#6b7280',
        secondary: '#9ca3af',
        accent: '#d1d5db'
      };
    }

    // Generate theme variations from subject color
    const baseColor = subject.color;
    return {
      primary: baseColor,
      secondary: adjustColorBrightness(baseColor, 20),
      accent: adjustColorBrightness(baseColor, -20)
    };
  };

  // Category management (legacy support - works with your existing code)
  const getCategoryColor = (categoryName: string): string => {
    const category = subjectCategories.find(cat => cat.name === categoryName);
    return category?.color || '#6b7280';
  };

  const getCategoryByName = (categoryName: string) => {
    return subjectCategories.find(cat => cat.name === categoryName) || null;
  };

  // Subject-specific category functions
  const getSubjectCategories = () => {
    return subjectCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      description: cat.description,
      is_locked: cat.is_locked,
      is_active: cat.is_active,
      sort_order: cat.sort_order
    }));
  };

  const getCategoryColorById = (categoryId: string): string => {
    const category = getCategoryById(categoryId);
    return category?.color || '#6b7280';
  };

  const getCategoryNameById = (categoryId: string): string => {
    const category = getCategoryById(categoryId);
    return category?.name || 'Unknown Category';
  };

  // Utility function to adjust color brightness
  const adjustColorBrightness = (hex: string, percent: number): string => {
    // Remove # if present
    const color = hex.replace('#', '');
    
    // Parse RGB values
    const num = parseInt(color, 16);
    const r = (num >> 16) + percent;
    const g = (num >> 8 & 0x00FF) + percent;
    const b = (num & 0x0000FF) + percent;
    
    // Ensure values stay within bounds
    const newR = Math.max(0, Math.min(255, r));
    const newG = Math.max(0, Math.min(255, g));
    const newB = Math.max(0, Math.min(255, b));
    
    return `#${((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0')}`;
  };

  // Handle view mode changes
  const handleSetDefaultViewMode = (mode: 'grid' | 'list' | 'compact') => {
    setDefaultViewMode(mode);
    localStorage.setItem('defaultViewMode', mode);
  };

  // Handle admin status changes
  const handleSetIsAdmin = (admin: boolean) => {
    setIsAdmin(admin);
    localStorage.setItem('isAdmin', admin.toString());
  };

  const contextValue: SettingsContextType = {
    // Theme management
    getThemeForClass,
    getThemeForSubject,
    
    // Legacy category support (mapped to current subject categories)
    categories: getSubjectCategories(),
    getCategoryColor,
    getCategoryByName,
    
    // Subject-specific category functions
    getSubjectCategories,
    getCategoryColorById,
    getCategoryNameById,
    
    // User preferences
    defaultViewMode,
    setDefaultViewMode: handleSetDefaultViewMode,
    
    // Admin settings
    isAdmin,
    setIsAdmin: handleSetIsAdmin
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// NEW: Custom hook for working with current subject's categories
export const useCurrentSubjectSettings = () => {
  const { currentSubject, subjectCategories } = useData();
  const { getThemeForSubject } = useSettings();
  
  return {
    currentSubject,
    categories: subjectCategories,
    theme: getThemeForSubject(currentSubject?.id || ''),
    getCategoryColor: (categoryName: string) => {
      const category = subjectCategories.find(cat => cat.name === categoryName);
      return category?.color || '#6b7280';
    },
    getCategoryById: (categoryId: string) => {
      return subjectCategories.find(cat => cat.id === categoryId) || null;
    },
    getActiveCategoriesOnly: () => {
      return subjectCategories.filter(cat => cat.is_active);
    },
    getUnlockedCategoriesOnly: () => {
      return subjectCategories.filter(cat => !cat.is_locked);
    }
  };
};

export default SettingsProvider;