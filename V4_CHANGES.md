# Naicker Matrimony V4 Changes

1. Member-facing profile queries no longer request `phone`.
2. Admin profile editing uses a direct UPDATE instead of upsert, so all existing profiles can be edited.
3. Admin edit screen now supports the full profile and uses dropdowns for master-list fields.
4. Browse is locked until the logged-in member's own profile has `status = approved`.
5. Age and partner preferred min/max age use 18–70 dropdowns.
6. Education and occupation use admin-managed master-list dropdowns for registration/editing and partner preference.
7. Member ProfileDetails shows address but never renders the phone number.
8. Run `V4_PRIVACY_ADMIN_APPROVAL_MIGRATION.sql` once in Supabase SQL Editor.
