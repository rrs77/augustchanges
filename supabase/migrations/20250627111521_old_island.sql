-- Create a new migration to fix the activities table constraint issue
-- This migration ensures the unique constraint exists for upsert operations

-- First, check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    -- Check if the constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'activities_activity_category_lesson_number_key' 
      AND table_name = 'activities'
    ) THEN
      -- Add the constraint
      ALTER TABLE activities 
      ADD CONSTRAINT activities_activity_category_lesson_number_key 
      UNIQUE (activity, category, lesson_number);
    END IF;
  END IF;
END $$;