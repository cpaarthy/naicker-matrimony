# V6 Address Privacy

- Member-facing approved-profile lists now use `member_fetch_approved_profiles()`.
- Member profile details use `member_fetch_profile(uuid)`.
- A member's full address/village is returned only to the owner or after an interest request between the two members has status `accepted`.
- Phone/security fields remain excluded from member-facing responses.
- Admin profile access is unchanged.
- Run `V6_ADDRESS_PRIVACY_MIGRATION.sql` once in Supabase before deploying this version.
