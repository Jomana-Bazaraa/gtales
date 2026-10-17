# GTales launch plan (launch day: 2026-10-17)

Owner: Jomana. Keep this file current. Every decision here is also summarised in `docs/CONTEXT.md` → Decisions.

---

## 1. Hosting: leave Vercel for a free host

**Decision:** **Cloudflare Workers (free plan)**, via the OpenNext adapter for Next.js.
- **PDF printing moves off the web server**, to a **GitHub Action** (free minutes) that uses the same Playwright code. Only admin makes PDFs (1 per order), so this is never on the customer's path.
- **Fallback:** Netlify free, if our Worker is bigger than Cloudflare's free 3 MiB limit after the build.

**Why not the others:**

| | Cloudflare Workers (free) | Netlify (free) | AWS / Google Cloud |
|---|---|---|---|
| Cost | $0 | $0, but a hard 300 credits/month; when they run out, the **whole site pauses** until next month | Free only with credits/limits; billing card required |
| Traffic | 100k requests/day; static files (our 204 images) served free | ~15 GB/month total; about 20 production deploys/month max (15 credits each) | Fine |
| Next.js | Yes, via OpenNext; **free Worker must be ≤ 3 MiB compressed** | Yes, native | Yes |
| PDF (Chromium) | Not inside Workers → GitHub Action | Possible but heavy, eats compute credits | Yes |
| Free analytics | **Cloudflare Web Analytics**, free, cookie-free | Netlify Analytics is a paid add-on | Paid / complex |
| Team criteria | No known issue found (not fully verifiable) | No known issue found (not fully verifiable) | Both are contractors on Project Nimbus (Israeli government cloud), so they fail our criteria |

**What Claude Code must change for Cloudflare:**
1. Add `@opennextjs/cloudflare` and `wrangler.jsonc` (`nodejs_compat`, compatibility date ≥ 2024-09-23).
   - Build, and **check the compressed Worker size is under 3 MiB**.
   - If it's bigger, stop and tell Jomana. We then use Netlify.
2. Serve `public/` (story images, fonts) as static assets. They are free and don't count toward the Worker size.
3. Remove Puppeteer and `@sparticuz/chromium` from the web app. Then:
   - Admin "Generate PDF" inserts a job row in Supabase and triggers a GitHub Action (`workflow_dispatch`), using a GitHub token stored as a secret.
   - The Action runs Playwright, renders the book, uploads the PDF to Supabase Storage and marks the order "PDF ready".
4. Remove Vercel-only code (`@vercel/*`, `vercel.json`).
5. Test with `wrangler dev`: free story, order, admin, PDF job.

**Cloudflare steps (Jomana):**
1. Create a free account at dash.cloudflare.com.
2. Go to Workers & Pages → Create → Import a repository → `Jomana-Bazaraa/gtales`. Use the build/deploy commands Claude Code gives you.
3. Go to Settings → Variables and Secrets and add the environment variables below as **Secrets**.
4. Custom domain:
   - Easiest: add `gtales.kids` to Cloudflare as a site (free plan). In Porkbun, change the **nameservers** to the two Cloudflare gives you.
   - Then Worker → Settings → Domains & Routes → add `gtales.kids` and `www.gtales.kids`.
   - DNS then lives in Cloudflare: Resend's records go there too.
5. Turn on **Web Analytics** for gtales.kids (free).
6. When the live site works, delete the Vercel project and remove the Vercel GitHub app.

**Environment variables (production):**
- Required:
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_PASSWORD`, `INTERNAL_RENDER_TOKEN`
  - `NEXT_PUBLIC_SITE_URL=https://gtales.kids`, `NEXT_PUBLIC_WHATSAPP`
  - `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`
  - `GITHUB_PDF_TOKEN`
- Keep the defaults for: prices, promo, `POLISH_PROVIDER=off`, `RATE_LIMIT_PER_HOUR=10`.
- Never commit values. Only `.env.example` lives in git.

---

## 1b. Tracking: stories created, stories ordered, users

The host doesn't decide this. **Supabase is the source of truth**, and an **Admin → Dashboard** page shows it.
- **Events table** `events(id, created_at, type, story_slug, gender, child_age, session_id, parent_id, source)`, where `type` is one of:
  - `story_started` (form opened)
  - `story_created` (free story generated)
  - `story_finished` (reached the last page)
  - `story_shared` (WhatsApp button)
  - `order_started`
  - `order_placed`
  - `order_delivered`
- **Users** = unique parents:
  - Add an optional email/WhatsApp field "Send me my free story", saved in a `parents` table.
  - Anonymous visitors are counted by a random `session_id` in the browser (no personal data).
- **Source:** read `?utm_source=` / influencer code from the link, store it on the event and the order, and show which channel brings orders.
- **Dashboard shows:**
  - Today / 7 days / 30 days: visitors, stories created, finished, shared, orders, revenue.
  - Breakdowns by story, gender and age.
  - Conversion: created → ordered.
  - Top sources and promo codes.
- **Visitors and pages:** Cloudflare Web Analytics (free, no cookie banner needed).
- **Optional later:** PostHog free tier for funnels and session replays.
- **Privacy:** never store the child's name in `events`, only in the order itself.

## 2. Domain + email

