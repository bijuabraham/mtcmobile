/*
  # Church Management App Database Schema

  ## Overview
  This migration creates the complete database schema for a white-label church management application.
  
  ## New Tables Created
  
  1. **church_configurations**
     - Stores church-specific branding and configuration
     - Fields: id, church_name, primary_color, secondary_color, accent_color, logo_url, api_endpoints, calendar_id
     - Used for white-labeling the app for different churches
  
  2. **families**
     - Stores family information and profiles
     - Fields: id, user_id, family_name, address, phone, email, photo_url, created_at, updated_at
     - One family per authenticated user
  
  3. **members**
     - Church directory with member information
     - Fields: id, first_name, last_name, email, phone, photo_url, family_id, is_visible
     - Searchable by first or last name
  
  4. **donations**
     - Tracks all donations made to the church
     - Fields: id, user_id, amount, donation_date, category, description, payment_method
     - Supports date range filtering
  
  5. **user_settings**
     - Stores user-specific preferences
     - Fields: id, user_id, notifications_enabled, language, created_at, updated_at
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Church directory has visibility controls
  - Admins can view all records (future enhancement)
  
  ## Indexes
  - Added indexes on foreign keys for performance
  - Search indexes on member names
  - Date indexes on donations for filtering
*/

-- Create church_configurations table
CREATE TABLE IF NOT EXISTS church_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_name text NOT NULL DEFAULT 'Mar Thoma Church Of San Francisco',
  primary_color text NOT NULL DEFAULT '#C41E3A',
  secondary_color text NOT NULL DEFAULT '#FFD700',
  accent_color text NOT NULL DEFAULT '#FFFFFF',
  logo_url text,
  api_endpoints jsonb DEFAULT '{"iconcmo": "https://api.iconcmo.com", "announcements": "https://www.marthomasf.org/mobilemessage", "standardPayments": "https://marthomasf.org/standard-payments/"}'::jsonb,
  calendar_id text DEFAULT 'admin@marthomasf.org',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  family_name text NOT NULL,
  address text,
  phone text,
  email text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create members table (church directory)
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  photo_url text,
  family_id uuid REFERENCES families(id) ON DELETE SET NULL,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount decimal(10, 2) NOT NULL,
  donation_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'General',
  description text,
  payment_method text DEFAULT 'Cash',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled boolean DEFAULT true,
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_families_user_id ON families(user_id);
CREATE INDEX IF NOT EXISTS idx_members_family_id ON members(family_id);
CREATE INDEX IF NOT EXISTS idx_members_first_name ON members(first_name);
CREATE INDEX IF NOT EXISTS idx_members_last_name ON members(last_name);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE church_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for church_configurations
CREATE POLICY "Church config is publicly readable"
  ON church_configurations FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for families
CREATE POLICY "Users can view own family"
  ON families FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own family"
  ON families FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family"
  ON families FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own family"
  ON families FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for members (church directory)
CREATE POLICY "All authenticated users can view visible members"
  ON members FOR SELECT
  TO authenticated
  USING (is_visible = true);

CREATE POLICY "Users can insert members to their family"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their family members"
  ON members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = family_id
      AND families.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their family members"
  ON members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = family_id
      AND families.user_id = auth.uid()
    )
  );

-- RLS Policies for donations
CREATE POLICY "Users can view own donations"
  ON donations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own donations"
  ON donations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own donations"
  ON donations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own donations"
  ON donations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default church configuration
INSERT INTO church_configurations (church_name, primary_color, secondary_color, accent_color, calendar_id)
VALUES (
  'Mar Thoma Church Of San Francisco',
  '#C41E3A',
  '#FFD700',
  '#FFFFFF',
  'admin@marthomasf.org'
)
ON CONFLICT DO NOTHING;
