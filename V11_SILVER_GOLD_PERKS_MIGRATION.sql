-- NAICKER MATRIMONY — V11 SILVER/GOLD PLAN PERKS
-- Run once in Supabase SQL Editor AFTER V10_MEMBERSHIP_PLANS_MIGRATION.sql.
--
-- Adds three perks for paid plans:
--   1) Unlimited interest requests for Silver/Gold (Free members get a daily cap).
--   2) Priority listing — Browse ordering can put Gold first, then Silver, then Free
--      (handled by member_fetch_approved_profiles ordering by plan rank).
--   3) "Who viewed my profile" — Silver/Gold only. Uses the existing
--      recently_viewed table (viewed-by-me rows are already readable by the
--      profile owner); this migration adds a convenience RPC that also
--      enforces the plan gate server-side.

begin;

-- 1) Daily interest-request tracking, mirroring the profile-view counters
--    added in V10. Free = 5 interests/day, Silver/Gold = unlimited.
alter table public.profiles
  add column if not exists daily_interest_count int not null default 0;

alter table public.profiles
  add column if not exists daily_interest_date date;

drop function if exists public.member_send_interest_request(uuid, uuid);
create or replace function public.member_send_interest_request(p_from_id uuid, p_to_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_plan text;
  v_count int;
  v_date date;
  v_limit int;
  v_today date := current_date;
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

  select plan, daily_interest_count, daily_interest_date
    into v_plan, v_count, v_date
    from public.profiles
    where id = p_from_id
    for update;

  v_limit := case v_plan
    when 'gold' then -1
    when 'silver' then -1
    else 5
  end;

  if v_date is distinct from v_today then
    v_count := 0;
  end if;

  if v_limit >= 0 and v_count >= v_limit then
    update public.profiles set daily_interest_count = v_count, daily_interest_date = v_today where id = p_from_id;
    return jsonb_build_object('success', false, 'reason', 'daily_limit_reached', 'limit', v_limit, 'plan', v_plan);
  end if;

  insert into public.requests (from_id, to_id, status) values (p_from_id, p_to_id, 'pending');

  v_count := v_count + 1;
  update public.profiles set daily_interest_count = v_count, daily_interest_date = v_today where id = p_from_id;

  return jsonb_build_object(
    'success', true,
    'remaining', case when v_limit < 0 then null else greatest(v_limit - v_count, 0) end,
    'limit', v_limit,
    'plan', v_plan
  );
end;
$$;
revoke all on function public.member_send_interest_request(uuid, uuid) from public;
grant execute on function public.member_send_interest_request(uuid, uuid) to authenticated;

-- 2) Priority listing in Browse: Gold first, Silver next, Free last, then
--    newest-first within each plan tier.
create or replace function public.member_fetch_approved_profiles()
returns setof jsonb
language sql
security definer
set search_path = public
as $function$
  select
    (to_jsonb(p)
      - 'phone'
      - 'security_answer'
      - 'address'
      - 'village'
      - 'district'
      - 'city'
      - 'state'
    )
    || jsonb_build_object(
      'address', null,
      'village', null,
      'district', null,
      'city', null,
      'state', null
    )
  from public.profiles p
  where p.status = 'approved'
    and coalesce(p.admin_deactivated, false) = false
    and p.id <> auth.uid()
  order by
    case p.plan when 'gold' then 0 when 'silver' then 1 else 2 end,
    p.created_at desc;
$function$;

grant execute on function public.member_fetch_approved_profiles()
to authenticated;

-- 3) "Who viewed my profile" — Silver/Gold only. Enforces the plan gate
--    server-side (not just hidden in the UI) so a free member can't call the
--    underlying table directly and see the same data.
drop function if exists public.member_fetch_profile_viewers(uuid);
create or replace function public.member_fetch_profile_viewers(p_profile_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_plan text;
  v_result jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_profile_id then
    raise exception 'Not authorized';
  end if;

  select plan into v_plan from public.profiles where id = p_profile_id;

  if coalesce(v_plan, 'free') = 'free' then
    return jsonb_build_object('allowed', false, 'plan', coalesce(v_plan, 'free'), 'viewers', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'photo_url', p.photo_url,
    'gender', p.gender,
    'plan', p.plan,
    'viewed_at', rv.viewed_at
  ) order by rv.viewed_at desc), '[]'::jsonb)
  into v_result
  from public.recently_viewed rv
  join public.profiles p on p.id = rv.viewer_id
  where rv.viewed_id = p_profile_id;

  return jsonb_build_object('allowed', true, 'plan', v_plan, 'viewers', v_result);
end;
$$;
revoke all on function public.member_fetch_profile_viewers(uuid) from public;
grant execute on function public.member_fetch_profile_viewers(uuid) to authenticated;

commit;
