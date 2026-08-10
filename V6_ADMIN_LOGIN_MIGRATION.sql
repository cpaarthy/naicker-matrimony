-- Naicker Matrimony V6: separate admin login
-- Run this ONCE in Supabase SQL Editor after V5 migration.

alter table public.admin_config
  add column if not exists admin_email text;

update public.admin_config
set admin_email = coalesce(nullif(admin_email, ''), 'admin@naickermatrimony.com')
where id = true;

alter table public.admin_config
  alter column admin_email set not null;

-- Separate credential check for the Admin Portal.
-- Password is compared against the existing bcrypt pin_hash; it is never returned.
drop function if exists public.is_valid_admin_credentials(text, text);
create or replace function public.is_valid_admin_credentials(p_email text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_email text;
begin
  select admin_email, pin_hash into v_email, v_hash
  from public.admin_config
  where id = true;

  return lower(coalesce(p_email, '')) = lower(coalesce(v_email, ''))
    and v_hash is not null
    and crypt(coalesce(p_password, ''), v_hash) = v_hash;
end;
$$;

revoke all on function public.is_valid_admin_credentials(text, text) from public;
grant execute on function public.is_valid_admin_credentials(text, text) to anon, authenticated;

comment on column public.admin_config.admin_email is 'Email identifier for the separate Admin Portal login.';
