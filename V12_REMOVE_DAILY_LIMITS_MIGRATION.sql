-- NAICKER MATRIMONY — V12 REMOVE DAILY VIEW / INTEREST LIMITS
-- Run once in Supabase SQL Editor AFTER V10 and V11.
--
-- Change: Free plan no longer has a daily profile-view or interest-request
-- cap. All plans (Free/Silver/Gold) now have unlimited profile views and
-- unlimited interest requests. Silver/Gold still keep their other perks:
-- priority listing in Browse and "who viewed my profile".
--
-- This migration keeps the RPC signatures the same (so the frontend doesn't
-- need to change how it calls them) but makes both always report "allowed".

begin;

-- 1) Profile views: always allowed, no counting needed anymore.
drop function if exists public.member_register_profile_view(uuid);
create or replace function public.member_register_profile_view(p_viewer_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or auth.uid() <> p_viewer_id then
    raise exception 'Not authorized';
  end if;
  return jsonb_build_object('allowed', true, 'remaining', null, 'limit', null, 'plan', null);
end;
$$;
revoke all on function public.member_register_profile_view(uuid) from public;
grant execute on function public.member_register_profile_view(uuid) to authenticated;

-- 2) Interest requests: always allowed (still blocks duplicate/accepted
--    requests, which isn't a "limit" — that's just not sending the same
--    interest twice).
drop function if exists public.member_send_interest_request(uuid, uuid);
create or replace function public.member_send_interest_request(p_from_id uuid, p_to_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_existing_status text;
begin
  if auth.uid() is null or auth.uid() <> p_from_id then
    raise exception 'Not authorized';
  end if;
  if p_from_id = p_to_id then
    raise exception 'Invalid interest request';
  end if;

  select status into v_existing_status
    from public.requests
    where (from_id = p_from_id and to_id = p_to_id)
       or (from_id = p_to_id and to_id = p_from_id)
    order by created_at desc
    limit 1;

  if v_existing_status in ('pending', 'accepted') then
    return jsonb_build_object(
      'success', false,
      'reason', case when v_existing_status = 'accepted' then 'already_accepted' else 'already_sent' end
    );
  end if;

  insert into public.requests (from_id, to_id, status) values (p_from_id, p_to_id, 'pending');

  return jsonb_build_object('success', true, 'remaining', null, 'limit', null, 'plan', null);
end;
$$;
revoke all on function public.member_send_interest_request(uuid, uuid) from public;
grant execute on function public.member_send_interest_request(uuid, uuid) to authenticated;

commit;

-- Note: the daily_view_count / daily_view_date / daily_interest_count /
-- daily_interest_date columns added in V10/V11 are left in place (harmless,
-- just unused) in case limits are reintroduced later. They can be dropped
-- with:
--   alter table public.profiles drop column if exists daily_view_count;
--   alter table public.profiles drop column if exists daily_view_date;
--   alter table public.profiles drop column if exists daily_interest_count;
--   alter table public.profiles drop column if exists daily_interest_date;
