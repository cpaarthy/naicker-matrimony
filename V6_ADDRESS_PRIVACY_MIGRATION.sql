-- V6 Address Privacy hardening
-- Members must NOT receive address/location fields from browse/profile APIs
-- until an accepted interest exists. Phone remains private.

create or replace function public.member_fetch_approved_profiles()
returns setof jsonb
language sql
security definer
set search_path = public
as $$
  select
    (
      to_jsonb(p)
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
  if v_user is null then
    return null;
  end if;

  select
    to_jsonb(p) - 'phone' - 'security_answer'
  into v_profile
  from public.profiles p
  where p.id = p_profile_id
    and p.status = 'approved'
    and coalesce(p.admin_deactivated, false) = false;

  if v_profile is null then
    return null;
  end if;

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
$$;

grant execute on function public.member_fetch_profile(uuid) to authenticated;
