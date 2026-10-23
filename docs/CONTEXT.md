# GTales — Shared working context

**Who:** Ayman (product owner, decisions, stories, art) and Jomana (GitHub repo owner, Cloudflare + Supabase + Porkbun accounts, deployment).
**What this file is:** the one page both of us, and both of our Claude sessions, read before touching the code and update after pushing. It says where things stand *right now*. The spec (`docs/SPEC.md`) says what the product *should be*; this file says what is actually done, what is in flight, and what the other person needs to know.

## How we use it

1. **Before you start:** `git pull`, read this file top to bottom (2 minutes).
2. **While you work:** if you make a decision the other person should know, add it to *Decisions*. If you hit something unfinished, add it to *Open items*.
3. **When you push:** add one line to the *Worklog* at the bottom (date · who · what changed · anything the other person must do). Commit it together with the code, in the same push.
4. **Never** put secrets here (API keys, passwords, Supabase keys). Those go in Cloudflare / GitHub secrets and your local `.env.local` / `.dev.vars` only.
5. If you work with Claude, tell it: *"Read docs/CONTEXT.md and docs/SPEC.md first, and update CONTEXT.md before you push."* `CLAUDE.md` already says this, so Claude Code does it on its own.

Keep sections short. Delete lines that are no longer true instead of piling on.

---

## Current state (keep this honest)

| Area | Status | Notes |
|---|---|---|
| Landing, Tales catalogue, tale pages | Done | Copy per SPEC §5–6; six tales with real covers and sample pages |
| Free story (form → book → reader → PDF) | Done | 12-question form, text-only engine, team template. All 6 stories × boy/girl live. PDF (A4, 17 pages) is a job rendered by the GitHub Action `pdf.yml`; parent sees "being made" ~2 min, then instant |
| Series order form (12 screens) | Done | Photo optional + text description; pay on delivery; no refunds |
| My stories (passwordless) | Done | Order number + WhatsApp, or email magic link; tracker; "Order again" |
| Admin | Done | Single password. Free stories (with PDF state + Generate PDF), Series orders (status pipeline, WhatsApp templates), Dashboard (today/7/30 days, by story/gender/age, sources, promo codes, conversion) + CSV, Settings |
| Promo codes | Done (needs migration 0004) | Many codes in Supabase `promo_codes`: % off the books, free delivery or not, max uses, max per WhatsApp number, expiry. LAUNCH40 (40%, unlimited) and GTALESFAMILY (free: books and delivery, 0 EGP; 30 uses; up to 5 per number; until 5 Nov 2026), both active, one per order. Uses on Admin → Dashboard. New code = new row in Supabase Table Editor |
| Tracking | Done | `events` (story_started … order_delivered, session id, source, gender, age; never names), `parents` = users. Visitors/pages: Cloudflare Web Analytics |
| AI polish of free story | Built, **off** | `POLISH_PROVIDER=off`; turn on only after we test it on real names |
| Supabase | Connected | Migrations 0001–0003 run. **0004 (promo codes) and 0005 (reviews) still to run** in the SQL Editor. Locally the app uses a `.data/` mock store |
| Hosting | Live | Cloudflare Workers free via OpenNext, deploys from `main`. Worker 2.1 MiB gzip (limit 3 MiB). Steps: `docs/DEPLOY.md` |
| Domain | Live | `gtales.kids` (Porkbun, DNS on Cloudflare), Worker routes `gtales.kids/*` + `www.gtales.kids/*` |
| Email | **Not configured** | Resend for sending (`stories@gtales.kids`: story link, admin order alerts, magic links); Cloudflare Email Routing for `hello@gtales.kids` → team Gmail |
| Parent guides | Live | The team's 6 PDFs (`public/guides/<story>.pdf`, copied from `docs/reference/parent-guides/`) on the ready screen. Each says "Expert review in progress"; the "Expert-reviewed" label stays off until a named expert signs (SPEC §16) |
| Read to me | Done | Reader speaker button: the phone's own voice (free, offline, no AI), words highlighted, pauses at each "Your turn" |
| Reviews wall | Built (needs migration 0005 + Turnstile keys) | `/reviews/new` form (stars, text, name, city, age, 3 photos + 1 video, 2 consent boxes, Turnstile, 10/day/device) → pending → Admin → Reviews (approve, hide, feature, delete, add by hand) → home section "Families love GTales" + `/reviews`. Media in a private bucket, signed URLs. Average from 3 reviews |

