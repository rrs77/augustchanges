import { supabase, TABLES, isSupabaseConfigured } from './supabase';
import type { Activity, LessonData, LessonPlan } from '../contexts/DataContext';

// API endpoints for activities
export const activitiesApi = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.ACTIVITIES)
        .select('id, activity, description, activity_text, time, video_link, music_link, backing_link, resource_link, link, vocals_link, image_link, teaching_unit, category, level, unit_name, lesson_number, eyfs_standards');
      
      if (error) throw error;
      
      // Convert snake_case to camelCase for frontend
      return (data || []).map(item => ({
        _id: item.id,
        activity: item.activity,
        description: item.description,
        activityText: item.activity_text,
        time: item.time,
        videoLink: item.video_link,
        musicLink: item.music_link,
        backingLink: item.backing_link,
        resourceLink: item.resource_link,
        link: item.link,
        vocalsLink: item.vocals_link,
        imageLink: item.image_link,
        teachingUnit: item.teaching_unit,
        category: item.category,
        level: item.level,
        unitName: item.unit_name,
        lessonNumber: item.lesson_number,
        eyfsStandards: item.eyfs_standards
      }));
    } catch (error) {
      console.warn('Failed to get activities from Supabase:', error);
      throw error;
    }
  },
  
  create: async (activity: Activity) => {
    try {
      // Convert camelCase to snake_case for database
      const { uniqueId, ...activityData } = activity;
      const dbActivity = {
        activity: activityData.activity,
        description: activityData.description,
        activity_text: activityData.activityText,
        time: activityData.time,
        video_link: activityData.videoLink,
        music_link: activityData.musicLink,
        backing_link: activityData.backingLink,
        resource_link: activityData.resourceLink,
        link: activityData.link,
        vocals_link: activityData.vocalsLink,
        image_link: activityData.imageLink,
        teaching_unit: activityData.teachingUnit,
        category: activityData.category,
        level: activityData.level,
        unit_name: activityData.unitName,
        lesson_number: activityData.lessonNumber,
        eyfs_standards: activityData.eyfsStandards
      };
      
      const { data, error } = await supabase
        .from(TABLES.ACTIVITIES)
        .insert([dbActivity])
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to camelCase for frontend
      return {
        _id: data.id,
        activity: data.activity,
        description: data.description,
        activityText: data.activity_text,
        time: data.time,
        videoLink: data.video_link,
        musicLink: data.music_link,
        backingLink: data.backing_link,
        resourceLink: data.resource_link,
        link: data.link,
        vocalsLink: data.vocals_link,
        imageLink: data.image_link,
        teachingUnit: data.teaching_unit,
        category: data.category,
        level: data.level,
        unitName: data.unit_name,
        lessonNumber: data.lesson_number,
        eyfsStandards: data.eyfs_standards
      };
    } catch (error) {
      console.warn('Failed to create activity in Supabase:', error);
      throw error;
    }
  },
  
  update: async (id: string, activity: Activity) => {
    try {
      // Convert camelCase to snake_case for database
      const { uniqueId, ...activityData } = activity;
      const dbActivity = {
        activity: activityData.activity,
        description: activityData.description,
        activity_text: activityData.activityText,
        time: activityData.time,
        video_link: activityData.videoLink,
        music_link: activityData.musicLink,
        backing_link: activityData.backingLink,
        resource_link: activityData.resourceLink,
        link: activityData.link,
        vocals_link: activityData.vocalsLink,
        image_link: activityData.imageLink,
        teaching_unit: activityData.teachingUnit,
        category: activityData.category,
        level: activityData.level,
        unit_name: activityData.unitName,
        lesson_number: activityData.lessonNumber,
        eyfs_standards: activityData.eyfsStandards
      };
      
      const { data, error } = await supabase
        .from(TABLES.ACTIVITIES)
        .update(dbActivity)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to camelCase for frontend
      return {
        _id: data.id,
        activity: data.activity,
        description: data.description,
        activityText: data.activity_text,
        time: data.time,
        videoLink: data.video_link,
        musicLink: data.music_link,
        backingLink: data.backing_link,
        resourceLink: data.resource_link,
        link: data.link,
        vocalsLink: data.vocals_link,
        imageLink: data.image_link,
        teachingUnit: data.teaching_unit,
        category: data.category,
        level: data.level,
        unitName: data.unit_name,
        lessonNumber: data.lesson_number,
        eyfsStandards: data.eyfs_standards
      };
    } catch (error) {
      console.warn('Failed to update activity in Supabase:', error);
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.ACTIVITIES)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('Failed to delete activity from Supabase:', error);
      throw error;
    }
  },
  
  import: async (activities: Activity[]) => {
    try {
      // Convert camelCase to snake_case for database
      const cleanedActivities = activities.map(({ uniqueId, ...activity }) => ({
        activity: activity.activity,
        description: activity.description,
        activity_text: activity.activityText,
        time: activity.time,
        video_link: activity.videoLink,
        music_link: activity.musicLink,
        backing_link: activity.backingLink,
        resource_link: activity.resourceLink,
        link: activity.link,
        vocals_link: activity.vocalsLink,
        image_link: activity.imageLink,
        teaching_unit: activity.teachingUnit,
        category: activity.category,
        level: activity.level,
        unit_name: activity.unitName,
        lesson_number: activity.lessonNumber,
        eyfs_standards: activity.eyfsStandards
      }));
      
      // Use upsert with the correct constraint
      const { data, error } = await supabase
        .from(TABLES.ACTIVITIES)
        .upsert(cleanedActivities, { 
          onConflict: 'activity,category,lesson_number',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to import activities to Supabase:', error);
      throw error;
    }
  }
};

// API endpoints for lessons
export const lessonsApi = {
  getBySheet: async (sheet: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.LESSONS)
        .select('*')
        .eq('sheet_name', sheet)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        // No data found for this sheet
        return null;
      }
      
      return {
        allLessonsData: data.data || {},
        lessonNumbers: data.lesson_numbers || [],
        teachingUnits: data.teaching_units || [],
        eyfsStatements: data.eyfs_statements_map || {}
      };
    } catch (error) {
      console.warn(`Failed to get lessons for ${sheet} from Supabase:`, error);
      throw error;
    }
  },
  
  updateSheet: async (sheet: string, data: any) => {
    try {
      const { error } = await supabase
        .from(TABLES.LESSONS)
        .upsert({
          sheet_name: sheet,
          data: data.allLessonsData,
          lesson_numbers: data.lessonNumbers,
          teaching_units: data.teachingUnits,
          eyfs_statements_map: data.eyfsStatements
        }, { onConflict: 'sheet_name' });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn(`Failed to update lessons for ${sheet} in Supabase:`, error);
      throw error;
    }
  }
};

