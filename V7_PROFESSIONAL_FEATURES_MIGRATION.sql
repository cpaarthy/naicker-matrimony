-- NAICKER MATRIMONY V7 — PROFESSIONAL MEMBER FEATURES
-- Run ONCE after the current V6 FINAL MEMBER READ PRIVACY migration.
-- Adds/strengthens: interests, shortlist, notifications, safety and analytics support.
-- Does NOT add messaging or photo gallery.

begin;

-- ==================== INTEREST REQUESTS ====================
alter table public.requests add column if not exists responded_at timestamptz;

-- Prevent duplicate active requests between the same two members.
create unique index if not exists idx_requests_one_active_pair
on public.requests (least(from_id, to_id), greatest(from_id, to_id))
where status in ('pending', 'accepted');

alter table public.requests enable row level security;

drop policy if exists "Public can read requests" on public.requests;
drop policy if exists "Users can read own requests" on public.requests;
create policy "Users can read own requests"
on public.requests for select to authenticated
using (auth.uid() = from_id or auth.uid() = to_id);

drop policy if exists "Authenticated users can insert requests" on public.requests;
create policy "Authenticated users can insert requests"
on public.requests for insert to authenticated
with check (auth.uid() = from_id and from_id <> to_id);

drop policy if exists "Involved users can update requests" on public.requests;
create policy "Involved users can update requests"
on public.requests for update to authenticated
using (auth.uid() = from_id or auth.uid() = to_id)
with check (auth.uid() = from_id or auth.uid() = to_id);

grant select, insert, update on public.requests to authenticated;
create index if not exists idx_requests_from_status on public.requests(from_id, status, created_at desc);
create index if not exists idx_requests_to_status on public.requests(to_id, status, created_at desc);

-- Recipient-only response RPC prevents the sender from accepting their own request.
create or replace function public.respond_to_interest_request(p_request_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_request public.requests%rowtype;
  v_status text;
begin
  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then return jsonb_build_object('success', false, 'error', 'Request not found'); end if;
  if auth.uid() <> v_request.to_id then return jsonb_build_object('success', false, 'error', 'Only the recipient can respond'); end if;
  if v_request.status <> 'pending' then return jsonb_build_object('success', false, 'error', 'Request is no longer pending'); end if;
  v_status := case when p_accept then 'accepted' else 'declined' end;
  update public.requests set status = v_status, responded_at = now() where id = p_request_id;
  return jsonb_build_object('success', true, 'status', v_status);
end;
$function$;
revoke all on function public.respond_to_interest_request(uuid, boolean) from public;
grant execute on function public.respond_to_interest_request(uuid, boolean) to authenticated;

-- ==================== SHORTLIST / FAVOURITES ====================
alter table public.favourites enable row level security;
drop policy if exists "Users can read own favourites" on public.favourites;
create policy "Users can read own favourites"
on public.favourites for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert own favourites" on public.favourites;
create policy "Users can insert own favourites"
on public.favourites for insert to authenticated with check (auth.uid() = user_id and user_id <> profile_id);
drop policy if exists "Users can delete own favourites" on public.favourites;
create policy "Users can delete own favourites"
on public.favourites for delete to authenticated using (auth.uid() = user_id);
grant select, insert, delete on public.favourites to authenticated;
create index if not exists idx_favourites_user_created on public.favourites(user_id, created_at desc);

-- ==================== NOTIFICATIONS ====================
alter table public.notifications enable row level security;
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Keep insert available for the existing request/admin notification workflow.
drop policy if exists "Authenticated users can insert notifications" on public.notifications;
create policy "Authenticated users can insert notifications"
on public.notifications for insert to authenticated with check (true);
grant select, insert, update on public.notifications to authenticated;
create index if not exists idx_notifications_user_read_created on public.notifications(user_id, read, created_at desc);

-- ==================== BLOCK / REPORT SAFETY ====================
alter table public.blocked_profiles enable row level security;
drop policy if exists "Users can read own blocks" on public.blocked_profiles;
create policy "Users can read own blocks"
on public.blocked_profiles for select to authenticated using (auth.uid() = blocker_id);
drop policy if exists "Users can insert own blocks" on public.blocked_profiles;
create policy "Users can insert own blocks"
on public.blocked_profiles for insert to authenticated with check (auth.uid() = blocker_id and blocker_id <> blocked_id);
drop policy if exists "Users can delete own blocks" on public.blocked_profiles;
create policy "Users can delete own blocks"
on public.blocked_profiles for delete to authenticated using (auth.uid() = blocker_id);
grant select, insert, delete on public.blocked_profiles to authenticated;
create index if not exists idx_blocked_profiles_blocker on public.blocked_profiles(blocker_id, created_at desc);

alter table public.profile_reports enable row level security;
drop policy if exists "Users can insert own reports" on public.profile_reports;
create policy "Users can insert own reports"
on public.profile_reports for insert to authenticated
with check (auth.uid() = reporter_id and reporter_id <> reported_id);
-- Admin dashboard currently uses its validated admin session/PIN for report review.
-- Keep existing read/update behavior for compatibility.

grant insert on public.profile_reports to authenticated;
create index if not exists idx_profile_reports_status_created on public.profile_reports(status, created_at desc);

-- ==================== ANALYTICS INDEXES ====================
create index if not exists idx_requests_status_created on public.requests(status, created_at desc);
create index if not exists idx_profiles_gender_status on public.profiles(gender, status);
create index if not exists idx_profiles_education on public.profiles(education);
create index if not exists idx_profiles_occupation on public.profiles(occupation);

-- Admin-only request analytics after member request RLS is tightened.
create or replace function public.admin_fetch_all_requests(p_pin text)
returns setof jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
begin
  if not public.is_valid_admin_pin(p_pin) then
    return;
  end if;
  return query
    select to_jsonb(r)
    from public.requests r
    order by r.created_at desc;
end;
$function$;
revoke all on function public.admin_fetch_all_requests(text) from public;
grant execute on function public.admin_fetch_all_requests(text) to authenticated;

commit;
