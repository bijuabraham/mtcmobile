/*
  # Remove Password Column from Members Table

  1. Changes
    - Remove `password` column from `members` table
    - Authentication should be handled through Supabase Auth, not stored passwords in members table

  2. Security
    - Improves security by removing plain text password storage
    - Members should authenticate through Supabase Auth system instead
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'password'
  ) THEN
    ALTER TABLE members DROP COLUMN password;
  END IF;
END $$;
