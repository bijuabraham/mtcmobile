/*
  # Add foreign key relationship between members and households

  1. Changes
    - Add foreign key constraint from members.household_id to households.household_id
    - This ensures referential integrity between members and their households
    
  2. Notes
    - We need to update existing member records to link them to actual households
    - Then we can add the foreign key constraint
*/

DO $$
DECLARE
  household_ids uuid[];
BEGIN
  SELECT ARRAY_AGG(household_id) INTO household_ids FROM households LIMIT 8;
  
  IF array_length(household_ids, 1) >= 8 THEN
    UPDATE members SET household_id = household_ids[1] WHERE firstname = 'John' AND lastname = 'Smith';
    UPDATE members SET household_id = household_ids[1] WHERE firstname = 'Mary' AND lastname = 'Smith';
    UPDATE members SET household_id = household_ids[1] WHERE firstname = 'Sarah' AND lastname = 'Smith';
    UPDATE members SET household_id = household_ids[1] WHERE firstname = 'Michael' AND lastname = 'Smith';
    
    UPDATE members SET household_id = household_ids[2] WHERE firstname = 'Robert' AND lastname = 'Johnson';
    UPDATE members SET household_id = household_ids[2] WHERE firstname = 'Emily' AND lastname = 'Johnson';
    UPDATE members SET household_id = household_ids[2] WHERE firstname = 'Daniel' AND lastname = 'Johnson';
    
    UPDATE members SET household_id = household_ids[3] WHERE firstname = 'David' AND lastname = 'Williams';
    UPDATE members SET household_id = household_ids[3] WHERE firstname = 'Jennifer' AND lastname = 'Williams';
    UPDATE members SET household_id = household_ids[3] WHERE firstname = 'Christopher' AND lastname = 'Williams';
    UPDATE members SET household_id = household_ids[3] WHERE firstname = 'Amanda' AND lastname = 'Williams';
    
    UPDATE members SET household_id = household_ids[4] WHERE firstname = 'James' AND lastname = 'Brown';
    
    UPDATE members SET household_id = household_ids[5] WHERE firstname = 'Patricia' AND lastname = 'Davis';
    UPDATE members SET household_id = household_ids[5] WHERE firstname = 'Thomas' AND lastname = 'Davis';
    
    UPDATE members SET household_id = household_ids[6] WHERE firstname = 'Jessica' AND lastname = 'Miller';
    UPDATE members SET household_id = household_ids[6] WHERE firstname = 'Matthew' AND lastname = 'Miller';
    UPDATE members SET household_id = household_ids[6] WHERE firstname = 'Olivia' AND lastname = 'Miller';
    
    UPDATE members SET household_id = household_ids[7] WHERE firstname = 'William' AND lastname = 'Wilson';
    UPDATE members SET household_id = household_ids[7] WHERE firstname = 'Barbara' AND lastname = 'Wilson';
    
    UPDATE members SET household_id = household_ids[8] WHERE firstname = 'Elizabeth' AND lastname = 'Moore';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'members_household_id_fkey'
    AND table_name = 'members'
  ) THEN
    ALTER TABLE members
    ADD CONSTRAINT members_household_id_fkey
    FOREIGN KEY (household_id)
    REFERENCES households(household_id)
    ON DELETE SET NULL;
  END IF;
END $$;