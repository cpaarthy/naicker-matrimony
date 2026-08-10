-- NAICKER MATRIMONY V5 — PRIVATE PHONE + SECURE ADMIN PROFILE ACTIONS
-- Run this ONCE in Supabase SQL Editor after the V4 migration.
-- This migration moves phone/security-answer data out of the public profiles table.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. Private member data
-- ============================================================
create table if not exists public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  security_answer text,
  updated_at timestamptz not null default now()
);

alter table public.profile_private enable row level security;

drop policy if exists "Users can read own private profile data" on public.profile_private;
drop policy if exists "Users can insert own private profile data" on public.profile_private;
drop policy if exists "Users can update own private profile data" on public.profile_private;
drop policy if exists "Users can delete own private profile data" on public.profile_private;

create policy "Users can read own private profile data"
  on public.profile_private for select
  using (auth.uid() = user_id);

create policy "Users can insert own private profile data"
  on public.profile_private for insert
  with check (auth.uid() = user_id);

create policy "Users can update own private profile data"
  on public.profile_private for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own private profile data"
  on public.profile_private for delete
  using (auth.uid() = user_id);

-- Copy existing private values before removing them from profiles.
insert into public.profile_private (user_id, phone, security_answer)
select id, phone, security_answer
from public.profiles
where phone is not null or security_answer is not null
on conflict (user_id) do update
set phone = excluded.phone,
    security_answer = excluded.security_answer,
    updated_at = now();

-- ============================================================
-- 2. Remove private columns from the public profiles table
-- ============================================================
alter table public.profiles drop column if exists phone;
alter table public.profiles drop column if exists security_answer;

-- The member-facing profiles table remains readable for approved browsing,
-- but no phone/security-answer column exists there anymore.
-- Remove the old UI-PIN-only mutation policies.
drop policy if exists "Anyone can update profiles (admin PIN gated in UI)" on public.profiles;
drop policy if exists "Anyone can update profile status (admin PIN gated in UI)" on public.profiles;
drop policy if exists "Anyone can delete profiles (admin PIN gated in UI)" on public.profiles;

