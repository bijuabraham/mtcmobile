/*
  # Update households table - donor and prayer_group fields

  1. Changes
    - Change donor field from boolean to text (to store three digit number)
    - Update prayer_group values to be one of the 5 valid options:
      - South Bay
      - Fremont
      - Trivalley
      - Central Valley
      - San Francisco
    
  2. Data Updates
    - Update existing records with new donor numbers and valid prayer groups
*/

ALTER TABLE households 
  ALTER COLUMN donor TYPE text USING CASE WHEN donor THEN '100' ELSE '000' END;

UPDATE households
SET 
  donor = CASE 
    WHEN mail_to LIKE '%Smith%' THEN '125'
    WHEN mail_to LIKE '%Johnson%' THEN '200'
    WHEN mail_to LIKE '%Williams%' THEN '150'
    WHEN mail_to LIKE '%Brown%' THEN '000'
    WHEN mail_to LIKE '%Davis%' THEN '175'
    WHEN mail_to LIKE '%Miller%' THEN '225'
    WHEN mail_to LIKE '%Wilson%' THEN '100'
    WHEN mail_to LIKE '%Moore%' THEN '000'
    WHEN mail_to LIKE '%Anderson%' THEN '250'
    WHEN mail_to LIKE '%Taylor%' THEN '050'
    ELSE '000'
  END,
  prayer_group = CASE 
    WHEN mail_to LIKE '%Smith%' THEN 'South Bay'
    WHEN mail_to LIKE '%Johnson%' THEN 'Fremont'
    WHEN mail_to LIKE '%Williams%' THEN 'Trivalley'
    WHEN mail_to LIKE '%Brown%' THEN 'Central Valley'
    WHEN mail_to LIKE '%Davis%' THEN 'San Francisco'
    WHEN mail_to LIKE '%Miller%' THEN 'South Bay'
    WHEN mail_to LIKE '%Wilson%' THEN 'Fremont'
    WHEN mail_to LIKE '%Moore%' THEN 'Trivalley'
    WHEN mail_to LIKE '%Anderson%' THEN 'Central Valley'
    WHEN mail_to LIKE '%Taylor%' THEN 'San Francisco'
    ELSE 'South Bay'
  END;