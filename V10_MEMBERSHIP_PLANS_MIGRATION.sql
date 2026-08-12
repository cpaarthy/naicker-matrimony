-- NAICKER MATRIMONY — V10 MEMBERSHIP PLANS (Free / Silver / Gold)
-- Run once in Supabase SQL Editor.
--
-- Goal:
--   * Every profile has a `plan` column: 'free' (default), 'silver', or 'gold'.
--   * Only the admin can change a member's plan (manual toggle, no payment
--     gateway yet — that can be layered on top of this later).
--   * Paid plans currently unlock a higher daily profile-view limit.
--     (Silver/Gold badges are shown in the UI; enforcement of the daily
--     view limit happens in the app using `daily_view_count` / `daily_view_date`
--     added below.)

begin;

-- 1) Plan column on profiles. Defaults to 'free' for everyone.
alter table public.profiles
  add column if not exists plan text not null default 'free';

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'silver', 'gold'));

-- 2) Daily profile-view tracking, used to enforce the plan's daily view limit.
--    daily_view_count resets whenever daily_view_date is not today.
alter table public.profiles
  add column if not exists daily_view_count int not null default 0;

alter table public.profiles
  add column if not exists daily_view_date date;

-- 3) Admin-only RPC to change a member's plan. Mirrors admin_set_profile_deactivated.
drop function if exists public.admin_set_profile_plan(text, uuid, text);
create or replace function public.admin_set_profile_plan(p_pin text, p_profile_id uuid, p_plan text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_valid_admin_pin(p_pin) then
    raise exception 'Invalid admin credentials';
  end if;
  if p_plan not in ('free', 'silver', 'gold') then
    raise exception 'Invalid plan: %', p_plan;
  end if;
  update public.profiles set plan = p_plan where id = p_profile_id;
end;
$$;
revoke all on function public.admin_set_profile_plan(text, uuid, text) from public;
grant execute on function public.admin_set_profile_plan(text, uuid, text) to anon, authenticated;

-- 4) RPC the member calls when they open another profile. Atomically checks
--    and increments today's view count against their plan's daily limit,
--    resetting the counter if the stored date isn't today.
--    Limits: free = 10/day, silver = 50/day, gold = unlimited (-1).
drop function if exists public.member_register_profile_view(uuid);
create or replace function public.member_register_profile_view(p_viewer_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_plan text;
  v_count int;
  v_date date;
  v_limit int;
  v_today date := current_date;
begin
  if auth.uid() is null or auth.uid() <> p_viewer_id then
    raise exception 'Not authorized';
  end if;

  select plan, daily_view_count, daily_view_date
    into v_plan, v_count, v_date
    from public.profiles
    where id = p_viewer_id
    for update;

  if v_plan is null then
    return jsonb_build_object('allowed', true, 'remaining', null);
  end if;

  v_limit := case v_plan
    when 'gold' then -1
    when 'silver' then 50
    else 10
  end;

  if v_date is distinct from v_today then
    v_count := 0;
  end if;

  if v_limit >= 0 and v_count >= v_limit then
    update public.profiles set daily_view_count = v_count, daily_view_date = v_today where id = p_viewer_id;
    return jsonb_build_object('allowed', false, 'remaining', 0, 'limit', v_limit, 'plan', v_plan);
  end if;

  v_count := v_count + 1;
  update public.profiles set daily_view_count = v_count, daily_view_date = v_today where id = p_viewer_id;

  return jsonb_build_object(
    'allowed', true,
    'remaining', case when v_limit < 0 then null else greatest(v_limit - v_count, 0) end,
    'limit', v_limit,
    'plan', v_plan
  );
end;
$$;
revoke all on function public.member_register_profile_view(uuid) from public;
grant execute on function public.member_register_profile_view(uuid) to authenticated;

-- 5) Include `plan` in the admin full-profile update whitelist so the
--    generic AdminEditProfile "Save changes" form doesn't clobber it back to
--    free. (The dedicated admin_set_profile_plan RPC above is still the
--    normal way the admin changes a plan from the Plan control on each row.)
drop function if exists public.admin_update_profile(text, uuid, jsonb);
create or replace function public.admin_update_profile(
  p_pin text,
  p_profile_id uuid,
  p_profile jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v profiles%rowtype;
  v_private profile_private%rowtype;
begin
  if not public.is_valid_admin_pin(p_pin) then
    raise exception 'Invalid admin credentials';
  end if;

  select * into v from public.profiles where id = p_profile_id for update;
  if v.id is null then raise exception 'Profile not found'; end if;

  v := jsonb_populate_record(v, coalesce(p_profile, '{}'::jsonb) - 'phone' - 'security_answer');

  if v.plan not in ('free', 'silver', 'gold') then
    v.plan := 'free';
  end if;

  update public.profiles set
    profile_for = v.profile_for,
    name = v.name,
    gender = v.gender,
    age = v.age,
    height = v.height,
    religion = v.religion,
    caste = v.caste,
    sub_caste = v.sub_caste,
    education = v.education,
    occupation = v.occupation,
    income = v.income,
    address = v.address,
    district = v.district,
    city = v.city,
    state = v.state,
    mother_tongue = v.mother_tongue,
    about = v.about,
    photo_url = v.photo_url,
    status = v.status,
    father_occupation = v.father_occupation,
    mother_occupation = v.mother_occupation,
    siblings = v.siblings,
    family_type = v.family_type,
    star = v.star,
    rasi = v.rasi,
    birth_time = v.birth_time,
    birth_place = v.birth_place,
    complexion = v.complexion,
    body_type = v.body_type,
    blood_group = v.blood_group,
    diet = v.diet,
    smoking = v.smoking,
    drinking = v.drinking,
    pref_age_min = v.pref_age_min,
    pref_age_max = v.pref_age_max,
    pref_education = v.pref_education,
    pref_occupation = v.pref_occupation,
    admin_deactivated = v.admin_deactivated,
    last_active_at = v.last_active_at,
    is_verified = v.is_verified,
    plan = v.plan
  where id = p_profile_id;

  select * into v_private from public.profile_private where user_id = p_profile_id;
  insert into public.profile_private (user_id, phone, security_answer, updated_at)
  values (
    p_profile_id,
    case when p_profile ? 'phone' then p_profile->>'phone' else v_private.phone end,
    case when p_profile ? 'security_answer' then p_profile->>'security_answer' else v_private.security_answer end,
    now()
  )
  on conflict (user_id) do update set
    phone = excluded.phone,
    security_answer = excluded.security_answer,
    updated_at = now();

  return jsonb_build_object('success', true);
end;
$$;
revoke all on function public.admin_update_profile(text, uuid, jsonb) from public;
grant execute on function public.admin_update_profile(text, uuid, jsonb) to anon, authenticated;

commit;

-- ============================================================================
-- Notes:
--   * member_fetch_profile / member_fetch_approved_profiles / admin_fetch_all_profiles
--     all use to_jsonb(p), so the new `plan` column is already included in
--     every profile response without any change to those RPCs.
--   * Nothing here charges money. The plan is purely an admin-set flag until
--     a payment gateway (Razorpay/Stripe) is wired up later; at that point,
--     a successful payment webhook can simply call admin_set_profile_plan
--     (or an equivalent server-side function) instead of the admin doing it
--     by hand.
-- ============================================================================
