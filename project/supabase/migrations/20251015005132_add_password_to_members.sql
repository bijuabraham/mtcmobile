/*
  # Add Password Column to Members Table

  1. Changes
    - Add `password` column to `members` table
      - Type: text (nullable)
      - Stores password for member authentication
  
  2. Security
    - Column is nullable to support existing members without passwords
    - Passwords should be hashed before storing (handled in application layer)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'password'
  ) THEN
    ALTER TABLE members ADD COLUMN password text;
  END IF;
END $$;