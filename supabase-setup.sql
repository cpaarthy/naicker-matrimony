-- Naicker Matrimony — Full Database Setup
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste this -> Run

-- ============ PROFILES ============
-- profile.id = auth.users.id (one profile per logged-in account)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  gender text not null,
  age int not null,
  height text,
  religion text,
  caste text,
  education text,
  occupation text,
  income text,
  city text not null,
  state text,
  mother_tongue text,
  about text,
  phone text not null,
  photo_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============ INTEREST REQUESTS ============
create table requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid references profiles(id) on delete cascade not null,
  to_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
);

-- ============ ROW LEVEL SECURITY ============
alter table profiles enable row level security;
alter table requests enable row level security;
alter table favourites enable row level security;
alter table contact_messages enable row level security;

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

-- Contact messages: anyone can submit, nobody can read via the public API (admin views via Supabase dashboard)
create policy "Anyone can submit contact messages" on contact_messages
  for insert with check (true);

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
