-- GTales tables (docs/SPEC.md §12–13). Run after 0001_init.sql in the Supabase SQL editor.
-- All access goes through server routes with the service-role key; RLS blocks anon.

-- Free stories made by the personalization engine
create table if not exists public.books (
  id text primary key,
  slug text not null,
  title text not null,
  gender text not null check (gender in ('boy','girl')),
  child_name text not null,
  form jsonb not null,
  story jsonb not null,
  polished boolean not null default false,
  parent_name text not null,
  contact text not null,
  dedication text,
  ref text,
  ip text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists books_created_at_idx on public.books (created_at desc);
create index if not exists books_contact_idx on public.books (contact);
create index if not exists books_ip_idx on public.books (ip);

-- Events: every meaningful action, server-timestamped. Never child names, photos or phone numbers.
create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null,
  visitor_id text,
  session_id text,
  story_id text,
  order_id text,
  tale text,
  step int,
  ref text,
  page text,
  device text,
  meta jsonb
);
create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_event_idx on public.events (event, created_at desc);

-- Series orders (15-step form), statuses per SPEC §10
create table if not exists public.orders (
  id text primary key,
  status text not null default 'ordered' check (status in ('ordered','being_made','awaiting_approval','approved','printing','shipped','delivered_paid','cancelled')),
  edit_requested boolean not null default false,
  child jsonb not null,          -- name, nickname, age, gender, three words
  tales text[] not null,         -- three tale keys
  answers jsonb not null,        -- struggles, strengths, world, adventure, home words, memory, reading, dedication
  people jsonb not null default '[]',  -- loved ones: name, relation, detail, photo_key
  photos jsonb not null default '{}',  -- hero photo keys (private bucket)
  parent jsonb not null,         -- name, whatsapp, address, best time
  promo_code text,
  list_price int not null,
  discount int not null default 0,
  delivery int not null default 0,
  total int not null,
  ref text,
  notes text,
  courier_confirmation text,
  photos_deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

-- Parents and saved heroes (passwordless sign-in by WhatsApp code / email link)
create table if not exists public.profiles (
  id text primary key,
  phone text unique,
  email text unique,
  name text,
  created_at timestamptz not null default now()
);
create table if not exists public.heroes (
  id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.signin_codes (
  id bigint generated always as identity primary key,
  target text not null,     -- phone or email
  code text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id text primary key,
  book_id text,
  order_id text,
  tale text,
  child_emoji text,
  answers jsonb,
  followup jsonb,
  quote_permission boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  code text primary key,
  percent int,
  fixed int,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int,
  uses int not null default 0,
  active boolean not null default true
);
insert into public.promo_codes (code, percent) values ('LAUNCH40', 40) on conflict (code) do nothing;

-- Admin → Settings (configurable values, SPEC §11)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.settings (key, value) values
  ('list_price_egp', '749'), ('delivery_egp', '89'), ('default_promo', '"LAUNCH40"'), ('rate_limit_per_hour', '10'),
  ('promo_bar', '"Launch offer: 40% off the printed Series with LAUNCH40 · Pay on delivery"'), ('reviews_visible', 'false'),
  ('production_days', '5'), ('delivery_days', '5'), ('whatsapp_number', '""')
on conflict (key) do nothing;

alter table public.books enable row level security;
alter table public.events enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;
alter table public.heroes enable row level security;
alter table public.signin_codes enable row level security;
alter table public.feedback enable row level security;
alter table public.promo_codes enable row level security;
alter table public.settings enable row level security;

-- Private bucket for hero and loved-ones photos (signed URLs only, deleted on delivered/cancelled)
insert into storage.buckets (id, name, public) values ('photos', 'photos', false) on conflict (id) do nothing;