// API endpoints for lesson plans
export const lessonPlansApi = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.LESSON_PLANS)
        .select('*');
      
      if (error) throw error;
      
      // Convert dates from strings to Date objects
      return (data || []).map(plan => ({
        ...plan,
        date: new Date(plan.date),
        createdAt: new Date(plan.created_at),
        updatedAt: new Date(plan.updated_at)
      }));
    } catch (error) {
      console.warn('Failed to get lesson plans from Supabase:', error);
      throw error;
    }
  },
  
  create: async (plan: LessonPlan) => {
    try {
      // Convert to snake_case for database
      const { data, error } = await supabase
        .from(TABLES.LESSON_PLANS)
        .insert([{
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
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to camelCase for frontend
      return {
        ...data,
        id: data.id,
        className: data.class_name,
        unitId: data.unit_id,
        unitName: data.unit_name,
        lessonNumber: data.lesson_number,
        date: new Date(data.date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.warn('Failed to create lesson plan in Supabase:', error);
      throw error;
    }
  },
  
  update: async (id: string, plan: LessonPlan) => {
    try {
      // Convert to snake_case for database
      const { data, error } = await supabase
        .from(TABLES.LESSON_PLANS)
        .update({
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
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to camelCase for frontend
      return {
        ...data,
        id: data.id,
        className: data.class_name,
        unitId: data.unit_id,
        unitName: data.unit_name,
        lessonNumber: data.lesson_number,
        date: new Date(data.date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.warn('Failed to update lesson plan in Supabase:', error);
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.LESSON_PLANS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('Failed to delete lesson plan from Supabase:', error);
      throw error;
    }
  }
};

// API endpoints for EYFS standards
export const eyfsApi = {
  getBySheet: async (sheet: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.EYFS_STATEMENTS)
        .select('*')
        .eq('sheet_name', sheet)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        // No data found for this sheet
        return null;
      }
      
      return {
        allStatements: data.all_statements || [],
        structuredStatements: data.structured_statements || {}
      };
    } catch (error) {
      console.warn(`Failed to get EYFS standards for ${sheet} from Supabase:`, error);
      throw error;
    }
  },
  
  updateSheet: async (sheet: string, data: any) => {
    try {
      const { error } = await supabase
        .from(TABLES.EYFS_STATEMENTS)
        .upsert({
          sheet_name: sheet,
          all_statements: data.allStatements,
          structured_statements: data.structuredStatements
        }, { onConflict: 'sheet_name' });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn(`Failed to update EYFS standards for ${sheet} in Supabase:`, error);
      throw error;
    }
  }
};

// Export/Import all data
export const dataApi = {
  exportAll: async () => {
    try {
      // Get all data from all tables
      const [activities, lessons, lessonPlans, eyfsStatements] = await Promise.all([
        supabase.from(TABLES.ACTIVITIES).select('*'),
        supabase.from(TABLES.LESSONS).select('*'),
        supabase.from(TABLES.LESSON_PLANS).select('*'),
        supabase.from(TABLES.EYFS_STATEMENTS).select('*')
      ]);
      
      if (activities.error) throw activities.error;
      if (lessons.error) throw lessons.error;
      if (lessonPlans.error) throw lessonPlans.error;
      if (eyfsStatements.error) throw eyfsStatements.error;
      
      return {
        activities: activities.data || [],
        lessons: lessons.data || [],
        lessonPlans: lessonPlans.data || [],
        eyfsStatements: eyfsStatements.data || []
      };
    } catch (error) {
      console.warn('Failed to export data from Supabase:', error);
      throw error;
    }
  },
  
  importAll: async (data: any) => {
    try {
      // Start a transaction to import all data
      const promises = [];
      
      if (data.activities && data.activities.length > 0) {
        // Clean activities data (remove uniqueId and convert to snake_case)
        const cleanedActivities = data.activities.map(({ uniqueId, ...activity }: any) => ({
          activity: activity.activity,
          description: activity.description,
          activity_text: activity.activityText,
          time: activity.time,
          video_link: activity.videoLink,
          music_link: activity.musicLink,
          backing_link: activity.backingLink,
          resource_link: activity.resourceLink,
          link: activity.link,
          vocals_link: activity.vocalsLink,
          image_link: activity.imageLink,
          teaching_unit: activity.teachingUnit,
          category: activity.category,
          level: activity.level,
          unit_name: activity.unitName,
          lesson_number: activity.lessonNumber,
          eyfs_standards: activity.eyfsStandards
        }));
        promises.push(
          supabase
            .from(TABLES.ACTIVITIES)
            .upsert(cleanedActivities, { 
              onConflict: 'activity,category,lesson_number',
              ignoreDuplicates: false 
            })
        );
      }
      
      if (data.lessons) {
        const lessonsData = Object.entries(data.lessons).map(([sheet, sheetData]: [string, any]) => ({
          sheet_name: sheet,
          data: sheetData.allLessonsData || {},
          lesson_numbers: sheetData.lessonNumbers || [],
          teaching_units: sheetData.teachingUnits || [],
          eyfs_statements_map: sheetData.eyfsStatements || {}
        }));
        
        promises.push(
          supabase
            .from(TABLES.LESSONS)
            .upsert(lessonsData, { onConflict: 'sheet_name' })
        );
      }
      
      if (data.lessonPlans && data.lessonPlans.length > 0) {
        // Convert lesson plans to snake_case
        const lessonPlansData = data.lessonPlans.map((plan: any) => ({
          id: plan.id,
          date: new Date(plan.date).toISOString(),
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
        
        promises.push(
          supabase
            .from(TABLES.LESSON_PLANS)
            .upsert(lessonPlansData, { onConflict: 'id' })
        );
      }
      
      if (data.eyfs) {
        const eyfsData = Object.entries(data.eyfs).map(([sheet, sheetData]: [string, any]) => ({
          sheet_name: sheet,
          all_statements: sheetData.allStatements || [],
          structured_statements: sheetData.structuredStatements || {}
        }));
        
        promises.push(
          supabase
            .from(TABLES.EYFS_STATEMENTS)
            .upsert(eyfsData, { onConflict: 'sheet_name' })
        );
      }
      
      // Execute all promises
      await Promise.all(promises);
      
      return { success: true };
    } catch (error) {
      console.warn('Failed to import data to Supabase:', error);
      throw error;
    }
  }
};

// WordPress API Configuration
export const WORDPRESS_CONFIG = {
  BASE_URL: import.meta.env.VITE_WORDPRESS_URL || 'https://your-wordpress-site.com',
  API_ENDPOINT: '/wp-json/wp/v2',
  AUTH_ENDPOINT: '/wp-json/jwt-auth/v1/token',
  VALIDATE_ENDPOINT: '/wp-json/jwt-auth/v1/token/validate',
};

// WordPress API helper
export const wordpressAPI = {
  async authenticate(username: string, password: string) {
    const baseUrl = WORDPRESS_CONFIG.BASE_URL;
    
    if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
      throw new Error('WordPress URL not configured');
    }
    
    const response = await fetch(`${baseUrl}${WORDPRESS_CONFIG.AUTH_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Authentication failed');
    }
    
    return response.json();
  },
  
  async validateToken(token: string) {
    try {
      const baseUrl = WORDPRESS_CONFIG.BASE_URL;
      
      if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
        return false;
      }
      
      const response = await fetch(`${baseUrl}${WORDPRESS_CONFIG.VALIDATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },
  
  async getUserInfo(token: string) {
    const baseUrl = WORDPRESS_CONFIG.BASE_URL;
    
    if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
      throw new Error('WordPress URL not configured');
    }
    
    const response = await fetch(`${baseUrl}${WORDPRESS_CONFIG.API_ENDPOINT}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return response.json();
  }
};