## Where things live

- **Repo:** `github.com/Jomana-Bazaraa/gtales`, branch `main`. Ayman's laptop copy: `Documents\Estoria` (OneDrive). Claude's cloud copy pushes straight to `main`.
- **Spec (source of truth for copy, screens, pricing, rules):** `docs/SPEC.md`. Change the spec first, then the code; bump the version and changelog at the bottom.
- **Product config (tales, prices, promises, CTAs):** `src/lib/gtales.ts`. Live overrides: Admin → Settings.
- **Stories:** `stories/<slug>.json` — the only source of story text. Age variants + fun lines: `stories/variants/<slug>.json`. Builder cards: `stories/builder-options.json`. Slugs: `anger`, `worry`, `bullied`, `lying`, `feelings`, `friendship`. Catalogue slug `anxiety` maps to story `worry`.
- **Book design:** `public/gtales-book/{book.css,render.js,fonts}` — the team's template, used unchanged. Never restyle it.
- **Images:** `public/stories/<slug>/<boy|girl>/` full size (PDF) · `public/stories-web/...` 1200 px copies (reader, covers, samples). Both trees must have `cover.jpg, back.jpg, p01–p15.jpg`. A missing set makes that story/gender "coming soon" automatically.
- **Reference material (not served):** `docs/reference/` — handoff README + prompts, reference PDFs per story/gender, parent guides, template demos.
- **Launch plan (hosting, tracking, bug hunt, habit loops, AI decision):** `docs/LAUNCH-PLAN.md`. **Marketing plan:** `docs/MARKETING.md`.
- **Deployment steps:** `docs/DEPLOY.md` (Cloudflare, GitHub Action, Porkbun, Resend). Env vars: `.env.example`. DB schema: `supabase/migrations/` (0001–0003). Cloudflare config: `wrangler.jsonc`, `open-next.config.ts`.
- **PDFs:** `.github/workflows/pdf.yml` runs `scripts/pdf-worker.mjs`; the web app only queues (`src/lib/pdf-jobs.ts`). Locally: `npm run pdf:jobs`.

## How to run and check

```
npm install
npm run dev            # http://localhost:3000 ; phone on same Wi-Fi: http://<laptop-ip>:3000
npm test               # 157 tests: every story × gender × 4 names, pronoun diff, image sets, static lists, variants (ages 4/8, fun lines on/off)
npm run check:stories  # story files parse, tokens match "uses", image sets complete
npm run check:fit      # every story × gender × age 4/8 × with/without snack+silly in Chrome: no "too much text"
npm run build          # must pass before pushing
npm run cf:preview     # the real Cloudflare Worker build on http://localhost:8787 (needs .dev.vars + Supabase)
npm run pdf:jobs       # render queued PDFs locally (needs Chrome: PUPPETEER_EXECUTABLE_PATH)
```
Windows shortcut on Ayman's laptop: `run-dev.bat`.

## Decisions (don't re-litigate without talking)

