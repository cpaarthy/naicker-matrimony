# Address privacy fix

The previous V6 build could still expose location fields through member-facing profile paths.
This update:
- removes address/location fields from the member browse payload;
- masks address, village, district, city and state for locked profiles;
- keeps address visible only for the profile owner or after an accepted request;
- removes the unsafe non-admin fallback in `fetchAllProfiles`;
- keeps phone private.

Run `V6_ADDRESS_PRIVACY_MIGRATION.sql` in Supabase once, then deploy this source.
