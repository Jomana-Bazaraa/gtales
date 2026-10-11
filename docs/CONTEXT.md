# GTales — Shared working context

**Who:** Ayman (product owner, decisions, stories, art) and Jomana (GitHub repo owner, Vercel + Supabase accounts, deployment).
**What this file is:** the one page both of us, and both of our Claude sessions, read before touching the code and update after pushing. It says where things stand *right now*. The spec (`docs/SPEC.md`) says what the product *should be*; this file says what is actually done, what is in flight, and what the other person needs to know.

## How we use it

1. **Before you start:** `git pull`, read this file top to bottom (2 minutes).
2. **While you work:** if you make a decision the other person should know, add it to *Decisions*. If you hit something unfinished, add it to *Open items*.
3. **When you push:** add one line to the *Worklog* at the bottom (date · who · what changed · anything the other person must do). Commit it together with the code, in the same push.
4. **Never** put secrets here (API keys, passwords, Supabase keys). Those go in Vercel env vars and your local `.env.local` only.
5. If you work with Claude, tell it: *"Read docs/CONTEXT.md and docs/SPEC.md first, and update CONTEXT.md before you push."* `CLAUDE.md` already says this, so Claude Code does it on its own.

Keep sections short. Delete lines that are no longer true instead of piling on.

---

## Current state (keep this honest)

| Area | Status | Notes |
|---|---|---|
| Landing, Tales catalogue, tale pages | Done | Copy per SPEC §5–6; six tales with real covers and sample pages |
| Free story (form → book → reader → PDF) | Done | 12-question form, text-only engine, team template, A4 17-page PDF. All 6 stories × boy/girl = 12 image sets live |
| Series order form (12 screens) | Done | Photo optional + text description; pay on delivery; no refunds |
| My stories (passwordless) | Done | Order number + WhatsApp, or email magic link; tracker; "Order again" |
| Admin | Done | Single password. Stories, Series orders (status pipeline, WhatsApp templates), Settings (prices, promo, limits), Stats + CSV |
| AI polish of free story | Built, **off** | `POLISH_PROVIDER=off`; turn on only after we test it on real names |
| Supabase | **Not connected** | App runs on a local `.data/` mock store until env vars exist |
| Vercel | **Not deployed** | Repo is on GitHub; import pending |
| Domain | **Not bought** | |
| Email (magic links) | **Not configured** | Needs a Resend account + `RESEND_API_KEY` |
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
- **Deployment steps:** `docs/DEPLOY.md`. Env vars: `.env.example`. DB schema: `supabase/migrations/`.

## How to run and check

```
npm install
npm run dev            # http://localhost:3000 ; phone on same Wi-Fi: http://<laptop-ip>:3000
npm test               # 87 tests: every story × gender × 4 names, pronoun diff, image sets
npm run check:stories  # story files parse, tokens match "uses", image sets complete
npm run build          # must pass before pushing
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

## Open items

| # | Item | Owner | Blocked on |
|---|---|---|---|
| 1 | Create Supabase project, run `0001_init.sql` then `0002_gtales.sql`, copy URL + anon + service_role keys into Vercel | Jomana | — |
| 2 | Import repo into Vercel, set env vars from `.env.example`, deploy, invite Ayman as member | Jomana | #1 |
| 3 | Resend account for magic-link emails (`RESEND_API_KEY`) | Ayman | — |
| 4 | Buy domain, point it at Vercel, set `NEXT_PUBLIC_SITE_URL` | Ayman | #2 |
| 5 | Set `NEXT_PUBLIC_WHATSAPP` to the business number | Ayman | — |
| 6 | Test polish on real names, then decide `POLISH_PROVIDER` | Ayman | #2 |
| 7 | Delete the leftover `public/book/` folder on Ayman's laptop (removed from git already) | Ayman | — |
| 8 | Lighthouse / mobile pass on the deployed site | either | #2 |

## Worklog (newest first — one line per push)

- 2026-10-11 · Claude for Ayman · Last five image sets (feelings boy, lying ×2, friendship ×2); Honesty + Friendship covers; SPEC 1.7. All 12 sets live. **Jomana:** nothing to do; repo is ready to deploy.
- 2026-10-11 · Claude for Ayman · First push to `Jomana-Bazaraa/gtales` (full history). Full handoff adopted: six story files, `ask` removed, web-size image tree, 87 tests; SPEC 1.6.
- 2026-10-10 · Claude for Ayman · Ages 2–10, optional hero photo, price footer only late in the form, Meet-the-book uses rendered template pages; SPEC 1.5.
- 2026-10-10 · Claude for Ayman · My stories sign-in + tracker, WhatsApp templates in admin, Admin Settings + Stats, page-view beacon.
- 2026-10-10 · Claude for Ayman · Series = 3 books, 12-screen order form, orders API, admin order pipeline; deployment prep (migration, `.env.example`, `DEPLOY.md`).
