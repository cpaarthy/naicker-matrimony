-- NAICKER MATRIMONY — FINAL MEMBER PROFILE READ PRIVACY
-- Run once in Supabase SQL Editor AFTER the current working version is live.
--
-- Goal:
--   * Members can create/update their own profile.
--   * Members cannot directly SELECT the raw profiles table.
--   * Browse/profile reads go through SECURITY DEFINER RPCs.
--   * Address/city/district/state are hidden until an accepted interest exists.
--   * Admin continues to use admin_fetch_all_profiles(p_pin).
--   * Phone/security data remain private.

begin;

-- 1) Remove the broad raw-table read policy.
drop policy if exists "public can read profiles" on public.profiles;
drop policy if exists "Public can read profiles" on public.profiles;

-- 2) Remove table-level SELECT from member-facing roles.
revoke select on table public.profiles from public;
revoke select on table public.profiles from anon;
revoke select on table public.profiles from authenticated;

-- 3) Keep the permissions needed for registration/profile editing.
grant insert, update on table public.profiles to authenticated;

-- 4) Ensure the owner's write policies remain in place.
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- 5) Rebuild member profile RPC.
--    Owner can read their own profile even while pending.
--    Other members can read only approved profiles.
create or replace function public.member_fetch_profile(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_profile jsonb;
  v_user uuid := auth.uid();
  v_unlocked boolean := false;
begin
  if v_user is null then
    return null;
  end if;

  select to_jsonb(p) - 'phone' - 'security_answer'
  into v_profile
  from public.profiles p
  where p.id = p_profile_id
    and (
      p.id = v_user
      or (
        p.status = 'approved'
        and coalesce(p.admin_deactivated, false) = false
      )
    );

  if v_profile is null then
    return null;
  end if;

  -- The member can always see their own address while editing/viewing
  -- their own profile. Other members need an accepted interest.
  if v_user = p_profile_id then
    v_unlocked := true;
  else
    select exists (
      select 1
      from public.requests r
      where r.status = 'accepted'
        and (
          (r.from_id = v_user and r.to_id = p_profile_id)
          or
          (r.from_id = p_profile_id and r.to_id = v_user)
        )
    )
    into v_unlocked;
  end if;

  if not v_unlocked then
    v_profile :=
      v_profile
      - 'address'
      - 'village'
      - 'district'
      - 'city'
      - 'state'
      || jsonb_build_object(
        'address', null,
        'village', null,
        'district', null,
        'city', null,
        'state', null
      );
  end if;

  return v_profile;
end;
$function$;

grant execute on function public.member_fetch_profile(uuid)
to authenticated;

-- 6) Browse RPC: no location fields before acceptance.
create or replace function public.member_fetch_approved_profiles()
returns setof jsonb
language sql
security definer
set search_path = public
as $function$
  select
    (to_jsonb(p)
      - 'phone'
      - 'security_answer'
      - 'address'
      - 'village'
      - 'district'
      - 'city'
      - 'state'
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
$function$;

grant execute on function public.member_fetch_approved_profiles()
to authenticated;

commit;
