-- NAICKER MATRIMONY — V13 ADMIN "MOST VIEWED PROFILES" FIX
-- Run once in Supabase SQL Editor.
--
-- Problem: fetchMostViewedProfiles() queries the recently_viewed table
-- directly as the logged-in admin user. RLS on that table only allows a
-- user to see their own view history or views of their own profile — the
-- admin isn't the owner of every row, so the query silently returns zero
-- rows and the "Most Viewed Profiles" analytics card looks empty.
--
-- Fix: add an admin-only SECURITY DEFINER RPC (same pattern as
-- admin_fetch_all_requests) that returns every row, gated by the admin PIN
-- instead of RLS ownership.

begin;

drop function if exists public.admin_fetch_all_views(text);
create or replace function public.admin_fetch_all_views(p_pin text)
returns setof jsonb
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not public.is_valid_admin_pin(p_pin) then
    return;
  end if;
  return query
    select jsonb_build_object(
      'viewer_id', rv.viewer_id,
      'viewed_id', rv.viewed_id,
      'viewed_at', rv.viewed_at
    )
    from public.recently_viewed rv
    order by rv.viewed_at desc;
end;
$function$;

revoke all on function public.admin_fetch_all_views(text) from public;
grant execute on function public.admin_fetch_all_views(text) to authenticated;

notify pgrst, 'reload schema';

commit;