- Ages **2–10** everywhere (the handoff form prompt says 4–8; Ayman overrode it, 10 Oct).
- The Series is **three** printed books: list 749 EGP, `LAUNCH40` → 449, delivery 89, total 538, **pay on delivery, no refunds** (parents approve every page on WhatsApp first).
- Free story is **text-only** personalisation on fixed art. Images are never generated at runtime. Series art is made manually by the team.
- The template is the only design; the story JSON is the only text source; the reference PDFs are only for comparison.
- `ask` field is gone for good. `need` comes from the `need` cards in `stories/builder-options.json` (19 Oct; replaced the form's six sentences).
- Hero photo in the order form is optional; a text description can replace it; no full-body photo.
- Price appears only on the delivery and review screens of the order form.
- Promo codes live in Supabase `promo_codes`; a use is claimed when the order is placed and given back if it's cancelled. Settings' default code + % stays the advertised offer (22 Oct).
- Single admin login. WhatsApp is manual (`wa.me` links) until a Business API is justified.
- Honest copy: no "psychology", no "hand-drawn", no "expert-reviewed", never cap or advertise the free stories.
- Hosting: Cloudflare Workers free + PDFs via GitHub Action; Netlify fallback; no Vercel/AWS/Google (17 Oct).
- Free tier: no AI calls at launch (POLISH_PROVIDER=off), revisit after 2 weeks of data (17 Oct).
- Habit loops target parents, no dark patterns on children (17 Oct; build after launch, `docs/LAUNCH-PLAN.md` §4).
- Age variants + fun lines live in stories/variants, applied by applyVariants; written by hand, no AI (19 Oct). Story Builder cards (sidekick, power word, snack, silly word, need) live in `stories/builder-options.json`; edit that file, not the form.
- The server never reads files at runtime (Workers have no disk): stories are imported in `src/stories/index.ts`, image sets listed in `IMAGE_SETS` (`src/stories/images.ts`); tests fail if either drifts from the repo.

## Open items

| # | Item | Owner | Blocked on |
|---|---|---|---|
| 1 | Merge `claude/pensive-bardeen-842ku4` into `main` (Cloudflare deploys `main`; the PDF workflow only runs from `main`) | Jomana | — |
| 2 | Supabase: run `0004_promo_codes.sql` then `0005_reviews.sql` in the SQL Editor (0001–0003 are done). Without 0004 orders with a promo code fail; without 0005 the review form fails and the wall stays hidden | Jomana | — |
| 3 | GitHub: Actions secrets + `SITE_URL` variable + fine-grained `GITHUB_PDF_TOKEN` (`docs/DEPLOY.md` §2) | Jomana | #1, #2 |
| 4 | Cloudflare Worker live on `*.workers.dev`: import repo, build/runtime variables (`docs/DEPLOY.md` §3) | Jomana | #1, #2 |
| 5 | Resend domain `gtales.kids` verified, `RESEND_API_KEY` / `EMAIL_FROM` / `ADMIN_NOTIFY_EMAIL` set, DMARC record | Jomana | #6 |
| 6 | Porkbun nameservers → Cloudflare; `gtales.kids` + `www` as Worker custom domains over HTTPS; Web Analytics on | Jomana | #4 |
| 7 | Cloudflare Email Routing: `hello@gtales.kids` → team Gmail | Jomana | #6 |
| 8 | Bug hunt on phones on the live domain (`docs/LAUNCH-PLAN.md` §3): load time, Lighthouse ≥ 80/90, emails land in inbox not spam, WhatsApp preview card, PDF via the Action. Everything that runs locally passed on 17 Oct (worklog) | both | #6 |
| 9 | Delete the Vercel project, uninstall the Vercel GitHub app, delete branch `vercel/install-vercel-speed-insights` | Jomana | #8 |
| 10 | Set `NEXT_PUBLIC_WHATSAPP` (Cloudflare **build** and runtime variables; Admin → Settings' number is not used by the footer yet) | Ayman | — |
| 11 | Post the launch (`docs/MARKETING.md`) | Ayman | #8 |
| 12 | Decide: LAUNCH-PLAN §1b wants an optional email/WhatsApp on the free form; SPEC keeps email required, never a phone. Code follows the SPEC | Ayman | — |
| 13 | Fix the docs: LAUNCH-PLAN §2 says "DNS stays at Porkbun" (contradicts §1 and the decision); MARKETING says "science-based parent guide… built on research". The live guides say "science-based" in the Worry and Big Feelings intros and "psychology"/"therapy" in references and "see a child psychologist" advice: OK with the no-"psychology" rule (SPEC §2.1)? If not, send new PDFs | Ayman | — |
| 14 | Before turning AI polish on: `polish.ts` reads its prompt from disk, which fails on Workers (falls back to the plain story). Import it like the stories | either | after 2 weeks |
| 15 | GitHub Actions minutes: each PDF ≈ 1 min; private repos get 2,000 free min/month. Watch Settings → Billing | Jomana | — |
| 16 | Series orders: no customer email (form asks WhatsApp only, by design), so the "add a review" link is on the confirmation page and the "delivered" WhatsApp message instead of an order email; the team gets an admin email per order. Series print files are made by the team, not the PDF job | — | info |
| 17 | After launch: remove the old Estoria code (`/api/stories`, `pipeline.ts`, `ai.ts`, `/showcase`, `/admin/orders`) and the 69 pre-existing lint errors | either | after launch |
| 18 | Delete the leftover `public/book/` folder on Ayman's laptop (removed from git already) | Ayman | — |
| 19 | Turnstile for the review form: create the widget and set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (build + runtime) and `TURNSTILE_SECRET_KEY` (`docs/DEPLOY.md` §4 step 6). Until then the form has no bot check (the 10/day limit still applies) | Jomana | — |
| 20 | Privacy page is partly out of date: it still says "we never ask for, accept or store photos of your child" and mentions Google Gemini, but Series orders take hero photos (deleted on delivery) and reviews can include photos/video. Reviews section added; the rest needs Ayman's wording. Also check the new Arabic reviews paragraph | Ayman | — |
| 21 | Review videos: iPhone .mov files in HEVC may not play in Chrome/Android; check the preview in Admin → Reviews before approving. Uploads that were never submitted stay in the bucket's `pending/` folder; clean up now and then (Supabase → Storage) | either | — |

## Worklog (newest first — one line per push)

- 2026-10-24 · Claude for Jomana · Resend "mock mode" on production: `wrangler deploy` deletes dashboard variables of type Text on every deploy unless `keep_vars` is set (Secrets survive). Added `"keep_vars": true` to `wrangler.jsonc`. Admin → Settings → "Send test email" shows Resend's raw response and whether RESEND_API_KEY / EMAIL_FROM / ADMIN_NOTIFY_EMAIL reach the server (never their values). **Jomana:** add RESEND_API_KEY as a Secret (runtime), redeploy, press Send test email.
- 2026-10-24 · Claude for Jomana · Reviews "not working": the code was never on `main` (live site = PR #2; everything since, incl. reviews and promo codes, is only on `claude/pensive-bardeen-842ku4`). Hardened for the merge: promo redeem falls back to an uncounted LAUNCH40 check if migration 0004 isn't run (orders never fail); review submit returns a clear 503 and Admin → Reviews shows a banner if 0005 isn't run; Turnstile only enforced when BOTH keys are set; upload check falls back to the folder listing. Tested on a 390 px phone against Postgres: without 0004/0005 an order with LAUNCH40 = 538; with them, submit with photo → approve in admin → shown on the homepage. **Jomana:** run 0004 + 0005, then merge (see open item #1).
- 2026-10-24 · Claude for Jomana · Fix: bullied form, the unkind child's name came back as "Sam" after deleting it (`value={d.other || "Sam"}`). Now empty with placeholder "e.g. Sam", optional, "Sam" only when submitted empty. No other field used that pattern.
- 2026-10-23 · Claude for Jomana · Reviews wall "Families love GTales": migration `0005_reviews.sql` (table + PRIVATE bucket, 50 MB, photo/mp4/mov only); `/reviews/new` form (stars, text ≤ 5000, first name, city, child age, 3 photos resized to 1600 px in the browser + 1 video ≤ 30 s/50 MB, camera or gallery, 2 consent boxes, Turnstile ticket, 10/day/device), direct-to-bucket signed uploads; Admin → Reviews (pending badge, approve / hide / feature / delete with files, add by hand with consent box); admin email per pending review; home section (phone swipe, desktop masonry, muted video tap-for-sound, lazy images) + `/reviews`, average from 3; review links at the end of the reader, ready screen, story email, order confirmation, delivered WhatsApp; privacy section; events review_started/submitted/approved on the Dashboard; reviews toggle removed. Tested on Postgres + a Storage stand-in in Chrome (phone + desktop). 164 tests. SPEC 1.11. **Jomana:** run 0004 + 0005, set up Turnstile (open items). **Ayman:** privacy page wording.
- 2026-10-22 · Claude for Jomana · GTALESFAMILY is now free (books + delivery = 0 EGP) and works up to 5 times per WhatsApp number (still 30 in all, until 5 Nov); LAUNCH40 stays active alongside, one code per order. A 0 EGP order says "Free" in the form, confirmation, My stories, admin list, admin email and WhatsApp messages. Re-checked on Postgres: 5 orders on one number OK, 6th refused, LAUNCH40 = 538. **Jomana:** run `0004_promo_codes.sql` again in Supabase (re-running updates GTALESFAMILY and keeps its use count).
- 2026-10-22 · Claude for Jomana · Multiple promo codes: migration `0004_promo_codes.sql` (new columns, `promo_redemptions`, atomic `redeem_promo` / `release_promo`), GTALESFAMILY (100% off the books, delivery paid, 30 uses, 1 per phone, expires 5 Nov 2026 23:59 Cairo), LAUNCH40 unchanged; order form checks codes live (`/api/promo`) with clear reasons; cancel gives the use back; Settings default code syncs its %; Dashboard "Promo codes" table (offer, uses / limit, per phone, expiry, status, orders, discount, revenue). Tested on Postgres 16: 40 parallel claims → exactly 30; end to end through the app. 160 tests. SPEC 1.10. **Jomana:** run 0004 in Supabase SQL Editor before merging.
- 2026-10-19 · Claude for Jomana · Parent guides live (6 PDFs in `public/guides/`, ready-screen button + card replace "CONTENT NEEDED"); Read to me in the reader (Web Speech API, word highlight, stops at each "Your turn"); **fixed the reader on phones**: pages were cut off on the right (the unscaled A4 page widened the screen before scaling). Tested in Chrome at 390/360/1280 px. **Jomana:** Resend setup (open item #5) clears the admin "Mock mode: Resend" bar. **Ayman:** open item #13 (guide wording).
- 2026-10-19 · Claude for Jomana · Age variants + fun lines (`stories/variants/*.json`, `public/gtales-book/variants.js`, copied unchanged) applied before fillStory; `snack`/`silly` tokens in render.js `tokens()`; form cards from `stories/builder-options.json` + optional snack and silly-word steps; snack/silly optional in form and order schemas; power word limit 20 → 24 ("I'm a dinosaur! RAWR!" is 21). 157 tests pass; `npm run check:fit`: 48 books (6 stories × 2 genders × ages 4/8 × with/without snack+silly), 0 "too much text". SPEC 1.9. **Jomana:** nothing to set up; merge and Cloudflare deploys. Books made before this keep their old text.
- 2026-10-17 · Claude for Jomana · Cloudflare build timed out twice: the Deploy command was `npm run cf:preview`, which starts a local server that never exits. `cf:preview` now deploys when run on Cloudflare's build machine; `cf:deploy` no longer rebuilds. **Jomana:** set Deploy command to `npm run cf:deploy` (Settings → Build), then start a new deployment.
- 2026-10-17 · Claude for Jomana · Launch: Cloudflare Workers (OpenNext, Next 16.4.2; Worker 1.95 MiB gzip, was 2.98 MiB with Puppeteer), PDFs via GitHub Action job queue + "being made" page, Admin Dashboard + events/parents tracking, migration 0003 (fixes the `orders` table: every Series order insert would have failed), admin email per order + story-link email, OG cover previews + "Send to WhatsApp", forms survive a dropped connection, gtales.kids everywhere, `LAUNCH-PLAN.md` + `MARKETING.md` added; SPEC 1.8. Tested on the Worker runtime against Postgres with migrations 0001–0003: 12 stories × gender, tricky names, rate limit, order with LAUNCH40 = 538, admin, 401/403 without login, 17-page A4 PDF. **Jomana:** open items #1–#9, in order.
- 2026-10-11 · Claude for Ayman · Last five image sets (feelings boy, lying ×2, friendship ×2); Honesty + Friendship covers; SPEC 1.7. All 12 sets live. **Jomana:** nothing to do; repo is ready to deploy.
- 2026-10-11 · Claude for Ayman · First push to `Jomana-Bazaraa/gtales` (full history). Full handoff adopted: six story files, `ask` removed, web-size image tree, 87 tests; SPEC 1.6.
- 2026-10-10 · Claude for Ayman · Ages 2–10, optional hero photo, price footer only late in the form, Meet-the-book uses rendered template pages; SPEC 1.5.
- 2026-10-10 · Claude for Ayman · My stories sign-in + tracker, WhatsApp templates in admin, Admin Settings + Stats, page-view beacon.
- 2026-10-10 · Claude for Ayman · Series = 3 books, 12-screen order form, orders API, admin order pipeline; deployment prep (migration, `.env.example`, `DEPLOY.md`).
