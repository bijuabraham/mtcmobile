/*
  # Create contact_us table

  1. New Tables
    - `contact_us`
      - `id` (uuid, primary key) - Unique identifier
      - `title` (text) - Contact title/role (e.g., "Pastor", "Church Office")
      - `name` (text) - Contact person name
      - `phone` (text) - Phone number
      - `email` (text) - Email address
      - `display_order` (integer) - Order in which contacts should be displayed
      - `is_active` (boolean) - Whether this contact is active
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `contact_us` table
    - Add policy for anyone to read active contacts
    - Add policy for authenticated users to manage contacts

  3. Test Data
    - Insert sample contacts for testing
*/

CREATE TABLE IF NOT EXISTS contact_us (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contact_us ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active contacts"
  ON contact_us
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert contacts"
  ON contact_us
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contacts"
  ON contact_us
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contacts"
  ON contact_us
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert test data
INSERT INTO contact_us (title, name, phone, email, display_order, is_active)
VALUES 
  ('Pastor', 'Fr. John Smith', '(555) 123-4567', 'pastor@church.org', 1, true),
  ('Church Office', 'Mary Johnson', '(555) 123-4568', 'office@church.org', 2, true),
  ('Youth Ministry', 'David Brown', '(555) 123-4569', 'youth@church.org', 3, true);