-- NAICKER MATRIMONY — PROFESSIONAL FEATURE MIGRATION
-- Run this ONCE in Supabase SQL Editor after your existing schema is already working.
-- It adds messaging, saved searches, verification, privacy settings and indexes.

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
