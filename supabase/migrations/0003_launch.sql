-- Launch (docs/LAUNCH-PLAN.md §1, §1b). Run after 0002_gtales.sql in the Supabase SQL editor. Safe to re-run.

-- 1. Orders: the 0002 table did not match what the order form sends (SPEC §9), so every insert failed.
alter table public.orders alter column tales drop not null;
alter table public.orders alter column answers drop not null;
alter table public.orders add column if not exists strengths jsonb not null default '[]';
alter table public.orders add column if not exists books jsonb not null default '[]';
alter table public.orders add column if not exists world jsonb not null default '{}';
alter table public.orders add column if not exists words jsonb not null default '{}';
alter table public.orders add column if not exists dedication text;
alter table public.orders add column if not exists activities jsonb not null default '[]';
alter table public.orders add column if not exists free_story_id text;
alter table public.orders add column if not exists parent_id text;

-- 2. Events: who/what columns for the Admin Dashboard. `event` is the type (story_started, story_created,
--    story_finished, story_shared, order_started, order_placed, order_delivered, plus the SPEC §13 extras).
--    `tale` is the story slug. Never the child's name.
alter table public.events add column if not exists gender text;
alter table public.events add column if not exists child_age int;
alter table public.events add column if not exists parent_id text;
alter table public.events add column if not exists source text;
create index if not exists events_session_idx on public.events (session_id);

-- 3. Parents = users. id is a hash of the normalised email / WhatsApp number, so events can carry it without personal data.
create table if not exists public.parents (
  id text primary key,
  email text,
  whatsapp text,
  name text,
  source text,
  first_book_id text,
  first_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.books add column if not exists parent_id text;
alter table public.books add column if not exists session_id text;

-- 4. PDF jobs: the web app (Cloudflare Worker) queues, the GitHub Action renders and uploads to the `pdfs` bucket.
create table if not exists public.pdf_jobs (
  id text primary key,
  book_id text not null,
  status text not null default 'queued' check (status in ('queued','running','done','failed')),
  requested_by text not null default 'parent' check (requested_by in ('parent','admin')),
  pdf_url text,
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pdf_jobs_status_idx on public.pdf_jobs (status, created_at);
create index if not exists pdf_jobs_book_idx on public.pdf_jobs (book_id, created_at desc);

alter table public.parents enable row level security;
alter table public.pdf_jobs enable row level security;

-- The PDF bucket from 0001 (public read, server-only write); repeated here in case only 0002 was run.
insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', true) on conflict (id) do nothing;
