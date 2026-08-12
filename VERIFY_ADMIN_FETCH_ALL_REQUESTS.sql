-- Run this in Supabase SQL Editor to check whether the function actually exists.
select
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
from pg_proc
where proname = 'admin_fetch_all_requests';

-- If this returns 0 rows, the function was never created (V7 didn't fully run).
-- If it returns 1 row but the app still errors, it's likely a stale
-- PostgREST schema cache — run this to force a refresh:
notify pgrst, 'reload schema';
