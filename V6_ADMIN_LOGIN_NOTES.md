# V6 Separate Admin Login

## What changed
- Member login remains at the normal Login page.
- Admin now has a separate Admin Portal login screen.
- Admin Portal accepts an admin email + admin password and calls `is_valid_admin_credentials` in Supabase.
- Admin dashboard no longer renders its own login form.
- Admin logout returns to the Admin Portal login screen.
- Existing admin profile edit/approve/delete features continue to use the validated admin password as the protected RPC credential.

## Supabase
Run `V6_ADMIN_LOGIN_MIGRATION.sql` once after the V5 migration.

Default admin email:
`admin@naickermatrimony.com`

The default password remains the existing V5 admin password unless you change `admin_config.pin_hash` through a secure admin-management workflow.
