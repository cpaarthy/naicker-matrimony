-- NAICKER MATRIMONY V4 — PRIVACY, ADMIN EDIT & APPROVAL GATE
-- Run this ONCE in Supabase SQL Editor on the existing live database.

-- 1) Admin dashboard edits use UPDATE. Ensure the existing PIN-gated
--    application can update any profile. (The current app authenticates
--    the admin with its existing admin PIN; a future version can move
--    this to a real Supabase admin role.)
alter table profiles enable row level security;
drop policy if exists "Anyone can update profile status (admin PIN gated in UI)" on profiles;
create policy "Anyone can update profiles (admin PIN gated in UI)"
  on profiles for update using (true) with check (true);

-- 2) Make sure the approval/status columns exist.
alter table profiles add column if not exists status text not null default 'pending';
alter table profiles add column if not exists admin_deactivated boolean not null default false;
alter table profiles add column if not exists last_active_at timestamptz;

-- 3) Phone privacy:
--    The member-facing application now explicitly excludes `phone` from
--    Browse/ProfileDetails queries. Admin fetches all fields for admin view.
--    Do NOT add a public UI component that renders profile.phone.

create index if not exists idx_profiles_status_created_at
  on profiles(status, created_at desc);
