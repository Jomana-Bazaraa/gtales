-- Reviews wall: everything the code needs, in one file (urgent U8). Safe to run whether or not 0005 was run,
-- and safe to re-run. Needs nothing else. What the app uses: table public.reviews + PRIVATE storage bucket "reviews".

-- 1. The table (same as 0005)
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
  media jsonb not null default '[]',          -- [{ "type": "image" | "video", "path": "pending/…" }] in the private bucket
  consent_at timestamptz not null,           -- both consent boxes ticked
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  featured boolean not null default false,
  source text not null default 'form' check (source in ('form', 'admin')),
  approved_at timestamptz,
  device_id text,                            -- random browser id (10-per-day limit), no personal data
  ip_hash text                               -- sha256 of the IP, same purpose
);
create index if not exists reviews_status_idx on public.reviews (status, featured desc, created_at desc);
create index if not exists reviews_device_idx on public.reviews (device_id, created_at desc);
create index if not exists reviews_ip_idx on public.reviews (ip_hash, created_at desc);

-- 2. Row level security: the public may only ADD a pending review; reading, approving, hiding and deleting
--    is for the service role (the website's server and Admin → Reviews). The site itself submits through its
--    server (bot check + 10/day limit), so the public insert is only a safe, moderated door.
alter table public.reviews enable row level security;
revoke all on table public.reviews from anon, authenticated;
grant insert on table public.reviews to anon, authenticated;
grant all on table public.reviews to service_role;

drop policy if exists "reviews: public can submit pending" on public.reviews;
create policy "reviews: public can submit pending" on public.reviews
  for insert to anon, authenticated
  with check (status = 'pending' and featured = false and source = 'form' and approved_at is null
              and jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 4);

drop policy if exists "reviews: service role does everything" on public.reviews;
create policy "reviews: service role does everything" on public.reviews
  for all to service_role using (true) with check (true);

-- 3. PRIVATE bucket for photos/videos: nothing public; pages use short-lived signed URLs for approved reviews.
--    Max 50 MB, photos (jpg/png/webp) and mp4/mov only. No storage policies on purpose: only the server (service
--    role) can sign upload and view links, so nobody can list or read the files directly.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reviews', 'reviews', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
