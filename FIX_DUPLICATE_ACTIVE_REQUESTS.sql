-- FIX: Duplicate active interest requests blocking the V7 unique index
-- Run this BEFORE (re-)running V7_PROFESSIONAL_FEATURES_MIGRATION.sql.
--
-- What happened: before V7 added the "one active request per pair" rule,
-- it was possible for two requests between the same pair of members to
-- both be pending/accepted at once (e.g. both sent an interest to each
-- other). This cleans that up by keeping only the most recent active
-- request per pair and marking the older duplicate(s) as 'declined'.

begin;

-- 1) See which pairs are duplicated (safe to run on its own to inspect first).
--    Uncomment to just look, without changing anything:
-- select least(from_id, to_id) as a, greatest(from_id, to_id) as b, count(*)
-- from public.requests
-- where status in ('pending', 'accepted')
-- group by 1, 2
-- having count(*) > 1;

-- 2) Keep the newest active request per pair; demote older duplicates to
--    'declined' so they no longer count as "active" and won't violate the
--    unique index.
with ranked as (
  select
    id,
    row_number() over (
      partition by least(from_id, to_id), greatest(from_id, to_id)
      order by
        case status when 'accepted' then 0 else 1 end,  -- prefer keeping an accepted request
        created_at desc
    ) as rn
  from public.requests
  where status in ('pending', 'accepted')
)
update public.requests r
set status = 'declined', responded_at = coalesce(r.responded_at, now())
from ranked
where r.id = ranked.id
  and ranked.rn > 1;

commit;

-- Now re-run V7_PROFESSIONAL_FEATURES_MIGRATION.sql (or just the
-- "create unique index ... idx_requests_one_active_pair" statement from it)
-- and it will succeed.
