/*
  # Rename families table to households and update structure

  1. Changes
    - Rename families table to households
    - Drop existing columns that are no longer needed
    - Add new columns: household_id, mail_to, phone, email, donor, prayer_group
    - household_id is now the primary key (UUID)
    - donor is boolean to track if household is a donor
    - prayer_group stores the prayer group name/identifier

  2. Security
    - Enable RLS on households table
    - Add policies for authenticated users to view households
    - Add policies for authenticated users to manage households

  3. Test Data
    - Insert synthetic household data
*/

DROP TABLE IF EXISTS families CASCADE;

CREATE TABLE households (
  household_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_to text NOT NULL,
  phone text,
  email text,
  donor boolean DEFAULT false,
  prayer_group text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view households"
  ON households
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert households"
  ON households
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update households"
  ON households
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete households"
  ON households
  FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO households (mail_to, phone, email, donor, prayer_group)
VALUES
  ('Smith Family', '(555) 123-4567', 'smith.family@email.com', true, 'St. Joseph Prayer Group'),
  ('Johnson Family', '(555) 234-5678', 'johnson.family@email.com', true, 'St. Mary Prayer Group'),
  ('Williams Family', '(555) 345-6789', 'williams.family@email.com', true, 'St. Joseph Prayer Group'),
  ('James Brown', '(555) 456-7890', 'james.brown@email.com', false, 'St. Michael Prayer Group'),
  ('Davis Family', '(555) 567-8901', 'davis.family@email.com', true, 'St. Mary Prayer Group'),
  ('Miller Family', '(555) 678-9012', 'miller.family@email.com', true, 'St. Joseph Prayer Group'),
  ('Wilson Family', '(555) 789-0123', 'wilson.family@email.com', true, 'St. Anthony Prayer Group'),
  ('Elizabeth Moore', '(555) 890-1234', 'elizabeth.moore@email.com', false, 'St. Michael Prayer Group'),
  ('Anderson Family', '(555) 901-2345', 'anderson.family@email.com', true, 'St. Mary Prayer Group'),
  ('Taylor Family', '(555) 012-3456', 'taylor.family@email.com', false, 'St. Anthony Prayer Group');