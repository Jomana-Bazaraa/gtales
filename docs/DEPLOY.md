# GTales deployment (Vercel + Supabase)

Do once. After this, every `git push` to `main` deploys.

## 1. Supabase (database + file storage)
1. supabase.com → New project → name `gtales`, region Frankfurt (closest to Egypt), strong DB password.
2. Project → SQL Editor → paste and run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_gtales.sql`.
3. Project settings → API: copy **Project URL** and **service_role** key (never the anon key, never in client code).

## 2. Vercel (hosting)
1. Push this repo to GitHub (private).
2. vercel.com → Add New Project → import the repo. Framework: Next.js. Root: `/`.
3. Environment variables (Production + Preview), from `.env.example`:
   - `NEXT_PUBLIC_SITE_URL` = `https://gtales.app` (or the vercel.app URL until the domain is set)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`, `INTERNAL_RENDER_TOKEN` (long random strings)
   - `NEXT_PUBLIC_WHATSAPP`, pricing vars, `POLISH_PROVIDER=off`
   - `RESEND_API_KEY`, `EMAIL_FROM` (after step 3)
4. Deploy. PDFs render with `@sparticuz/chromium` on Vercel automatically (function memory: set 1024 MB and 60 s max duration in Project → Settings → Functions).
5. Domain: Project → Domains → add `gtales.app` and `www.gtales.app`; set the DNS records Vercel shows at your registrar.

## 3. Email (Resend)
1. resend.com → Add domain `gtales.app` → add the DNS records → verify.
2. API key → `RESEND_API_KEY`. `EMAIL_FROM="GTales <stories@gtales.app>"`.

## 4. Story packs
Story files and image sets are deployed with the repo: `stories/<slug>.json` and `public/stories/<slug>/<boy|girl>/`. Run `npm run check:stories` before pushing.

## 5. Check after deploy
- `/` loads over https; `/tales/anxiety` → form → book → PDF works.
- Supabase Table Editor shows a row in `books` and rows in `events`.
- `/admin` opens with `ADMIN_PASSWORD`.
