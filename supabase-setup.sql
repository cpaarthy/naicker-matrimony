-- Naicker Matrimony — Full Database Setup
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste this -> Run

-- ============================================================================
-- IF YOUR DATABASE IS ALREADY LIVE (profiles table already exists):
-- Do NOT run the whole script again. Just run this migration instead:
--
--   alter table profiles add column if not exists sub_caste text default 'Malava';
--   alter table profiles add column if not exists address text;
--   alter table profiles add column if not exists district text;
--   alter table profiles add column if not exists profile_for text default 'Self';
--   alter table profiles add column if not exists father_occupation text;
--   alter table profiles add column if not exists mother_occupation text;
--   alter table profiles add column if not exists siblings text;
--   alter table profiles add column if not exists family_type text;
--   alter table profiles add column if not exists star text;
--   alter table profiles add column if not exists rasi text;
--   alter table profiles add column if not exists birth_time text;
--   alter table profiles add column if not exists birth_place text;
--   alter table profiles add column if not exists complexion text;
--   alter table profiles add column if not exists body_type text;
--   alter table profiles add column if not exists blood_group text;
--   alter table profiles add column if not exists diet text;
--   alter table profiles add column if not exists smoking text;
--   alter table profiles add column if not exists drinking text;
--   alter table profiles add column if not exists pref_age_min int;
--   alter table profiles add column if not exists pref_age_max int;
--   alter table profiles add column if not exists pref_education text;
--   alter table profiles add column if not exists pref_occupation text;
--   alter table profiles add column if not exists admin_deactivated boolean not null default false;
--
--   alter table contact_messages add column if not exists resolved boolean not null default false;
--   alter table contact_messages add column if not exists admin_reply text;
--   create policy if not exists "Anyone can update contact messages (admin PIN gated in UI)" on contact_messages for update using (true);
--
--   create table if not exists activity_log (
--     id uuid primary key default gen_random_uuid(),
--     action text not null,
--     target_type text not null,
--     target_id text,
--     target_name text,
--     details text,
--     created_at timestamptz not null default now()
--   );
--   alter table activity_log enable row level security;
--   create policy "Public can read activity log (admin PIN gated in UI)" on activity_log for select using (true);
--   create policy "Anyone can insert activity log (admin PIN gated in UI)" on activity_log for insert with check (true);
--
--   create table if not exists master_lists (
--     id uuid primary key default gen_random_uuid(),
--     list_type text not null,
--     value text not null,
--     created_at timestamptz not null default now(),
--     unique(list_type, value)
--   );
--   alter table master_lists enable row level security;
--   create policy "Public can read master lists" on master_lists for select using (true);
--   create policy "Anyone can insert master list values (admin PIN gated in UI)" on master_lists for insert with check (true);
--   create policy "Anyone can delete master list values (admin PIN gated in UI)" on master_lists for delete using (true);
--
-- NOTE: newer features (notifications, block/report, recently viewed, self-service
-- account deletion) added more tables and functions after this comment was written.
-- Rather than keep duplicating everything here, use the standalone `migration-only.sql`
-- file in this project folder — it always has the complete, up-to-date migration for
-- an existing live database. Just run that file's contents in the SQL Editor.
--
-- Then skip down to the bottom of this file for the storage bucket section
-- (only if you haven't already set that up).
-- ============================================================================

-- ============ PROFILES ============
-- profile.id = auth.users.id (one profile per logged-in account)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  profile_for text default 'Self', -- 'Self' | 'Son' | 'Daughter'
  name text not null,
  gender text not null,
  age int not null,
  height text,
  religion text,
  caste text,
  sub_caste text default 'Malava',
  education text,
  occupation text,
  income text,
  address text,
  district text,
  city text not null,
  state text,
  mother_tongue text,
  about text,
  phone text not null,
  photo_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),

  -- Family details
  father_occupation text,
  mother_occupation text,
  siblings text,
  family_type text, -- 'Nuclear' | 'Joint'

  -- Horoscope details
  star text,
  rasi text,
  birth_time text,
  birth_place text,

  -- Physical attributes
  complexion text,
  body_type text,
  blood_group text,

  -- Lifestyle
  diet text, -- 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian'
  smoking text, -- 'No' | 'Occasionally' | 'Yes'
  drinking text, -- 'No' | 'Occasionally' | 'Yes'

  -- Partner preference
  pref_age_min int,
  pref_age_max int,
  pref_education text,
  pref_occupation text,

  -- Admin controls
  admin_deactivated boolean not null default false,
  security_answer text, -- mother's name, used for phone-login password recovery
  last_active_at timestamptz
);

