/*
  # Create announcements table

  1. New Tables
    - `announcements`
      - `id` (uuid, primary key) - Unique identifier for each announcement
      - `content` (text) - HTML formatted announcement content
      - `start_date` (timestamptz) - When the announcement should start displaying
      - `end_date` (timestamptz) - When the announcement should stop displaying
      - `is_active` (boolean) - Manual toggle to enable/disable announcement
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `announcements` table
    - Add policy for authenticated users to read active announcements within date range
    - Add policy for authenticated users to manage announcements (for future admin panel)

  3. Test Data
    - Insert sample announcement for testing
*/

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
  ON announcements
  FOR SELECT
  USING (
    is_active = true 
    AND start_date <= now() 
    AND end_date >= now()
  );

CREATE POLICY "Authenticated users can insert announcements"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update announcements"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete announcements"
  ON announcements
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert test data
INSERT INTO announcements (content, start_date, end_date, is_active)
VALUES 
  (
    '<h3>Welcome to St. Thomas Church!</h3><p>Join us this Sunday for our special worship service at 10:00 AM. All are welcome!</p>',
    now() - interval '1 day',
    now() + interval '7 days',
    true
  ),
  (
    '<h3>Youth Group Meeting</h3><p>Youth group will meet this Friday at 6:00 PM in the fellowship hall. Pizza will be provided!</p>',
    now() - interval '2 days',
    now() + interval '5 days',
    true
  );