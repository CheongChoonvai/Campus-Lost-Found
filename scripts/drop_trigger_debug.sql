-- Run this in the Supabase SQL Editor to DISABLE the trigger temporarily.

DROP TRIGGER IF EXISTS create_profile_on_auth_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_insert();

-- After running this:
-- 1. Try signing up again in your app.
-- 
-- IF SIGNUP WORKS:
--    The problem was the trigger code. We can fix it or handle profile creation in the application code instead.
--    This is the best outcome.
--
-- IF SIGNUP STILL FAILS (500 Error):
--    The problem is NOT your code/db. It is likely a Supabase Project setting configuration issue, typically:
--    1. SMTP Settings are enabled but invalid (Supabase tries to send email, fails, and rolls back).
--    2. Supabase "Rate Limit" has been hit for email sending.