- **Domain:** `gtales.kids`, bought at Porkbun. DNS stays at Porkbun.
- **Sending email (order confirmations, the story link, admin alerts):** **Resend**. The free tier (about 3,000 emails/month) is enough for launch.
  1. Go to Resend → Domains → add `gtales.kids`.
  2. Copy its DNS records (SPF, DKIM, and the MX for bounces) into Cloudflare DNS (or Porkbun, if nameservers were not moved). Wait for "Verified".
  3. Create an API key and set it as `RESEND_API_KEY`.
  4. Set `EMAIL_FROM="GTales <stories@gtales.kids>"` and `ADMIN_NOTIFY_EMAIL=<team inbox>`.
  5. Add a DMARC record in the DNS: TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:<team inbox>`.
- **Receiving email (`hello@gtales.kids`):** use **Cloudflare Email Routing** (free; or Porkbun forwarding if DNS stays at Porkbun) to the team Gmail. Upgrade to a real mailbox (Zoho Mail free plan, or Google Workspace) only if we need to reply *from* @gtales.kids.
- **Test:** place a real order on the live site and check that the confirmation reaches Gmail's **inbox, not spam**, on both phone and laptop.

---

## 3. Bug hunt before launch (Claude Code runs this, Jomana tests on a phone)

Must all pass on the **live domain**, on a phone, on mobile data:

1. Landing page loads in under 3 seconds on mobile, all 6 story covers show, and nothing says "coming soon".
2. Free story, for each of the 6 stories × boy/girl:
   - Fill the form, read the full book.
   - All challenges are tappable and show the right responses.
   - No `{{`, `undefined` or `(Name)` anywhere.
3. Tricky inputs: names like "Abdelrahman", "Lulu", "Mohamed Ali", and "Jana" with an emoji; an empty place; a 2-year-old; a 10-year-old.
4. Order flow:
   - Promo `LAUNCH40` applies the right price.
   - Delivery fee is 89 EGP.
   - Cash on delivery confirmation.
   - Order saved in Supabase.
   - Customer email arrives.
   - Admin email arrives.
5. Admin: log in with the password, see the order, generate the print PDF (17 A4 pages, pictures not cropped badly), change the order status.
6. WhatsApp button opens a chat with the right number and a pre-filled message.
7. Security:
   - Admin pages and internal PDF routes return 401 without the password or token.
   - The Supabase service key never appears in browser code. Search the built JS for `service_role`.
   - Rate limit works (11th free story in an hour from one IP is blocked).
8. Errors: turn the network off mid-form. The form keeps what was typed and shows a friendly message, not a crash.
9. Share: the free story has a "Send to WhatsApp" link, and the preview card shows a cover image (Open Graph tags).
10. Lighthouse mobile scores: Performance ≥ 80, Accessibility ≥ 90.

Log every bug in `docs/CONTEXT.md` → Open items, as one line each. Fix "blocks orders" bugs before launch and the rest after.

---

## 4. Making it habit-forming (in a way parents trust)

Our users are parents, and the readers are 4–8-year-olds. We want parents and children to **come back because the story works**. We do **not** use dark patterns on children: no endless feeds, no fake timers on kids' screens, no loot-box mechanics.

**Build now (small):**
- **Bedtime streak for the parent:** the 7-day plan from the parent guide as a checklist, with "Day 3 of 7 ✓". One WhatsApp or email nudge a day at the time the parent picks.
- **Collect the shelf:** a bookshelf on the child's page with 6 spines. Read ones are coloured, the rest are grey: "Unlock the next story". Each free story leads into the next problem the parent picked.
- **Child-made ending:** at the last page, the child picks a sticker or a "proud face". The parent can share it as an image to WhatsApp, with the GTales link in the corner. This is our main growth loop.
- **Personal cliffhanger:** the back page teases the next story with the child's own name: "Next: Youssef and the Rainbow Kite…"

**Next month:**
- **Referral:** "Give 20%, get 20%". Each parent gets a link, and the friend's first book is discounted.
- **Birthday reminder:** ask the child's birthday month (optional) and send a gift-book offer 3 weeks before.
- **Printed book:** a QR code on the last page opens the parent guide and the next free story.

---

## 5. AI calls in the free tier: decision

**Decision: AI stays OFF in the free tier at launch** (`POLISH_PROVIDER=off`).

**Why:**
- **Quality.** All 12 books are hand-written and tested. The plain fill already reads well, and AI can only change it.
- **Safety.** Any odd AI sentence goes straight to a 4-year-old with no human check.
- **Speed and reliability.** AI adds 2–6 seconds and another thing that can fail on launch day.
- **Cost is *not* the main reason.** A short polish call with a small model costs well under 1 US cent per story. But abuse or a viral spike makes the cost unpredictable.

**When to revisit (after 2 weeks of real data):**
- Turn on AI polish **for paid books only**, checked by the validator in the spec, with a human glance in admin before printing.
- If parents' free-text answers (pet name, place, strength) often read awkwardly in the story, test AI polish on 10% of free stories and compare the share rate and order rate.

---

## 6. Launch-day order

1. Claude Code: Cloudflare (OpenNext) + PDF GitHub Action + events/dashboard → push.
2. Jomana: Cloudflare Worker live on `*.workers.dev`.
3. Jomana: Resend domain verified, email variables set.
4. Jomana: Porkbun nameservers → Cloudflare; `gtales.kids` works over HTTPS.
5. Both: run the bug hunt (section 3) on phones. Fix anything that blocks orders.
6. Delete Vercel.
7. Post the launch (see `docs/MARKETING.md`).
8. Add a worklog line in `docs/CONTEXT.md` for each step.
