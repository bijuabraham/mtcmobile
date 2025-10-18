/*
  # Update members table structure

  1. Changes
    - Drop existing members table and recreate with new structure
    - Add columns: household_id, member_id, firstname, lastname, birth_date, wed_date, relationship, phone, email
    - member_id is now the primary key (kept as UUID for consistency)
    - household_id references households table (will be created next)
    - All columns have appropriate types and constraints

  2. Security
    - Enable RLS on members table
    - Add policies for authenticated users to view members
    - Add policies for authenticated users to manage members

  3. Test Data
    - Insert synthetic member data
*/

DROP TABLE IF EXISTS members CASCADE;

CREATE TABLE members (
  member_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid,
  firstname text NOT NULL,
  lastname text NOT NULL,
  birth_date date,
  wed_date date,
  relationship text,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view members"
  ON members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert members"
  ON members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update members"
  ON members
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete members"
  ON members
  FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO members (household_id, firstname, lastname, birth_date, wed_date, relationship, phone, email)
VALUES
  (gen_random_uuid(), 'John', 'Smith', '1975-05-15', '2000-06-20', 'Head of Household', '(555) 123-4567', 'john.smith@email.com'),
  (gen_random_uuid(), 'Mary', 'Smith', '1978-08-22', '2000-06-20', 'Spouse', '(555) 123-4567', 'mary.smith@email.com'),
  (gen_random_uuid(), 'Sarah', 'Smith', '2005-03-10', null, 'Child', '(555) 123-4568', 'sarah.smith@email.com'),
  (gen_random_uuid(), 'Michael', 'Smith', '2008-11-18', null, 'Child', null, null),
  (gen_random_uuid(), 'Robert', 'Johnson', '1982-01-30', '2010-07-15', 'Head of Household', '(555) 234-5678', 'robert.johnson@email.com'),
  (gen_random_uuid(), 'Emily', 'Johnson', '1985-04-12', '2010-07-15', 'Spouse', '(555) 234-5678', 'emily.johnson@email.com'),
  (gen_random_uuid(), 'Daniel', 'Johnson', '2012-09-25', null, 'Child', null, null),
  (gen_random_uuid(), 'David', 'Williams', '1970-12-05', '1995-05-10', 'Head of Household', '(555) 345-6789', 'david.williams@email.com'),
  (gen_random_uuid(), 'Jennifer', 'Williams', '1972-07-18', '1995-05-10', 'Spouse', '(555) 345-6789', 'jennifer.williams@email.com'),
  (gen_random_uuid(), 'Christopher', 'Williams', '1998-02-14', null, 'Child', '(555) 345-6790', 'chris.williams@email.com'),
  (gen_random_uuid(), 'Amanda', 'Williams', '2001-06-30', null, 'Child', '(555) 345-6791', 'amanda.williams@email.com'),
  (gen_random_uuid(), 'James', 'Brown', '1988-10-08', null, 'Single', '(555) 456-7890', 'james.brown@email.com'),
  (gen_random_uuid(), 'Patricia', 'Davis', '1965-03-22', '1990-08-12', 'Head of Household', '(555) 567-8901', 'patricia.davis@email.com'),
  (gen_random_uuid(), 'Thomas', 'Davis', '1963-11-15', '1990-08-12', 'Spouse', '(555) 567-8901', 'thomas.davis@email.com'),
  (gen_random_uuid(), 'Jessica', 'Miller', '1992-09-03', '2018-04-20', 'Head of Household', '(555) 678-9012', 'jessica.miller@email.com'),
  (gen_random_uuid(), 'Matthew', 'Miller', '1990-12-28', '2018-04-20', 'Spouse', '(555) 678-9012', 'matthew.miller@email.com'),
  (gen_random_uuid(), 'Olivia', 'Miller', '2019-07-14', null, 'Child', null, null),
  (gen_random_uuid(), 'William', 'Wilson', '1955-02-08', '1980-09-05', 'Head of Household', '(555) 789-0123', 'william.wilson@email.com'),
  (gen_random_uuid(), 'Barbara', 'Wilson', '1957-05-19', '1980-09-05', 'Spouse', '(555) 789-0123', 'barbara.wilson@email.com'),
  (gen_random_uuid(), 'Elizabeth', 'Moore', '1995-06-11', null, 'Single', '(555) 890-1234', 'elizabeth.moore@email.com');