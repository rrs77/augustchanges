/*
  # Fix lesson plans table ID column

  1. Changes
    - Ensure id column is properly configured as UUID with default value
    - This fixes the invalid UUID format errors

  2. Security
    - No changes to existing RLS policies
*/

-- Ensure the lesson_plans table has proper UUID handling
DO $$
BEGIN
  -- Check if the id column exists and is properly configured
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lesson_plans' AND column_name = 'id'
  ) THEN
    -- Update the id column to ensure it has proper UUID default
    ALTER TABLE lesson_plans 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;