/*
  # Fix activities table unique constraint

  1. Changes
    - Add unique constraint on (activity, category, lesson_number) to support upsert operations
    - This allows the ON CONFLICT clause in the API to work properly

  2. Security
    - No changes to existing RLS policies
*/

-- Add unique constraint to activities table to support upsert operations
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activities_unique_constraint' 
    AND table_name = 'activities'
  ) THEN
    ALTER TABLE activities 
    ADD CONSTRAINT activities_unique_constraint 
    UNIQUE (activity, category, lesson_number);
  END IF;
END $$;