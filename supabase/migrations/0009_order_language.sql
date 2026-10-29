-- Book language per Series order (urgent U6): en = English, eg = Egyptian Arabic (عامية), ar = Literary Arabic (فصحى).
-- Run in the Supabase SQL editor after 0007. Safe to re-run. Existing orders were all English.
alter table public.orders add column if not exists language text not null default 'en';
alter table public.orders drop constraint if exists orders_language_check;
alter table public.orders add constraint orders_language_check check (language in ('en', 'ar', 'eg'));
-- orders saved before this migration kept the choice inside parent (jsonb): move it
update public.orders
   set language = parent->>'language', parent = parent - 'language'
 where parent ? 'language' and parent->>'language' in ('en', 'ar', 'eg');
