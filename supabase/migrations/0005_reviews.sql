-- Reviews wall "Families love GTales" (SPEC §5.6, §11, §12). Run after 0004 in the Supabase SQL editor. Safe to re-run.

create table if not exists public.reviews (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 1 and 5000),
  first_name text not null,
  city text,
  child_age int check (child_age between 1 and 17),
  story_slug text,
  media jsonb not null default '[]',          -- [{ "type": "image" | "video", "path": "pending/…" }] in the private `reviews` bucket
  consent_at timestamptz not null,           -- both consent boxes ticked (by the parent, or by admin confirming the parent agreed)
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  featured boolean not null default false,
  source text not null default 'form' check (source in ('form', 'admin')),
  approved_at timestamptz,
  device_id text,                            -- random browser id, for the 10-per-day limit (no personal data)
  ip_hash text                               -- sha256 of the IP, same purpose
);
create index if not exists reviews_status_idx on public.reviews (status, featured desc, created_at desc);
create index if not exists reviews_device_idx on public.reviews (device_id, created_at desc);
create index if not exists reviews_ip_idx on public.reviews (ip_hash, created_at desc);
alter table public.reviews enable row level security;

-- PRIVATE bucket: nothing is public; pages use short-lived signed URLs for approved reviews only.
-- The bucket itself refuses files over 50 MB and anything that isn't a photo or an mp4/mov video.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reviews', 'reviews', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
