-- Standalone fix: create ONLY the admin_fetch_all_requests function.
-- Run this directly in Supabase SQL Editor.

-- Prerequisite check: this function calls public.is_valid_admin_pin(text).
-- If that doesn't exist yet, this will fail with a clear error naming it —
-- in that case, run V5_SECURITY_PRIVACY_MIGRATION.sql first (it defines
-- is_valid_admin_pin), then re-run this file.

create or replace function public.admin_fetch_all_requests(p_pin text)
returns setof jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
begin
  if not public.is_valid_admin_pin(p_pin) then
    return;
  end if;
  return query
    select to_jsonb(r)
    from public.requests r
    order by r.created_at desc;
end;
$function$;

revoke all on function public.admin_fetch_all_requests(text) from public;
grant execute on function public.admin_fetch_all_requests(text) to authenticated;

-- Force Supabase's API layer to pick up the new function immediately.
notify pgrst, 'reload schema';

-- Verify it now exists:
select
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
from pg_proc
where proname = 'admin_fetch_all_requests';
