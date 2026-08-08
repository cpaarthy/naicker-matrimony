-- Run once in the Supabase SQL Editor.
-- Needed for the new "Monthly Profile Views" chart on the user Dashboard.
--
-- Today, recently_viewed only lets a user read rows where THEY are the
-- viewer (their own browsing history). There is no policy letting a user
-- see who viewed THEIR profile, which is what "Monthly Profile Views" needs.
-- This adds that read permission, without changing anything else.

create policy "Users can read views of their own profile" on recently_viewed
  for select using (auth.uid() = viewed_id);
