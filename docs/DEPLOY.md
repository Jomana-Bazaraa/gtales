# GTales deployment (Cloudflare Workers + Supabase + GitHub Action + Resend)

Do once. After this, every push to `main` builds and deploys on Cloudflare. Why these services: `docs/LAUNCH-PLAN.md` §1–2.

## 1. Supabase (database + file storage)
1. supabase.com → New project → name `gtales`, region Frankfurt (closest to Egypt), strong DB password.
2. SQL Editor → run, in this order: `supabase/migrations/0001_init.sql`, `0002_gtales.sql`, `0003_launch.sql`, `0004_promo_codes.sql`, `0005_reviews.sql`, `0007_order_quantity.sql`, `0008_dashboard_stats.sql` (there is no 0006). (0003–0008 are safe to re-run.)
3. Project settings → API: copy **Project URL** and the **service_role** key (never the anon key, never in client code).

## 2. GitHub (PDFs)
PDFs are rendered by `.github/workflows/pdf.yml`, never on the web server. The workflow must be on `main`.
1. Repo → Settings → Secrets and variables → Actions:
   - **Secrets:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_RENDER_TOKEN` (same value as on Cloudflare).
   - **Variables:** `SITE_URL` = `https://gtales.kids` (the `*.workers.dev` URL until the domain works).
2. github.com → your avatar → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate:
   name `gtales-pdf`, expiry 1 year (put the date in your calendar), Repository access: **Only select repositories** → `gtales`,
   Repository permissions → **Actions: Read and write**. Copy it: it is `GITHUB_PDF_TOKEN` on Cloudflare.
3. Test: Actions → pdf → Run workflow (empty job id). It should finish green with "0 queued job(s)".

## 3. Cloudflare Worker (hosting)
1. dash.cloudflare.com → sign up (free plan).
2. Workers & Pages → Create → **Import a repository** → connect GitHub → pick `Jomana-Bazaraa/gtales`.
   - Project / Worker name: **`gtales`** (must match `name` in `wrangler.jsonc`)
   - Production branch: `main`
   - Build command: `npm run cf:build`
   - Deploy command: `npm run cf:deploy` (never a preview command: a preview server never exits and the build times out after 30 min; `cf:preview` now deploys when it detects Cloudflare's build machine, as a safety net)
   - Root directory: `/`
3. Before the first build, **Settings → Build → Variables and secrets** (build-time; `NEXT_PUBLIC_*` are baked into the pages):
   `NODE_VERSION=22`, `NEXT_PUBLIC_SITE_URL=https://gtales.kids`, `NEXT_PUBLIC_WHATSAPP=20xxxxxxxxxx`
   Prices (the only place they live; defaults 249 per book, 40% launch, 89 delivery per order): `NEXT_PUBLIC_LIST_PRICE_EGP`, `NEXT_PUBLIC_PROMO_PERCENT`, `NEXT_PUBLIC_DELIVERY_EGP`: set them here AND in runtime variables, or leave both unset. `NEXT_PUBLIC_SHOW_WHATS_INSIDE=1` shows the "What's inside every book" box.
4. **Settings → Variables and Secrets** (runtime), type **Secret** for each:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `INTERNAL_RENDER_TOKEN`, `RESEND_API_KEY`,
   `EMAIL_FROM` (`GTales <stories@gtales.kids>`), `ADMIN_NOTIFY_EMAIL`, `GITHUB_PDF_TOKEN`,
   and again `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP`. Leave `POLISH_PROVIDER` unset (= off) and `RATE_LIMIT_PER_HOUR` unset (= 10).
5. `wrangler.jsonc` has `keep_vars: true`, so these survive every deploy (before 24 Oct, a deploy deleted dashboard variables of type Text; Secrets were always kept). After adding or changing a variable, Cloudflare offers **Deploy**: click it (or push to `main`). Check in Admin → Settings → **Send test email**.
6. Deployments → Retry/Deploy. The site is live on `https://gtales.<your-subdomain>.workers.dev`.
   Static files in `public/` (story images, fonts) are served as free static assets. The Worker itself is ~2 MiB gzip (free limit 3 MiB).

Local check of the Worker build: `npm run cf:preview` (needs `.dev.vars` with the runtime variables; never commit it).

## 4. Domain `gtales.kids` (Porkbun → Cloudflare DNS)
1. Cloudflare → Add a domain → `gtales.kids` → Free plan. It imports the Porkbun records; **delete the imported `A`/`ALIAS`/`CNAME` for `gtales.kids` and `www`** (Porkbun parking) so the Worker can take them. Note the two nameservers it shows.
2. Porkbun → Domain Management → `gtales.kids` → Details: if **DNSSEC** is on, turn it off first. Then **Authoritative Nameservers** → Edit → delete the Porkbun ones → paste the two Cloudflare nameservers → Submit.
3. Wait for Cloudflare to say the domain is **Active** (minutes to a few hours).
4. Workers & Pages → `gtales` → Settings → **Domains & Routes** → Add → **Custom domain** → `gtales.kids`; again for `www.gtales.kids`.
5. Analytics & Logs → **Web Analytics** → Add a site → `gtales.kids` → automatic setup (free, no cookie banner).
6. **Turnstile** (bot check on the review form, free): Cloudflare → **Turnstile** → Add widget → name `gtales-reviews`, hostname `gtales.kids` (add `localhost` for testing), mode **Managed** → Create. Put the **Site key** in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Settings → Build variables AND runtime Variables) and the **Secret key** in `TURNSTILE_SECRET_KEY` (runtime, type Secret). Redeploy. Without them the form works but has no bot check.

## 5. Email
**Sending (Resend):** resend.com → Domains → Add `gtales.kids` (region eu-west-1) → copy its records into Cloudflare → DNS: the `TXT resend._domainkey`, the `MX send` and `TXT send` records. Verify. Create an API key → `RESEND_API_KEY`.
**DMARC:** Cloudflare DNS → Add TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:<team inbox>`.
**Receiving `hello@gtales.kids`:** Cloudflare → gtales.kids → Email → **Email Routing** → Get started → add the team Gmail as destination (click the link it emails) → Custom address `hello` → send to that Gmail → let it add its MX/TXT records.

## 6. Check after deploy (bug hunt: `docs/LAUNCH-PLAN.md` §3)
- `/` loads over https; `/tales/anxiety` → form → book → reader; Story PDF shows "being made", then opens (Actions → pdf run is green).
- Supabase Table Editor: rows in `books`, `events`, `parents`, `pdf_jobs`.
- `/admin` opens with `ADMIN_PASSWORD`; Dashboard shows the story.
- Place a Series order (no code needed) with 3 books → 3 × 149 + 89 = 536 EGP; the admin email arrives in the inbox (not spam).
- Then delete the Vercel project and uninstall the Vercel GitHub app.
