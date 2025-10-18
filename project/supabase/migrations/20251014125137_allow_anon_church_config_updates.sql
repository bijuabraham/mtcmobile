/*
  # Allow Anonymous Access to Church Configuration

  ## Changes
  - Add SELECT policy for anonymous users (anon role)
  - Add UPDATE policy for anonymous users (anon role)
  
  ## Security Note
  - This allows database admin tools to update configuration
  - Church configuration is single-row, admin-only data
  - Consider restricting in production if needed
*/

-- Allow anonymous users to read church config
CREATE POLICY "Anonymous users can read church config"
  ON church_configurations FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to update church config
CREATE POLICY "Anonymous users can update church config"
  ON church_configurations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