-- ============ INTEREST REQUESTS ============
create table requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid references profiles(id) on delete cascade not null,
  to_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============ SITE ANNOUNCEMENTS (admin banner) ============
create table announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

create policy "Public can read announcements" on announcements
  for select using (true);

create policy "Anyone can insert announcements (admin PIN gated in UI)" on announcements
  for insert with check (true);

create policy "Anyone can update announcements (admin PIN gated in UI)" on announcements
  for update using (true);

create policy "Anyone can delete announcements (admin PIN gated in UI)" on announcements
  for delete using (true);

-- ============ NOTIFICATIONS ============
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null, -- 'request_received' | 'request_accepted' | 'request_declined'
  related_profile_id uuid references profiles(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "Users can read own notifications" on notifications
  for select using (auth.uid() = user_id);

create policy "Authenticated users can insert notifications" on notifications
  for insert with check (true);

create policy "Users can update own notifications" on notifications
  for update using (auth.uid() = user_id);

-- ============ BLOCKED PROFILES ============
create table blocked_profiles (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references profiles(id) on delete cascade not null,
  blocked_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);

alter table blocked_profiles enable row level security;

create policy "Users can read own blocks" on blocked_profiles
  for select using (auth.uid() = blocker_id);

create policy "Users can insert own blocks" on blocked_profiles
  for insert with check (auth.uid() = blocker_id);

create policy "Users can delete own blocks" on blocked_profiles
  for delete using (auth.uid() = blocker_id);

-- ============ PROFILE REPORTS ============
create table profile_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade not null,
  reported_id uuid references profiles(id) on delete cascade not null,
  reason text not null,
  details text,
  status text not null default 'open', -- 'open' | 'reviewed' | 'dismissed'
  created_at timestamptz not null default now()
);

alter table profile_reports enable row level security;

create policy "Users can insert own reports" on profile_reports
  for insert with check (auth.uid() = reporter_id);

create policy "Public can read reports (admin PIN gated in UI)" on profile_reports
  for select using (true);

create policy "Anyone can update reports (admin PIN gated in UI)" on profile_reports
  for update using (true);

-- ============ RECENTLY VIEWED PROFILES ============
create table recently_viewed (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid references profiles(id) on delete cascade not null,
  viewed_id uuid references profiles(id) on delete cascade not null,
  viewed_at timestamptz not null default now(),
  unique(viewer_id, viewed_id)
);

alter table recently_viewed enable row level security;

create policy "Users can read own view history" on recently_viewed
  for select using (auth.uid() = viewer_id);

create policy "Users can insert own view history" on recently_viewed
  for insert with check (auth.uid() = viewer_id);

create policy "Users can update own view history" on recently_viewed
  for update using (auth.uid() = viewer_id);

create policy "Users can delete own view history" on recently_viewed
  for delete using (auth.uid() = viewer_id);

create policy "Users can read views of their own profile" on recently_viewed
  for select using (auth.uid() = viewed_id);

-- ============ MANUAL POROTHAM REVIEWS (admin/astrologer override) ============
create table porutham_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_a_id uuid references profiles(id) on delete cascade not null,
  profile_b_id uuid references profiles(id) on delete cascade not null,
  calculated_matched_count int,
  calculated_verdict text,
  manual_verdict text not null, -- 'approved' | 'rejected'
  notes text,
  created_at timestamptz not null default now(),
  unique(profile_a_id, profile_b_id)
);

alter table porutham_reviews enable row level security;

create policy "Public can read porutham reviews (admin PIN gated in UI)" on porutham_reviews
  for select using (true);

create policy "Anyone can insert porutham reviews (admin PIN gated in UI)" on porutham_reviews
  for insert with check (true);

create policy "Anyone can update porutham reviews (admin PIN gated in UI)" on porutham_reviews
  for update using (true);

create policy "Anyone can delete porutham reviews (admin PIN gated in UI)" on porutham_reviews
  for delete using (true);

-- ============ ADMIN ACTIVITY LOG ============
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null, -- 'approve' | 'reject' | 'delete' | 'edit' | 'reply_message' | 'reset_password' | 'deactivate' | 'activate' | 'bulk_approve' | 'bulk_reject' | 'bulk_delete'
  target_type text not null, -- 'profile' | 'contact_message' | 'user'
  target_id text,
  target_name text,
  details text,
  created_at timestamptz not null default now()
);

alter table activity_log enable row level security;

create policy "Public can read activity log (admin PIN gated in UI)" on activity_log
  for select using (true);

