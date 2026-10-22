-- Multiple promo codes (SPEC §9). Run after 0003_launch.sql in the Supabase SQL editor. Safe to re-run.

-- 1. promo_codes: the 0002 table plus the rules a code can have.
alter table public.promo_codes add column if not exists percent_off int check (percent_off between 0 and 100);
alter table public.promo_codes add column if not exists covers_delivery boolean not null default false;
alter table public.promo_codes add column if not exists max_per_phone int;
alter table public.promo_codes add column if not exists expires_at timestamptz;
alter table public.promo_codes add column if not exists created_at timestamptz not null default now();
update public.promo_codes set percent_off = coalesce(percent_off, percent, 0) where percent_off is null;

-- 2. One row per order that used a code (for "1 per phone number" and to give a use back on cancel).
create table if not exists public.promo_redemptions (
  id bigint generated always as identity primary key,
  code text not null references public.promo_codes(code) on update cascade,
  phone text not null,             -- normalised WhatsApp number, e.g. 201001234567
  order_id text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists promo_redemptions_code_phone_idx on public.promo_redemptions (code, phone);
alter table public.promo_redemptions enable row level security;

-- 3. Claim a use atomically (row lock), so two orders at the same moment can't pass max_uses.
create or replace function public.redeem_promo(p_code text, p_phone text, p_order_id text)
returns table (ok boolean, reason text, code text, percent_off int, covers_delivery boolean)
language plpgsql as $$
declare
  r public.promo_codes%rowtype;
  used int;
begin
  select * into r from public.promo_codes pc where upper(pc.code) = upper(trim(p_code)) for update;
  if not found or not r.active then return query select false, 'invalid', null::text, 0, false; return; end if;
  if r.starts_at is not null and r.starts_at > now() then return query select false, 'not_started', r.code, 0, false; return; end if;
  if r.expires_at is not null and r.expires_at <= now() then return query select false, 'expired', r.code, 0, false; return; end if;
  if r.max_uses is not null and r.uses >= r.max_uses then return query select false, 'used_up', r.code, 0, false; return; end if;
  if r.max_per_phone is not null then
    select count(*) into used from public.promo_redemptions pr where pr.code = r.code and pr.phone = p_phone;
    if used >= r.max_per_phone then return query select false, 'phone_limit', r.code, 0, false; return; end if;
  end if;
  insert into public.promo_redemptions (code, phone, order_id) values (r.code, p_phone, p_order_id);
  update public.promo_codes pc set uses = pc.uses + 1 where pc.code = r.code;
  return query select true, null::text, r.code, coalesce(r.percent_off, r.percent, 0), r.covers_delivery;
end $$;

-- 4. A cancelled order (or a failed save) gives its use back.
create or replace function public.release_promo(p_order_id text)
returns void
language plpgsql as $$
declare c text;
begin
  delete from public.promo_redemptions where order_id = p_order_id returning code into c;
  if c is not null then update public.promo_codes set uses = greatest(uses - 1, 0) where code = c; end if;
end $$;

-- Only the server (service role) may call these.
revoke execute on function public.redeem_promo(text, text, text) from public, anon, authenticated;
revoke execute on function public.release_promo(text) from public, anon, authenticated;
grant execute on function public.redeem_promo(text, text, text) to service_role;
grant execute on function public.release_promo(text) to service_role;

-- 5. The codes. Re-running updates the rules but never resets `uses`.
insert into public.promo_codes (code, percent, percent_off, covers_delivery, max_uses, max_per_phone, expires_at, active)
values ('LAUNCH40', 40, 40, false, null, null, null, true)
on conflict (code) do update set percent_off = coalesce(public.promo_codes.percent_off, excluded.percent_off);

-- GTALESFAMILY: the three books free, delivery still paid (89 EGP), 30 uses, 1 per phone,
-- valid 14 days from 22 Oct 2026 (until 5 Nov 2026, end of day Cairo).
insert into public.promo_codes (code, percent, percent_off, covers_delivery, max_uses, max_per_phone, expires_at, active)
values ('GTALESFAMILY', 100, 100, false, 30, 1, '2026-11-05 23:59:59+02', true)
on conflict (code) do update set percent = excluded.percent, percent_off = excluded.percent_off, covers_delivery = excluded.covers_delivery,
  max_uses = excluded.max_uses, max_per_phone = excluded.max_per_phone, expires_at = excluded.expires_at, active = excluded.active;
