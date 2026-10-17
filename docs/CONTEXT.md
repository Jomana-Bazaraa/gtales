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
| Tracking | Done | `events` (story_started … order_delivered, session id, source, gender, age; never names), `parents` = users. Visitors/pages: Cloudflare Web Analytics |
| AI polish of free story | Built, **off** | `POLISH_PROVIDER=off`; turn on only after we test it on real names |
| Supabase | **Not connected** | Run migrations 0001 → 0002 → 0003. Locally the app uses a `.data/` mock store (the Worker can't; it needs Supabase) |
| Hosting | **Built, not deployed** | Cloudflare Workers free via OpenNext (moving off Vercel; Netlify is the fallback). Worker 1.95 MiB gzip (limit 3 MiB). Steps: `docs/DEPLOY.md` |
| Domain | **Bought** | `gtales.kids` at Porkbun; DNS moving to Cloudflare (nameservers) |
| Email | **Not configured** | Resend for sending (`stories@gtales.kids`: story link, admin order alerts, magic links); Cloudflare Email Routing for `hello@gtales.kids` → team Gmail |
| Expert review of parent guides | Parked | Ayman's call; not shown on site |
| Reviews section | Hidden | Shows only when three real reviews exist (`NEXT_PUBLIC_REVIEWS_VISIBLE`) |

## Where things live

- **Repo:** `github.com/Jomana-Bazaraa/gtales`, branch `main`. Ayman's laptop copy: `Documents\Estoria` (OneDrive). Claude's cloud copy pushes straight to `main`.
- **Spec (source of truth for copy, screens, pricing, rules):** `docs/SPEC.md`. Change the spec first, then the code; bump the version and changelog at the bottom.
- **Product config (tales, prices, promises, CTAs):** `src/lib/gtales.ts`. Live overrides: Admin → Settings.
- **Stories:** `stories/<slug>.json` — the only source of story text. Slugs: `anger`, `worry`, `bullied`, `lying`, `feelings`, `friendship`. Catalogue slug `anxiety` maps to story `worry`.
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
npm test               # 89 tests: every story × gender × 4 names, pronoun diff, image sets, static story/image lists
npm run check:stories  # story files parse, tokens match "uses", image sets complete
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
- `ask` field is gone for good. `need` is free text from the form's own six sentences.
- Hero photo in the order form is optional; a text description can replace it; no full-body photo.
- Price appears only on the delivery and review screens of the order form.
- Single admin login. WhatsApp is manual (`wa.me` links) until a Business API is justified.
- Honest copy: no "psychology", no "hand-drawn", no "expert-reviewed", never cap or advertise the free stories.
- Hosting: Cloudflare Workers free + PDFs via GitHub Action; Netlify fallback; no Vercel/AWS/Google (17 Oct).
- Free tier: no AI calls at launch (POLISH_PROVIDER=off), revisit after 2 weeks of data (17 Oct).
- Habit loops target parents, no dark patterns on children (17 Oct; build after launch, `docs/LAUNCH-PLAN.md` §4).
- The server never reads files at runtime (Workers have no disk): stories are imported in `src/stories/index.ts`, image sets listed in `IMAGE_SETS` (`src/stories/images.ts`); tests fail if either drifts from the repo.

## Open items

| # | Item | Owner | Blocked on |
|---|---|---|---|
| 1 | Merge `claude/pensive-bardeen-842ku4` into `main` (Cloudflare deploys `main`; the PDF workflow only runs from `main`) | Jomana | — |
| 2 | Create Supabase project, run `0001_init.sql` → `0002_gtales.sql` → `0003_launch.sql` | Jomana | — |
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
| 13 | Fix the docs: LAUNCH-PLAN §2 says "DNS stays at Porkbun" (contradicts §1 and the decision); MARKETING says "science-based parent guide… built on research" (clashes with honest-copy rule, and the ready screen's parent guide is still "CONTENT NEEDED") | Ayman | — |
| 14 | Before turning AI polish on: `polish.ts` reads its prompt from disk, which fails on Workers (falls back to the plain story). Import it like the stories | either | after 2 weeks |
| 15 | GitHub Actions minutes: each PDF ≈ 1 min; private repos get 2,000 free min/month. Watch Settings → Billing | Jomana | — |
| 16 | Series orders: no customer email (form asks WhatsApp only, by design); the team gets an admin email per order. Series print files are made by the team, not the PDF job | — | info |
| 17 | After launch: remove the old Estoria code (`/api/stories`, `pipeline.ts`, `ai.ts`, `/showcase`, `/admin/orders`) and the 69 pre-existing lint errors | either | after launch |
| 18 | Delete the leftover `public/book/` folder on Ayman's laptop (removed from git already) | Ayman | — |

## Worklog (newest first — one line per push)

- 2026-10-17 · Claude for Jomana · Cloudflare build timed out twice: the Deploy command was `npm run cf:preview`, which starts a local server that never exits. `cf:preview` now deploys when run on Cloudflare's build machine; `cf:deploy` no longer rebuilds. **Jomana:** set Deploy command to `npm run cf:deploy` (Settings → Build), then start a new deployment.
- 2026-10-17 · Claude for Jomana · Launch: Cloudflare Workers (OpenNext, Next 16.4.2; Worker 1.95 MiB gzip, was 2.98 MiB with Puppeteer), PDFs via GitHub Action job queue + "being made" page, Admin Dashboard + events/parents tracking, migration 0003 (fixes the `orders` table: every Series order insert would have failed), admin email per order + story-link email, OG cover previews + "Send to WhatsApp", forms survive a dropped connection, gtales.kids everywhere, `LAUNCH-PLAN.md` + `MARKETING.md` added; SPEC 1.8. Tested on the Worker runtime against Postgres with migrations 0001–0003: 12 stories × gender, tricky names, rate limit, order with LAUNCH40 = 538, admin, 401/403 without login, 17-page A4 PDF. **Jomana:** open items #1–#9, in order.
- 2026-10-11 · Claude for Ayman · Last five image sets (feelings boy, lying ×2, friendship ×2); Honesty + Friendship covers; SPEC 1.7. All 12 sets live. **Jomana:** nothing to do; repo is ready to deploy.
- 2026-10-11 · Claude for Ayman · First push to `Jomana-Bazaraa/gtales` (full history). Full handoff adopted: six story files, `ask` removed, web-size image tree, 87 tests; SPEC 1.6.
- 2026-10-10 · Claude for Ayman · Ages 2–10, optional hero photo, price footer only late in the form, Meet-the-book uses rendered template pages; SPEC 1.5.
- 2026-10-10 · Claude for Ayman · My stories sign-in + tracker, WhatsApp templates in admin, Admin Settings + Stats, page-view beacon.
- 2026-10-10 · Claude for Ayman · Series = 3 books, 12-screen order form, orders API, admin order pipeline; deployment prep (migration, `.env.example`, `DEPLOY.md`).
