# V6 Final Member Read Privacy

This update removes the broad `profiles` SELECT policy and table-level SELECT access for member roles.

Members still retain INSERT/UPDATE on their own profile through RLS.

Member reads use:
- `member_fetch_profile(uuid)`
- `member_fetch_approved_profiles()`

Admin analytics now uses the existing `admin_fetch_all_profiles(p_pin)` RPC instead of direct `profiles` reads.

Run `V6_FINAL_MEMBER_READ_PRIVACY.sql` once in Supabase after deploying this version.
Do not re-run older address privacy migrations.
