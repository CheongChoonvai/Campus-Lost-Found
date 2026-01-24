-- Create `profiles` table in public schema and add trigger to populate it
-- Run this in the Supabase SQL editor (or via a migration runner with a service role key)

BEGIN;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to insert a profile row after a new auth.user is created
CREATE OR REPLACE FUNCTION public.handle_auth_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Attempt to extract full_name from available metadata fields
  BEGIN
    INSERT INTO public.profiles (id, full_name, created_at)
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(NEW.raw_user_meta_data->> 'full_name', ''),
        NULLIF(NEW.user_metadata->> 'full_name', ''),
        NULLIF(NEW.raw_user_meta_data->> 'fullName', ''),
        NULLIF(NEW.user_metadata->> 'fullName', ''),
        NULLIF(NEW.email, '')
      ),
      NOW()
    );
  EXCEPTION WHEN unique_violation THEN
    -- ignore if profile already exists
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to call the function after insert
DROP TRIGGER IF EXISTS create_profile_on_auth_user ON auth.users;
CREATE TRIGGER create_profile_on_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_insert();

COMMIT;

-- Notes:
-- 1) This trigger runs with the privileges of the owner of the function (SECURITY DEFINER),
--    which should be a role with permission to insert into public.profiles. In Supabase, functions
--    created in the SQL editor typically run as the DB owner and SECURITY DEFINER is appropriate.
-- 2) If you prefer not to use a trigger, run a one-off migration to copy existing `auth.users`
--    metadata into `public.profiles` using a server-side script with the service_role key.
