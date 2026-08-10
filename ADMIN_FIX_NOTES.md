# Admin All Profiles Fix

Fixed the admin dashboard issues in the homepage build:

- Restored the missing `Section` component closing/children block that caused the AdminDashboard JSX to break and could blank the page.
- Fixed `loadAll()` so the admin PIN is included in its dependency list. The All Profiles tab now fetches the full admin dataset using `admin_fetch_all_profiles` instead of the approved-only public query.
- Added defensive error handling so a Supabase/RPC error shows a visible Retry screen instead of a blank page.
- Admin edit continues to use `admin_update_profile` and includes public fields plus private phone/security fields.

Supabase V5 migration must already be applied for the admin RPCs to exist.