create policy "Anyone can insert activity log (admin PIN gated in UI)" on activity_log
  for insert with check (true);

-- ============ MASTER LISTS (admin-managed dropdown options) ============
create table master_lists (
  id uuid primary key default gen_random_uuid(),
  list_type text not null, -- 'sub_caste' | 'city' | 'district' | 'state'
  value text not null,
  created_at timestamptz not null default now(),
  unique(list_type, value)
);

-- ============ FAVOURITES ============
create table favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, profile_id)
);

-- ============ CONTACT MESSAGES ============
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  resolved boolean not null default false,
  admin_reply text,
  created_at timestamptz not null default now()
);

-- ============ ROW LEVEL SECURITY ============
alter table profiles enable row level security;
alter table requests enable row level security;
alter table favourites enable row level security;
alter table contact_messages enable row level security;
alter table master_lists enable row level security;

-- Profiles: public can read (needed to browse); only the owner (logged in user) can insert/update their own row
create policy "Public can read profiles" on profiles
  for select using (true);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- NOTE: The admin dashboard in this app uses a PIN check inside the app UI, not database-level
-- admin auth. Because status updates from the admin panel need to work for ANY profile (not just
-- the admin's own), we allow public update — the PIN gate in the UI is the only protection.
-- For stronger security later, set up a real Supabase Auth admin role instead.
create policy "Anyone can update profile status (admin PIN gated in UI)" on profiles
  for update using (true);

-- Requests: users can read requests involving them; anyone logged in can insert; involved parties can update
create policy "Public can read requests" on requests
  for select using (true);

create policy "Authenticated users can insert requests" on requests
  for insert with check (auth.uid() = from_id);

create policy "Involved users can update requests" on requests
  for update using (auth.uid() = from_id or auth.uid() = to_id);

-- Favourites: users manage their own favourites only
create policy "Users can read own favourites" on favourites
  for select using (auth.uid() = user_id);

create policy "Users can insert own favourites" on favourites
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own favourites" on favourites
  for delete using (auth.uid() = user_id);

-- Contact messages: anyone can submit; readable so the in-app Admin Dashboard (PIN-gated in the UI)
-- can display them. If you want DB-level protection instead of UI-level PIN gating, remove the
-- public select policy below and read messages via the Supabase dashboard Table Editor instead.
create policy "Anyone can submit contact messages" on contact_messages
  for insert with check (true);

create policy "Public can read contact messages (admin PIN gated in UI)" on contact_messages
  for select using (true);

create policy "Anyone can update contact messages (admin PIN gated in UI)" on contact_messages
  for update using (true);

-- Allow profile deletion (admin PIN gated in UI)
create policy "Anyone can delete profiles (admin PIN gated in UI)" on profiles
  for delete using (true);

-- Master lists: everyone can read (needed for dropdowns); only admin (PIN gated in UI) can manage
create policy "Public can read master lists" on master_lists
  for select using (true);

create policy "Anyone can insert master list values (admin PIN gated in UI)" on master_lists
  for insert with check (true);

create policy "Anyone can delete master list values (admin PIN gated in UI)" on master_lists
  for delete using (true);

-- ============ PHONE ACCOUNT PASSWORD RECOVERY (no CLI / Edge Function needed) ============
-- This function lets a user with a phone+password account reset their password by
-- correctly answering their security question (mother's name), entirely through SQL
-- run once here — no service_role key handling in the browser, no CLI, no Edge Functions.
create extension if not exists pgcrypto;

create or replace function public.reset_password_with_security_answer(
  p_phone text,
  p_security_answer text,
  p_new_password text
)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile_id uuid;
  v_stored_answer text;
  v_email text;
begin
  select id, security_answer into v_profile_id, v_stored_answer
  from public.profiles
  where phone = p_phone
  limit 1;

  if v_profile_id is null then
    return json_build_object('success', false, 'error', 'No account found for this phone number');
  end if;

  if v_stored_answer is null or lower(trim(v_stored_answer)) <> lower(trim(p_security_answer)) then
    return json_build_object('success', false, 'error', 'Security answer is incorrect');
  end if;

  if length(p_new_password) < 6 then
    return json_build_object('success', false, 'error', 'Password must be at least 6 characters');
  end if;

  update auth.users
  set encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  where id = v_profile_id;

  return json_build_object('success', true);
end;
$$;

-- Allow the anon/public role to call this function (it's still protected by the
-- security-answer check inside the function itself)
grant execute on function public.reset_password_with_security_answer(text, text, text) to anon, authenticated;

-- ============ EMAIL ACCOUNT PASSWORD RECOVERY (no CLI / Edge Function needed) ============
-- Same idea as above, but looks the account up by email (stored in auth.users) instead
-- of phone number. Used by email+password accounts that verified via OTP at signup.
create or replace function public.reset_password_with_security_answer_email(
  p_email text,
  p_security_answer text,
  p_new_password text
)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile_id uuid;
  v_stored_answer text;
begin
  select u.id into v_profile_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  if v_profile_id is null then
    return json_build_object('success', false, 'error', 'No account found for this email');
  end if;

  select security_answer into v_stored_answer
  from public.profiles
  where id = v_profile_id;

  if v_stored_answer is null or lower(trim(v_stored_answer)) <> lower(trim(p_security_answer)) then
    return json_build_object('success', false, 'error', 'Security answer is incorrect');
  end if;

  if length(p_new_password) < 6 then
    return json_build_object('success', false, 'error', 'Password must be at least 6 characters');
  end if;

  update auth.users
  set encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  where id = v_profile_id;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.reset_password_with_security_answer_email(text, text, text) to anon, authenticated;

-- ============ SELF-SERVICE ACCOUNT DELETION ============
-- Lets a logged-in user permanently delete their own account (profile row + auth login).
-- Deployed via SQL Editor only — no CLI/Edge Functions needed.
create or replace function public.delete_own_account()
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Not logged in');
  end if;

  delete from public.profiles where id = v_user_id;
  delete from auth.users where id = v_user_id;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.delete_own_account() to authenticated;

-- ============ STORAGE BUCKET FOR PROFILE PHOTOS ============
-- Run this separately if the bucket doesn't already exist:
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "Public can view profile photos" on storage.objects
  for select using (bucket_id = 'profile-photos');

create policy "Authenticated users can upload their own photos" on storage.objects
  for insert with check (bucket_id = 'profile-photos' and auth.role() = 'authenticated');

create policy "Users can update their own photos" on storage.objects
  for update using (bucket_id = 'profile-photos' and auth.role() = 'authenticated');

-- ============ PROFESSIONAL MATRIMONY EXTENSIONS ============
alter table profiles add column if not exists is_verified boolean not null default false;
-- Run this section once in Supabase SQL Editor after the existing setup.

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table messages enable row level security;
drop policy if exists "Users can read their messages" on messages;
create policy "Users can read their messages" on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "Users can send messages" on messages;
create policy "Users can send messages" on messages for insert with check (auth.uid() = sender_id and exists (select 1 from requests r where r.status = 'accepted' and ((r.from_id = sender_id and r.to_id = receiver_id) or (r.from_id = receiver_id and r.to_id = sender_id))));
drop policy if exists "Receivers can mark messages read" on messages;
create policy "Receivers can mark messages read" on messages for update using (auth.uid() = receiver_id);

create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table saved_searches enable row level security;
drop policy if exists "Users manage own saved searches" on saved_searches;
create policy "Users manage own saved searches" on saved_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists profile_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null default 'identity',
  status text not null default 'pending',
  note text,
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, type)
);
alter table profile_verifications enable row level security;
drop policy if exists "Users read own verification" on profile_verifications;
create policy "Users read own verification" on profile_verifications for select using (auth.uid() = user_id);
drop policy if exists "Admin can review verifications" on profile_verifications;
create policy "Admin can review verifications" on profile_verifications for select using (true);
drop policy if exists "Admin can update verifications" on profile_verifications;
create policy "Admin can update verifications" on profile_verifications for update using (true);
drop policy if exists "Users submit own verification" on profile_verifications;
create policy "Users submit own verification" on profile_verifications for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own verification" on profile_verifications;
create policy "Users update own verification" on profile_verifications for update using (auth.uid() = user_id);

create table if not exists privacy_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  show_photo boolean not null default true,
  show_phone boolean not null default false,
  show_address boolean not null default false,
  allow_messages boolean not null default true,
  show_last_active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table privacy_settings enable row level security;
drop policy if exists "Users manage own privacy settings" on privacy_settings;
create policy "Users manage own privacy settings" on privacy_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Useful indexes for a growing matrimony database.
create index if not exists idx_profiles_status_gender on profiles(status, gender);
create index if not exists idx_profiles_created_at on profiles(created_at desc);
create index if not exists idx_profiles_last_active on profiles(last_active_at desc);
create index if not exists idx_messages_pair on messages(sender_id, receiver_id, created_at desc);
create index if not exists idx_saved_searches_user on saved_searches(user_id, created_at desc);
