/*
  # Add Update Policies for Church Configuration

  ## Changes
  - Add UPDATE policy for church_configurations table
  - Allows authenticated users to update church configuration
  
  ## Security
  - Only authenticated users can update configuration
  - All authenticated users have update access (as this is typically admin-only data)
*/

CREATE POLICY "Authenticated users can update church config"
  ON church_configurations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
