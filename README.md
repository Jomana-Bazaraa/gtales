# Estoria

Personalized interactive children's storybooks built around **the Keepers** — nine characters who each guard one feeling and need the child's help with it.

- Next.js 16 (App Router) · Tailwind v4 · Vercel
- Gemini: **1 text call + 2 image calls per story** (templates are static; substitutions are plain JS)
- Supabase (Postgres + Storage) · Resend (email) · headless Chrome for PDFs (Arabic-safe)
- Everything runs locally in **mock mode** with no keys.

## Run locally

```bash
npm install
cp .env.example .env.local      # leave keys empty for mock mode
npm run dev                      # http://localhost:3000
```

Mock mode: stories are stored in `.data/`, emails land in `.data/outbox/`, AI output is canned, illustrations are SVG placeholders. Admin at `/admin` (password `estoria-dev` unless you set `ADMIN_PASSWORD`).

PDFs locally need a Chrome binary: set `PUPPETEER_EXECUTABLE_PATH` (e.g. `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`), or set `PDF_DISABLED=1` to skip them.

## How a story is made

```
POST /api/stories
  └─ after():  runTextAndImages(id)
        1. pick template  src/templates/<keeper-struggle>.<lang>.md   (static)
        2. ONE Gemini text call → { interest_phrases, personal_detail_text, challenge, parent_tips, cover_scene, full_story? }
        3. JS substitution of {{CHILD_NAME}}, {{he|she}} gender forks, [[SIDEKICK: …]] blocks, interest phrases, personal detail
        4. cover image (Gemini, from structured appearance + Keeper reference art in public/keepers/<id>.png)
        5. line-art image (Gemini image-to-image edit of the cover)
        → status "ready" — story page is viewable
     then POST /api/stories/[id]/finalize
        6. two PDFs rendered from /story/[id]/print?variant=color|lineart
        7. email to parent (Resend)
```

`struggle = other` has no template: the same single call also returns `full_story` and picks the Keeper. The parent is warned twice that it is AI-written.

## Template format

`src/templates/<key>.<lang>.md` — see `blaze-anger.en.md`. Header lines, then pages split by `---`.

| Token | Meaning |
|---|---|
| `{{CHILD_NAME}}` `{{KEEPER}}` `{{KEEPER_TITLE}}` `{{SIDEKICK}}` | plain substitution |
| `{{INTEREST_WORLD}}` `{{INTEREST_PLACE}}` `{{INTEREST_OBJECT}}` `{{INTEREST_ACTIVITY}}` | phrases the AI returns in the grammatical form the sentence needs |
| `{{he\|she}}` `{{راح\|راحت}}` | gender fork: boy-form \| girl-form (works for Arabic verbs/adjectives) |
| `[[SIDEKICK: …]]` | block kept only when a side character was given |
| `[PERSONAL_DETAIL_SLOT]` | replaced by the AI's 1–2 sentences |
| `[INTERACTIVE_SLOT]` | where the challenge page is inserted |

Template keys expected (see `STRUGGLES` in `src/lib/keepers.ts`): `blaze-anger`, `blaze-violence`, `blaze-bullying`, `wisp-anxiety`, `pip-friendship`, `zigzag-sibling`, `bolt-confidence`, `chroma-emotions`, `willow-loss`, `pebble-bullied`, `tangle-lying` — each in `en` and `ar`. A missing template falls back to `blaze-anger` with a console warning.

## Activities

`src/lib/activities/registry.ts` — the menu, age bands (3–5 / 6–8 / 9–11), which challenge types fit which struggle, and the default 3-activity Workshop per struggle. Procedural puzzles (maze, word search, dots, hidden objects) are in `generators.ts`, seeded by story id so web and PDF match. Only riddle / math / choose-the-path come from the AI call.

## Setting up the real services

### 1. Supabase
1. Create a project (free tier). Region: Frankfurt (closest to Egypt).
2. SQL editor → paste `supabase/migrations/0001_init.sql` → Run.
3. Settings → API: copy **Project URL** → `SUPABASE_URL`, **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`. Never expose the service key client-side (it isn't).

### 2. Gemini
1. https://aistudio.google.com → Get API key → `GEMINI_API_KEY`.
2. Enable billing on the Google Cloud project (image generation has no free tier). Expected cost per story: ≈ $0.004 text + 2 × $0.034 images ≈ **$0.07**.
3. Models are set in `.env.example`; override if Google renames them.

### 3. Resend
1. https://resend.com → Domains → add `estoria.kids` → add the DNS records it shows (DKIM, SPF, MX for bounces) at your registrar → Verify.
2. API Keys → create → `RESEND_API_KEY`. Set `EMAIL_FROM="Estoria <stories@estoria.kids>"` and `ADMIN_NOTIFY_EMAIL` to get a mail per printed-book order.

### 4. Vercel
1. Push the repo to GitHub, import in Vercel. Framework auto-detected.
2. Environment variables: everything in `.env.example` except `PUPPETEER_EXECUTABLE_PATH` / `PDF_DISABLED`. Set `NEXT_PUBLIC_SITE_URL=https://<your>.vercel.app` (change to the domain later), strong `ADMIN_PASSWORD` and `INTERNAL_RENDER_TOKEN`.
3. Function duration: the `/api/stories` and `/finalize` routes declare `maxDuration = 60`. On the Hobby plan enable **Fluid Compute** (Project → Settings → Functions) so 60 s is honoured.
4. Deploy. Test one story end to end.

### 5. Domain (estoria.kids)
1. Vercel → Project → Settings → Domains → add `estoria.kids` and `www.estoria.kids`.
2. At the registrar add the records Vercel shows (A `76.76.21.21` for apex, CNAME `cname.vercel-dns.com` for www).
3. Update `NEXT_PUBLIC_SITE_URL=https://estoria.kids`. Nothing else in the code references the host.

### 6. Keeper reference art
Drop one PNG per Keeper into `public/keepers/<id>.png` (`blaze.png`, `wisp.png`, …). When present it is sent to the image model alongside the prompt so the character stays consistent.

## Admin
`/admin` — all story orders (parent, child, struggle, Keeper, language, status, errors). `/admin/orders` — printed-book orders with full delivery details and a **Mark as shipped** toggle.
