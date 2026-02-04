-- Run this in Supabase SQL Editor to allow public read access to items
-- This updates RLS policies so anyone (even unauthenticated users) can view items

-- First, drop the existing SELECT policy
DROP POLICY IF EXISTS "Anyone can view active items" ON items;

-- Create a new policy that allows TRUE for all SELECT operations (public read)
CREATE POLICY "Public can view active items" ON items
  FOR SELECT 
  USING (status = 'active');

-- Alternative: If you want completely public read (no RLS check for SELECT):
-- This allows the anon key to read items without being logged in

-- Grant SELECT to anon role
GRANT SELECT ON items TO anon;
GRANT SELECT ON profiles TO anon;

-- For profiles table - allow public read
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT
  USING (true);

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow inserting profile (for the trigger or manual insert)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
