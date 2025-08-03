/*
  # Fix Activities Table Unique Constraint
  
  This script adds the missing unique constraint to the activities table
  that is required for the upsert operations in the application.
  
  Run this script in your Supabase SQL Editor:
  1. Go to your Supabase dashboard
  2. Navigate to SQL Editor
  3. Copy and paste this entire script
  4. Click "Run" to execute
*/

-- First, drop the constraint if it exists to handle any partial creation issues
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activities_unique_constraint' 
    AND table_name = 'activities'
  ) THEN
    ALTER TABLE activities DROP CONSTRAINT activities_unique_constraint;
  END IF;
END $$;

-- Now create the unique constraint
DO $$
BEGIN
  -- Add unique constraint to activities table to support upsert operations
  ALTER TABLE activities 
  ADD CONSTRAINT activities_unique_constraint 
  UNIQUE (activity, category, lesson_number);
EXCEPTION
  WHEN duplicate_table THEN
    -- Constraint already exists, ignore
    NULL;
  WHEN others THEN
    -- Re-raise any other exception
    RAISE;
END $$;

-- Verify the constraint was created
SELECT 
  constraint_name, 
  table_name, 
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'activities' 
  AND constraint_name = 'activities_unique_constraint';