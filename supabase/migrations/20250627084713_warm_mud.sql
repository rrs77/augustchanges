/*
  # Create unique constraint for activities table

  1. Changes
    - Drop existing constraint if it exists (to handle any partial creation issues)
    - Create unique constraint on (activity, category, lesson_number) to support upsert operations
    - This allows the ON CONFLICT clause in the API to work properly

  2. Security
    - No changes to existing RLS policies
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