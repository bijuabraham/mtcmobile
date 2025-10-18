-- Church Management App - Replit PostgreSQL Schema
-- Migrated from Supabase with custom authentication

-- Create users table (replaces Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create church_configurations table
CREATE TABLE IF NOT EXISTS church_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_name text NOT NULL DEFAULT 'Church Management App',
  primary_color text NOT NULL DEFAULT '#C41E3A',
  secondary_color text NOT NULL DEFAULT '#FFD700',
  accent_color text NOT NULL DEFAULT '#FFFFFF',
  logo_url text,
  api_endpoints jsonb DEFAULT '{}'::jsonb,
  calendar_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create households table (renamed from families)
CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  family_name text NOT NULL,
  address text,
  phone text,
  email text,
  photo_url text,
  donor_id text,
  prayer_group text,
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
  household_id uuid REFERENCES households(id) ON DELETE SET NULL,
  relationship text,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount decimal(10, 2) NOT NULL,
  donation_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'General',
  description text,
  payment_method text DEFAULT 'Cash',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contact_us table
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

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled boolean DEFAULT true,
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_households_user_id ON households(user_id);
CREATE INDEX IF NOT EXISTS idx_members_household_id ON members(household_id);
CREATE INDEX IF NOT EXISTS idx_members_first_name ON members(first_name);
CREATE INDEX IF NOT EXISTS idx_members_last_name ON members(last_name);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_contact_us_order ON contact_us(display_order);

-- Insert default church configuration
INSERT INTO church_configurations (church_name, primary_color, secondary_color, accent_color)
VALUES (
  'Church Management App',
  '#C41E3A',
  '#FFD700',
  '#FFFFFF'
)
ON CONFLICT DO NOTHING;

-- Insert sample announcements
INSERT INTO announcements (content, start_date, end_date, is_active)
VALUES 
  (
    '<h3>Welcome to Our Church!</h3><p>Join us this Sunday for our worship service at 10:00 AM. All are welcome!</p>',
    now() - interval '1 day',
    now() + interval '30 days',
    true
  ),
  (
    '<h3>Bible Study</h3><p>Wednesday evening Bible study at 7:00 PM. Come grow in faith with us!</p>',
    now() - interval '2 days',
    now() + interval '30 days',
    true
  );

-- Insert sample contacts
INSERT INTO contact_us (title, name, phone, email, display_order, is_active)
VALUES 
  ('Pastor', 'Church Pastor', '(555) 123-4567', 'pastor@church.org', 1, true),
  ('Church Office', 'Office Admin', '(555) 123-4568', 'office@church.org', 2, true);
