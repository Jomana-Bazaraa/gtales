-- Estoria schema. Run in Supabase SQL editor (or `supabase db push`).
-- All access goes through server API routes with the service-role key; RLS blocks anon.

create table if not exists public.stories (
  id text primary key,
  status text not null default 'pending' check (status in ('pending','generating','ready','failed')),
  progress text not null default 'template',
  input jsonb not null,
  keeper_id text,
  generated jsonb,
  assembled jsonb,
  cover_url text,
  lineart_url text,
  pdf_color_url text,
  pdf_lineart_url text,
  error text,
  email_sent_at timestamptz,
  ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stories_created_at_idx on public.stories (created_at desc);
create index if not exists stories_parent_email_idx on public.stories ((input->>'parentEmail'));
create index if not exists stories_ip_idx on public.stories (ip);

create table if not exists public.physical_orders (
  id text primary key,
  story_id text not null references public.stories(id) on delete cascade,
  recipient_name text not null,
  address text not null,
  city text not null,
  governorate text not null,
  phone text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending','shipped','cancelled')),
  shipped_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists physical_orders_status_idx on public.physical_orders (status, created_at desc);

create table if not exists public.magic_tokens (
  token text primary key,
  email text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.stories enable row level security;
alter table public.physical_orders enable row level security;
alter table public.magic_tokens enable row level security;
-- no policies = no anon/authenticated access; service role bypasses RLS.

-- Storage buckets (public read, server-only write)
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', true) on conflict (id) do nothing;
