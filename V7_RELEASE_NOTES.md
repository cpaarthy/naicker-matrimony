# Naicker Matrimony V7

## Included
- Interest lifecycle: send, pending, accept, decline, withdraw.
- Recipient-only acceptance RPC prevents users from accepting their own outgoing request.
- Duplicate active interest requests prevented at database level.
- Shortlist/Favourites improved with remove action and member-safe profile reads.
- Notifications retained for interest/admin events with unread handling.
- Advanced search expanded with mother tongue, family type, height range and complexion, in addition to existing age/education/occupation/horoscope/lifestyle/verification filters.
- Block/unblock and report profile safety workflow retained and indexed.
- Admin request analytics now use a PIN-validated database RPC after member request RLS was tightened.
- Existing address/phone privacy, approval gate, registration, age save, auto-fill, admin login/edit and 4K homepage are preserved.

## Explicitly NOT included
- Private messaging/chat.
- Multiple-photo/profile gallery.

## Supabase
Run once:
`V7_PROFESSIONAL_FEATURES_MIGRATION.sql`

Do not rerun older V4/V5/V6 migrations unless specifically instructed.
