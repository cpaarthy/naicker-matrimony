# Naicker Matrimony V5 — Security / Privacy Audit

## Fixed in V5

- Member-facing `profiles` data no longer contains `phone` or `security_answer`.
- Existing phone/security-answer values are copied into `profile_private` before the public columns are removed.
- `profile_private` is protected by RLS: members can read/write only their own private row.
- Admin reads private phone/security data only through a SECURITY DEFINER RPC protected by the admin PIN.
- Admin profile edit/status/delete/bulk actions use protected RPCs rather than direct public-table mutations.
- The admin PIN is no longer hard-coded in the React bundle; the login checks it through Supabase.
- Password-recovery functions were updated to read private phone/security data.
- The old UI-only public profile update/delete policies are removed.
- `netlify.toml` was removed because the project is deployed through Vercel.
- Existing approval gate, analytics filters, age/partner-age dropdowns, education/occupation dropdowns, and member-facing phone hiding are retained.

## Important deployment step

Run `V4_PRIVACY_ADMIN_APPROVAL_MIGRATION.sql` first if it has not already been run, then run:

`V5_SECURITY_PRIVACY_MIGRATION.sql`

Run V5 only once. It migrates the existing private values and then removes the public `phone` and `security_answer` columns from `profiles`.

## Build verification

A full `npm ci` / `npm run build` could not be executed in this environment because the configured package registry returned a 404 for `yallist@3.1.1`. Source-level dependency/import checks were performed instead.