-- Keep the owner's normal update policy from the original setup.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- 3. Admin PIN verifier
-- ============================================================
create table if not exists public.admin_config (
  id boolean primary key default true check (id = true),
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

insert into public.admin_config (id, pin_hash)
values (true, crypt('Naik@1998!', gen_salt('bf')))
on conflict (id) do nothing;

alter table public.admin_config enable row level security;
revoke all on public.admin_config from anon, authenticated;

drop function if exists public.is_valid_admin_pin(text);
create or replace function public.is_valid_admin_pin(p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select pin_hash into v_hash from public.admin_config where id = true;
  return v_hash is not null and crypt(coalesce(p_pin, ''), v_hash) = v_hash;
end;
$$;
revoke all on function public.is_valid_admin_pin(text) from public;
grant execute on function public.is_valid_admin_pin(text) to anon, authenticated;

-- ============================================================
-- 4. Admin profile RPCs
-- ============================================================
drop function if exists public.admin_fetch_all_profiles(text);
create or replace function public.admin_fetch_all_profiles(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_valid_admin_pin(p_pin) then
    raise exception 'Invalid admin credentials';
  end if;

  select coalesce(jsonb_agg(
    to_jsonb(p) || jsonb_build_object(
      'phone', pp.phone,
      'security_answer', pp.security_answer
    ) order by p.created_at desc
  ), '[]'::jsonb)
  into v_result
  from public.profiles p
  left join public.profile_private pp on pp.user_id = p.id;

  return v_result;
end;
$$;
revoke all on function public.admin_fetch_all_profiles(text) from public;
grant execute on function public.admin_fetch_all_profiles(text) to anon, authenticated;

-- Full admin profile update. Public/member users cannot call this successfully
-- without the admin PIN, and private phone/security data is stored separately.
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

  -- Merge only public profile keys into the existing row so omitted fields stay unchanged.
  v := jsonb_populate_record(v, coalesce(p_profile, '{}'::jsonb) - 'phone' - 'security_answer');

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
    is_verified = v.is_verified
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

-- Admin status / activation / deletion / bulk actions.
drop function if exists public.admin_update_profile_status(text, uuid, text);
create or replace function public.admin_update_profile_status(p_pin text, p_profile_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_valid_admin_pin(p_pin) then raise exception 'Invalid admin credentials'; end if;
  if p_status not in ('pending','approved','rejected') then raise exception 'Invalid profile status'; end if;
  update public.profiles set status = p_status where id = p_profile_id;
end;
$$;
revoke all on function public.admin_update_profile_status(text, uuid, text) from public;
grant execute on function public.admin_update_profile_status(text, uuid, text) to anon, authenticated;

drop function if exists public.admin_set_profile_deactivated(text, uuid, boolean);
create or replace function public.admin_set_profile_deactivated(p_pin text, p_profile_id uuid, p_deactivated boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_valid_admin_pin(p_pin) then raise exception 'Invalid admin credentials'; end if;
  update public.profiles set admin_deactivated = p_deactivated where id = p_profile_id;
end;
$$;
revoke all on function public.admin_set_profile_deactivated(text, uuid, boolean) from public;
grant execute on function public.admin_set_profile_deactivated(text, uuid, boolean) to anon, authenticated;

drop function if exists public.admin_delete_profile(text, uuid);
create or replace function public.admin_delete_profile(p_pin text, p_profile_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_valid_admin_pin(p_pin) then raise exception 'Invalid admin credentials'; end if;
  delete from public.profiles where id = p_profile_id;
end;
$$;
revoke all on function public.admin_delete_profile(text, uuid) from public;
grant execute on function public.admin_delete_profile(text, uuid) to anon, authenticated;

drop function if exists public.admin_bulk_update_profile_status(text, uuid[], text);
create or replace function public.admin_bulk_update_profile_status(p_pin text, p_profile_ids uuid[], p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_valid_admin_pin(p_pin) then raise exception 'Invalid admin credentials'; end if;
  if p_status not in ('pending','approved','rejected') then raise exception 'Invalid profile status'; end if;
  update public.profiles set status = p_status where id = any(p_profile_ids);
end;
$$;
revoke all on function public.admin_bulk_update_profile_status(text, uuid[], text) from public;
grant execute on function public.admin_bulk_update_profile_status(text, uuid[], text) to anon, authenticated;

drop function if exists public.admin_bulk_delete_profiles(text, uuid[]);
create or replace function public.admin_bulk_delete_profiles(p_pin text, p_profile_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_valid_admin_pin(p_pin) then raise exception 'Invalid admin credentials'; end if;
  delete from public.profiles where id = any(p_profile_ids);
end;
$$;
revoke all on function public.admin_bulk_delete_profiles(text, uuid[]) from public;
grant execute on function public.admin_bulk_delete_profiles(text, uuid[]) to anon, authenticated;

-- Admin verification review needs the same protected path.
drop function if exists public.admin_update_verification_status(text, uuid, text, text);
create or replace function public.admin_update_verification_status(p_pin text, p_verification_id uuid, p_status text, p_admin_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
begin
  if not public.is_valid_admin_pin(p_pin) then raise exception 'Invalid admin credentials'; end if;
  select user_id into v_user_id from public.profile_verifications where id = p_verification_id;
  if v_user_id is null then raise exception 'Verification request not found'; end if;
  update public.profile_verifications
  set status = p_status, admin_note = p_admin_note, reviewed_at = now()
  where id = p_verification_id;
  update public.profiles set is_verified = (p_status = 'approved') where id = v_user_id;
end;
$$;
revoke all on function public.admin_update_verification_status(text, uuid, text, text) from public;
grant execute on function public.admin_update_verification_status(text, uuid, text, text) to anon, authenticated;

-- ============================================================
-- 5. Password recovery now reads private data
-- ============================================================
drop function if exists public.reset_password_with_security_answer(text, text, text);
create or replace function public.reset_password_with_security_answer(
  p_phone text, p_security_answer text, p_new_password text
)
returns json language plpgsql security definer set search_path = public, auth as $$
declare
  v_profile_id uuid;
  v_stored_answer text;
begin
  select user_id, security_answer into v_profile_id, v_stored_answer
  from public.profile_private where phone = p_phone limit 1;
  if v_profile_id is null then return json_build_object('success', false, 'error', 'No account found for this phone number'); end if;
  if v_stored_answer is null or lower(trim(v_stored_answer)) <> lower(trim(p_security_answer)) then
    return json_build_object('success', false, 'error', 'Security answer is incorrect');
  end if;
  if length(p_new_password) < 6 then return json_build_object('success', false, 'error', 'Password must be at least 6 characters'); end if;
  update auth.users set encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now() where id = v_profile_id;
  return json_build_object('success', true);
end;
$$;
revoke all on function public.reset_password_with_security_answer(text, text, text) from public;
grant execute on function public.reset_password_with_security_answer(text, text, text) to anon, authenticated;

drop function if exists public.reset_password_with_security_answer_email(text, text, text);
create or replace function public.reset_password_with_security_answer_email(
  p_email text, p_security_answer text, p_new_password text
)
returns json language plpgsql security definer set search_path = public, auth as $$
declare
  v_profile_id uuid;
  v_stored_answer text;
begin
  select u.id into v_profile_id from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
  if v_profile_id is null then return json_build_object('success', false, 'error', 'No account found for this email'); end if;
  select security_answer into v_stored_answer from public.profile_private where user_id = v_profile_id;
  if v_stored_answer is null or lower(trim(v_stored_answer)) <> lower(trim(p_security_answer)) then
    return json_build_object('success', false, 'error', 'Security answer is incorrect');
  end if;
  if length(p_new_password) < 6 then return json_build_object('success', false, 'error', 'Password must be at least 6 characters'); end if;
  update auth.users set encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now() where id = v_profile_id;
  return json_build_object('success', true);
end;
$$;
revoke all on function public.reset_password_with_security_answer_email(text, text, text) from public;
grant execute on function public.reset_password_with_security_answer_email(text, text, text) to anon, authenticated;

-- The private table should never be selectable by the public API except through
-- the owner's RLS policy or the admin SECURITY DEFINER RPCs above.
revoke all on public.profile_private from anon;
revoke all on public.profile_private from authenticated;
grant select, insert, update, delete on public.profile_private to authenticated;
