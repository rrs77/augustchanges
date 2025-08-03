/*
# Fix Activities Table Constraint

1. New Constraints
  - Add a proper unique constraint on the activities table for upsert operations
  - Use standard Supabase naming convention for the constraint

2. Changes
  - Drop any existing constraint with the old name
  - Create a new constraint with the standard naming convention
*/

-- First, drop the constraint if it exists (using the old name)
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

-- Now create the unique constraint with the standard Supabase naming convention
DO $$
BEGIN
  -- Check if the constraint already exists with the standard name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activities_activity_category_lesson_number_key' 
    AND table_name = 'activities'
  ) THEN
    -- Add the constraint with the standard naming convention
    ALTER TABLE activities 
    ADD CONSTRAINT activities_activity_category_lesson_number_key 
    UNIQUE (activity, category, lesson_number);
  END IF;
END $$;