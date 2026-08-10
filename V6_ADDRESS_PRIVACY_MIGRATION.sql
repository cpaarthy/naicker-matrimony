-- FINAL V6 ADDRESS PRIVACY HARDENING
-- Members: address/village/district/city/state are hidden until an
-- accepted interest exists. Phone/security data remain private.
-- Admin access continues through the existing admin RPCs.

create or replace function public.member_fetch_approved_profiles()
returns setof jsonb
language sql
security definer
set search_path = public
as $$
  select
    (to_jsonb(p)
      - 'phone' - 'security_answer'
      - 'address' - 'village' - 'district' - 'city' - 'state'
    )
    || jsonb_build_object(
      'address', null,
      'village', null,
      'district', null,
      'city', null,
      'state', null
    )
  from public.profiles p
  where p.status = 'approved'
    and coalesce(p.admin_deactivated, false) = false
    and p.id <> auth.uid()
  order by p.created_at desc;
$$;

grant execute on function public.member_fetch_approved_profiles() to authenticated;

create or replace function public.member_fetch_profile(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile jsonb;
  v_user uuid := auth.uid();
  v_unlocked boolean := false;
begin
  if v_user is null then return null; end if;

  select to_jsonb(p) - 'phone' - 'security_answer'
    into v_profile
  from public.profiles p
  where p.id = p_profile_id
    and p.status = 'approved'
    and coalesce(p.admin_deactivated, false) = false;

  if v_profile is null then return null; end if;

  if v_user = p_profile_id then
    v_unlocked := true;
  else
    select exists (
      select 1
      from public.requests r
      where r.status = 'accepted'
        and ((r.from_id = v_user and r.to_id = p_profile_id)
          or (r.from_id = p_profile_id and r.to_id = v_user))
    ) into v_unlocked;
  end if;

  if not v_unlocked then
    v_profile := v_profile
      - 'address' - 'village' - 'district' - 'city' - 'state'
      || jsonb_build_object(
        'address', null, 'village', null, 'district', null,
        'city', null, 'state', null
      );
  end if;

  return v_profile;
end;
$$;

grant execute on function public.member_fetch_profile(uuid) to authenticated;

-- Prevent ordinary authenticated members from directly selecting the raw
-- profiles table. Member-facing profile reads must use the RPCs above.
revoke select on public.profiles from authenticated;

-- The application still needs members to update their own profile. Existing
-- UPDATE RLS policies are intentionally left unchanged.
