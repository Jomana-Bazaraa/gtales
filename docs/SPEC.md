# GTales — Website Specification

Version 1.0 · 10 Oct 2026 · Owner: Ayman Bazaraa
Status: source of truth for Claude Design (screens) and Claude Code (build). When a screen and this file disagree, this file wins; update it first, then the screen.

How to use this file
- Design: every section marked **Screen** lists the exact copy, order and states a board must show.
- Build: every **AC** line (acceptance criterion) is testable. The test checklist in §15 is generated from them.
- Config: anything marked **[config]** lives in Admin → Settings, never hard-coded.

---

## 1. Product

GTales ("Gamified Tales"): personalised, interactive storybooks for children aged 4–8 in which the child is the hero and each tale builds one "superpower" (a strength that answers a real struggle: anger, fear, bullying, lying, big feelings, friendship).

Two offers:

| | Free story | The Series |
|---|---|---|
| Role | A taste. The top of the funnel. | The product. Everything on the site sells this. |
| Personalisation | Text only: name, age, interests, home words | Made from scratch: child's face from a photo in every picture, loved ones with their faces, strengths, struggles, a memory |
| Art | Fixed library art per tale | Created from the photo by our team, checked page by page |
| Format | 3 instant PDFs: story (16 story pages), colouring book, parent guide for that one struggle | 5 printed books (each with some colourable pages) + 1 combined parent guide |
| Price | Free, never capped or advertised as limited | List 949 EGP [config], default promo LAUNCH40 = 40% → 569 EGP, + delivery 69 EGP [config] = 638 EGP, pay on delivery |
| Production | Automatic, ~seconds | Manual by the team, approved page by page on WhatsApp |

Positioning: Series-first. The free story is the fallback, not the headline.
Market: Egypt, English only at launch. Domain gtales.app.

### 1.1 Six tales (launch set)

Display names change; URL slugs and database keys do not.

| Key (unchanged) | Title | Helps with (subtitle) | One-line card copy |
|---|---|---|---|
| anger | Calm | Hitting, shouting, slamming doors | Your child learns the slow breath that cools the heat. |
| anxiety | Courage | Worries, nightmares, clinging | Your child learns to name the worry so it gets smaller. |
| bullied | Standing tall | Being teased, left out, afraid of school | Your child finds a strong voice and a grown-up to tell. |
| lying | Honesty | Small fibs that are getting bigger | Your child learns that the truth is lighter to carry. |
| feelings | Understanding feelings | Meltdowns, tears, not knowing why | Your child learns what each feeling is called and where it lives. |
| friendship | Kindness and friendship | Sharing, taking turns, making friends | Your child learns to share the game, not just the ball. |

AC: every place a tale is named (landing, catalogue, struggle page, both forms, reader, PDFs, admin, emails/WhatsApp templates) uses Title + "Helps with: …". The key never appears in UI.

### 1.2 The five promises

One reusable `<Promises />` component (five icon tiles, full and compact variants). Placed: under the pricing tiers on the landing; struggle page Series band (compact); ready screen Series band (compact); order review step (list form).

| # | Title | Exact copy |
|---|---|---|
| 1 | Review and edit | You approve every page. We send the full story to you on WhatsApp. Ask for changes as many times as you like before anything is printed. |
| 2 | Pay on delivery | Nothing to pay online. Pay the courier when the books are in your hands. |
| 3 | Five books plus a parent guide | Five books, not one. Plus a complete parent guide to help you support your child at home. |
| 4 | Truly crafted for your child | Made only for your child. Their face, their name, their people, their struggle, the things they love and the adventure they dream of. |
| 5 | Interactivity | A story they play, not just read. Riddles, mazes, choices and breathing games the hero can't finish without your child. |

Decision (10 Oct): **no money-back guarantee and no refuse-at-door clause.** The parent approves every page before printing; that is the protection. The words "money back", "refund", "guarantee" must not appear anywhere on the site.

---

## 2. Global rules (apply to every screen, every PDF, every message)

1. **No "psychology".** The word never appears. "Expert-reviewed" is allowed only once a named expert has actually reviewed the content (open decision, §16). Until then: "A parent guide for this struggle."
2. **No hand-drawn claims.** Never "illustrator", "by hand", "drawn". Use: "We create the illustrations from your photo, and our team checks every page."
3. **Never cap or advertise free stories.** No "one free story", no "unlimited". Say "a free story". Backend rate limit [config, default 10 stories / hour / device] is silent; on hit, show "Please try again in a little while."
4. **Positive framing.** Tales are named by the strength (§1.1); the problem is the subtitle.
5. **Images match words.** Alt text describes what the adjacent copy says. Missing art → neutral block "IMAGE NEEDED: <description>", never a mismatched picture.
6. **No fake content.** Reviews section hidden until 3 real reviews with written permission. No placeholder names, cities or quotes on the live site. Sample data in designs is labelled.
7. **Shorter page.** Each section answers the parent's next question once. Nothing repeats.
8. **Buttons:** short, encouraging, no child names, no essays underneath. Primary CTA everywhere: "Create your child's books". Secondary: "Try a free story".
9. **Words:** "approval", not "proof". "Our team", not "AI". "Tale" for a story in the Series, "story" for the free one. "Superpower" for the strength.
10. **Mobile first.** Every page is designed at 390 px and must pass §14.4 before desktop is considered done.

---

## 3. Brand and design system

Design system artifact: GTales (Claude Design, namespace `gtales`, `tokens.json` v2). Code mirrors it in `src/app/globals.css` as CSS variables.

Colours: surface #ffffff · surface-tint #f3f1ff · ink #1e1b4b · ink-soft #5b5880 · line #e4e1f5 · flame #ff5c1f · flame-deep #e03e0f · flame-soft #ffe8dd · cta #ff8a1f (text ink, shadow 0 4px 0 #d96a00) · sky #2f4bff (shadow #2238c2) · sky-soft #e6ebff · sun #ffcf3d · sun-soft #fff6d6 · mint #0b7a5f · mint-soft #d9f7ec · danger #c81e3a · night #141233.
Reader paper: #fbf5e9, text #3d2b1f.

Type: Fredoka (display, 400–700), Nunito (body, 400–900), Andika (reader and PDFs, 400/700).
Buttons: 48 px high, `box-sizing: border-box`, pill radius, 800 weight 16 px. Cards: radius 28 (desktop) / 20–24 (phone), solid 3 px underline shadow in `line`. Chips: 44 px min height, pill, selected = flame border on flame-soft (struggles) / mint (strengths) / sky (moments).
Logo: wordmark "GTales" in Fredoka, G in flame. Slogan: "Your child is the Hero. Each tale unlocks a Superpower."

AC: no colour outside the token list; no dark-brown shadow under purple; all buttons measure 48 px in the DOM.

---

## 4. Information architecture and routes

| Route | Screen | Auth |
|---|---|---|
| `/` | Landing | – |
| `/tales` | Catalogue | – |
| `/tales/[key]` | Superpower (struggle) page | – |
| `/create?tale=key&ref=` | Free story form (8 steps) | – |
| `/story/[id]` | Ready screen | link holder |
| `/story/[id]/read` | Reader | link holder |
| `/story/[id]/pdf/(story|colouring|guide)` | PDF download | link holder |
| `/order?story=id` | Series order form (15 steps) | – (account created at submit) |
| `/order/[id]/confirmed` | Confirmation | link holder |
| `/signin` | Sign in (WhatsApp code / email link) | – |
| `/my-stories` | Profiles, downloads, order tracking | signed in |
| `/admin/*` | Orders, Free stories, Stats, Feedback, Settings, Promo codes | admin (single account) |
| `/privacy` | Privacy | – |

Every public page: `<title>`, meta description, OG image, canonical, `lang="en"`. Nav (desktop): How it works · Meet the book · Superpowers · Pricing · FAQ · "Try a free story" ghost · "Create your child's books" CTA. Phone: logo + CTA; sections reached by scrolling.

---

## 5. Screen: Landing (`/`)

Seven sections, same order desktop and phone. Phone target: ≤ 5,200 px total height at 390 px wide (measured 5,079 px on 10 Oct with readable type; the design board reached 3,700 px only with smaller type).

0. **Promo bar** (dismissible, [config] text): "Launch offer: 40% off the printed Series with LAUNCH40 · Pay on delivery".
1. **Hero.** H1 "A personalised storybook where your child is the hero." Subline "The only story where they see their own name, and their own face, on every page. Each tale unlocks a superpower." Buttons: CTA + "Try a free story". Trust line: "Ages 4–8 · You approve every page · Pay on delivery". Visual: three fanned book images (cover front, two story pages behind). No photo-to-hero transition.
2. **How it works.** H2 "Four steps to five printed books". Four steps as coloured icon tiles (flame-soft, sky-soft, sun-soft, mint-soft) with a small ink number badge, joined by a dashed line (desktop) or stacked (phone). The time pill sits directly under the tile so all four align. No large numerals.
   - 10 minutes · Tell us about your child · "Name, photo, their people, what's hard right now."
   - 5 days · We create their story · "Five tales with their face in every picture."
   - Until it's perfect · You approve every page · "On WhatsApp. Change anything you like."
   - 5 days after approval · Delivered to your door · "Five printed books. Pay the courier."
3. **Meet the book.** H2 "Adam, 6, Maadi. His superpower: Calm." Four equal real pages (cover, story page, "Your turn" page, certificate). Six feature tiles: The hero · The superpower · Their world · Their people · Play pages · Read or listen (copy as on board). Button "Read Adam's story" → reader. Phone: 2×2 images, one paragraph, button.
4. **Six superpowers.** Night background, H2 "Six tales. Six superpowers.", subline "Every tale helps your child grow one strength. Pick the five that matter most." Six cards (3×2 desktop; horizontal swipe strip of 150 px cards on phone): cover image, Title, "Helps with: …", one line, "Free story →". Footnote "Ages 4–8. New superpowers are added every month."
5. **Pricing.** H2 "Start free. Keep the printed books forever." Two tier cards styled like a pricing page, **not** a comparison table:
   - Free story (left, surface-tint, muted): "A taste, in two minutes", "Free", ✓ name/interests/home words · ✓ interactive pages · ✓ 1 story PDF + colouring book + parent guide · ✗ standard pictures, not your child's face · ✗ ready-made tale · ✗ digital only. Ghost button "Try a free story".
   - The Series (right, wider, flame border, tag "The Series · printed · most loved"): "Five printed books + a complete parent guide", 949 struck → 569 EGP, LAUNCH40 pill, "+ 69 EGP delivery · pay on delivery", eight ✓ rows (face from photo, loved ones' faces, written from scratch, family memory, interactive pages, five printed books delivered, one complete guide, approve every page on WhatsApp), CTA, line "You approve every page before we print".
   - Below: `<Promises />` full (desktop grid of 5 / phone swipe strip).
6. **Reviews.** Hidden until 3 real reviews with permission [config toggle].
7. **FAQ + final CTA.** Collapsed rows, first open. Questions: How do you make the pictures? · What if I don't like something? ("You approve every page before printing, and you pay only on delivery. Nothing is printed until you say it's perfect.") · Is the free story the same book? · When do I pay? · What happens to the photo? Final band "Ready to make your child the hero?" with both buttons. Footer: logo, Privacy, WhatsApp, Instagram.

AC: Lighthouse mobile ≥ 90 performance, ≥ 95 accessibility; phone height ≤ 5,200 px; no horizontal scroll; H1 is the only `<h1>`; every image has alt text matching its caption.

---

## 6. Screens: Catalogue and Superpower page

**Catalogue `/tales`.** H1 "Which superpower does your child need right now?" Intro "Every superpower has a free story, a colouring book and a parent guide. Pick one and your child's story is ready in two minutes." Age filter (4–5 / 6–8 / all). Six cards as §5.4. Series band: compact `<Promises />` + "Five printed books with your child's face in every picture." + CTA.

**Superpower page `/tales/[key]`.** H1 = Title, "Helps with …" beneath. What's inside (story, colouring book, "A parent guide for this struggle"). Sample pages. Button "Try a free story" → `/create?tale=key`. Series band "Make it truly theirs": four icon rows (face + loved ones in every picture · built around strengths, not just a name · a memory turned into a tale · five books + complete guide), price block (949 struck / 569 / LAUNCH40 / pay on delivery), compact promises, button "See the Series".

---

## 7. Free story form (`/create`, 8 steps)

One question per screen, progress bar, auto-save to localStorage, back always available, footer "No photo, no address."

| Step | Asks | Validation |
|---|---|---|
| 1 | Which superpower should this story build? (six Title + Helps-with cards; pre-selected from `?tale=`) | required |
| 2 | The hero's name (tip: the name they like to be called) + age (4–8) + boy/girl/prefer not to say | name 2–20 chars |
| 3 | Who goes on adventures with them: a friend, sibling, cousin or pet (optional) | – |
| 4 | A place they love (chips + text) | required |
| 5 | Favourite food (chips + text) | required |
| 6 | Home words: a phrase you say to them, a phrase they say (optional) | – |
| 7 | What they're good at (chips + text) | required |
| 8 | Parent's first name + WhatsApp number or email (to send and save the story) | phone or email, one required |

Submit → generate → Ready screen in ≤ 10 s (p95). Rate limit per §2.3. Event `free_story_generated` with generation time.

**Ready screen `/story/[id]`.** Cover, "Adam's story is ready", buttons: Open the story (sky), Story PDF, Colouring PDF, Parent guide; "Make a story for another child" (ref=share). Series band identical to §6 superpower page. No "Reviewed by experts" line.

---

## 8. Reader and PDFs

**Reader `/story/[id]/read`.** Cream paper #fbf5e9 with faint dot texture, Andika 20–22 px / 1.6, text #3d2b1f. Illustration on top (rounded 18 px), text below, page number "— 4 —" centred. Chrome hidden; thin top bar on tap (close, title, "Read to me"). Navigation: swipe or tap edges, small arrows left/right, page-turn animation ≤ 300 ms. "Read to me": Web Speech API `speechSynthesis` at rate 0.85 with word highlighting (sentence fallback); auto-advance off by default. Challenge ("Your turn") pages: choice/maze/riddle; on correct answer show stars + short sound; progress saved.
AC: works offline after first load (service worker caches the 16 pages); font size adjustable (A−/A+); keyboard arrows work.

**PDFs.** Rendered by headless Chrome from print CSS (`src/lib/pdf.ts`, `scripts/pdf.mts`). Page size A4 portrait for the free story [config]; print trim for the Series is the team's decision and is never shown on the site.
- Story PDF: cover ("starring Adam"), dedication, 16 story pages (full-bleed art, text on cream, page numbers, no UI), challenge pages converted to print activities, "The End", certificate.
- Colouring PDF: same layout, line art.
- Parent guide PDF: team-authored per tale, child's name merged in.
AC: fonts embedded; images complete before print (fonts.ready + image.complete); file < 15 MB; no app chrome visible.

---

## 9. Series order form (`/order`, 15 steps)

Auto-saves per step (server-side draft keyed by phone once given, localStorage before). Optional fields say "optional". Every step is one screen on a phone. Progress "Step n of 15" + bar.

| Step | Screen | Asks | Notes |
|---|---|---|---|
| 1 | What's hard for Adam right now? | "Adam struggles with…" chips (Anger and tantrums · Hitting or pushing · Worries and fears · Nightmares · Being teased or bullied · Lying or hiding things · Big feelings, meltdowns · Sharing and taking turns · Making friends · Shyness · Fighting with siblings · Something else). "When does it usually happen?" moment chips (Bedtime · Mornings · When losing a game · With siblings · At school · Screen time ends · New places) + free line. "What calms Adam when it happens?" chips (A hug · Quiet time alone · Counting or breathing · Talking it through · A favourite toy · Not sure yet) + free line. | ≥ 1 struggle required. Feeds tale selection and guide. |
| 2 | What is Adam great at? | "Adam is…" chips (A builder · Funny · Curious · Kind to animals · A fast runner · Good at drawing · A helper at home · Brave · A great big brother/sister · Loves to sing · Something else). "A moment you were proud of Adam" (textarea). "What makes Adam laugh?" | ≥ 1 strength. Powers the turning point. |
| 3 | Choose the five tales | Six tale cards; free story's tale pre-selected; exactly 5 | required |
| 4 | Hero basics | Name, nickname, age, boy/girl, "three words that describe them" | pre-filled from free story |
| 5 | Hero photos | One clear face photo (required), one full-body (optional), photo tips | ≤ 10 MB, jpg/png/heic |
| 6 | Their people | Up to 3: name, relation chips (Brother · Sister · Mama · Baba · Teta · Geddo · Friend · Pet), photo, one detail. Consent checkbox. | optional |
| 7 | Their world | Toys, games, foods, colours, animals, places, bedroom/neighbourhood — chips + text | – |
| 8 | Dream adventure | Picture cards: space · jungle · under the sea · ancient Egypt · magic forest · city of blocks · something else; dream role: explorer · inventor · captain · builder | required |
| 9 | Home words | What you say to them, what they say, family nicknames | – |
| 10 | The memory | A real memory or one to create together | optional |
| 11 | Reading | Reads alone / read to; English first or second language; favourite activities (mazes, riddles, colouring, breathing games, counting) | – |
| 12 | Dedication | Text, ≤ 200 chars | optional |
| 13 | Delivery | Parent name, WhatsApp number (E.164, Egypt default), address (governorate, city, street, building, landmark), best time to message | required |
| 14 | Promo code | Default LAUNCH40 pre-applied; field to change | validated server-side |
| 15 | Review and confirm | Summary of all steps (editable links), price box (949 / −380 / +69 / **638 EGP pay on delivery**), `<Promises />` list, button "Confirm my order" | – |

Submit → creates account if none (phone), order status `Ordered`, WhatsApp template "We've got Adam's order…", Confirmation screen (order number, 4 next steps: being made ≈ 5 days → your approval on WhatsApp → print and deliver ≈ 5 days after approval → pay 638 EGP to the courier, cash or card).
AC: leaving and returning restores the draft; a reorder from My stories pre-fills steps 1–4, 6–12 and 13 (photos always re-asked, §12.2).

---

## 10. Accounts, sign-in, My stories, order tracking

**Principle:** no passwords. Identity = WhatsApp number (the number we already use for approvals). Email magic link as fallback.

- A free story needs no account. The Ready link is the access token for that story.
- An account is created silently at the first Series order (or when a parent chooses "Save my stories" on free form step 8).
- **Sign in `/signin`:** enter number → 4-digit code by WhatsApp (valid 10 min, 5 attempts) → session cookie 90 days. "Use email instead" sends a magic link.
- **My stories `/my-stories`:**
  1. Saved hero profile card per child (photo while an order is open, name, age, place, favourites, loved ones) with Edit, **Order again** (pre-fills the order form) and **New free story**.
  2. Order tracker per order: Ordered → Being made → Your approval → Printing → Delivered, with date, what happens next, "Message us" (WhatsApp deep link) and "Edit address" (allowed until Printing).
  3. Free stories list: Open, Story PDF, Colouring, Guide.
- Status changes are pushed to the parent on WhatsApp (template per status) and visible on the tracker; the two never disagree (single `orders.status` field).

Order statuses (short list, one admin): `ordered` → `being_made` → `awaiting_approval` (sub-flag `edit_requested`) → `approved` → `printing` → `shipped` → `delivered_paid` | `cancelled`.

---

## 11. Admin (`/admin`, single account)

Tabs: Orders · Free stories · Stats · Feedback · Settings · Promo codes.
- **Orders:** table (order, child, five tales, parent, photo thumbnail, status, total); detail view shows every field from §9 including loved-ones' photos; status buttons advance the pipeline and send the WhatsApp template; notes; courier confirmation upload.
- **Free stories:** list with tale, date, device, generation time, PDF downloads.
- **Stats:** see §13.
- **Feedback:** every response with date, tale, child emoji, parent answers, one-week follow-up, quote permission.
- **Settings [config]:** list price, delivery fee, default promo, rate limit, promo-bar text, reviews-visible toggle, production/delivery day estimates, WhatsApp number.
- **Promo codes:** code, % or fixed, start/end, max uses, active.

---

## 12. Data, privacy and retention

**12.1 Tables (Supabase/Postgres):** `stories` (free), `orders`, `order_people`, `profiles` (parents), `heroes` (saved children), `events`, `feedback`, `promo_codes`, `settings`, `admin_users`.
**12.2 Photos:** stored in private bucket, signed URLs only; hero and loved-ones photos deleted automatically when an order reaches `delivered_paid` or `cancelled` (cron, daily), and the deletion logged. Reorders therefore re-ask for photos. Privacy page states this in plain words.
**12.3 Events never contain** child names, photos or phone numbers.
**12.4 Free-story PDFs** kept 12 months then deleted; the Ready link says so.
**12.5 Consent:** checkbox copy on photo steps: "I have permission to use these photos. They are used only to create the pictures and deleted when the books are delivered."

---

## 13. Tracking and stats

**Events table:** id, created_at (server), event, visitor_id (cookie), session_id, story_id | order_id, tale (key), step, ref, device, page, meta (json).

| Area | Events |
|---|---|
| Visits | page_view(page), cta_click(button, section) |
| Free story | free_form_started, free_form_step(1–8), free_story_generated(ms), free_story_failed(reason), rate_limited |
| Reading | story_opened, page_viewed(1–16), challenge_completed, story_finished, audio_played, pdf_downloaded(story|colouring|guide), share_clicked |
| Series | series_cta_clicked(location), order_form_started, order_form_step(1–15), order_submitted, promo_applied(code) |
| Account | signin_code_sent, signin_success, reorder_started |
| Fulfilment | status_changed(from, to), approval_sent, edit_requested, approved, shipped, delivered_paid, cancelled |
| Feedback | feedback_submitted, followup_answered |

**Ref tags:** `?ref=wa-group-<name>`, `?ref=counselor-<school>`, `?ref=instagram`, `?ref=share`; first ref per visitor stored and attached to every story and order.

**Stats tab:** counters today / 7 days / all time (visitors, free stories, stories finished, PDFs downloaded, Series orders, delivered and paid, reprints); funnel visitors → free form started → story generated → story finished → Series button clicked → order submitted → delivered and paid with drop-off %; breakdown by ref and by tale; feedback list; CSV export of events, orders, feedback. Vercel Analytics on as an independent visitor count.

---

## 14. Non-functional requirements

14.1 **Performance:** landing LCP < 2.5 s on 4G; images AVIF/WebP with width descriptors; fonts preloaded (Fredoka, Nunito; Andika only on reader/PDF routes).
14.2 **Accessibility:** WCAG 2.1 AA; all chips are real buttons with `aria-pressed`; focus visible; colour contrast ≥ 4.5:1 for text (cta text is ink on #ff8a1f); reader supports 200 % zoom.
14.3 **Reliability:** generation retries once; failures logged with reason; admin alerted by WhatsApp on `free_story_failed` spike (> 5 in 10 min).
14.4 **Mobile checks (every page):** 390 × 844 viewport; no horizontal scroll; tap targets ≥ 44 px; sticky bottom CTA on forms; keyboard does not cover the active field; landing ≤ 5,200 px.
14.5 **Security:** admin behind sign-in + 2FA code; rate limits on sign-in codes (5/hour/number) and free stories (§2.3); signed photo URLs expire in 1 h; CSP; no secrets in client.
14.6 **Content safety:** generated text passes a banned-words filter and is re-checked by the team before any Series page is sent for approval.
14.7 **Internal studio:** the image pipeline stays an internal CLI under `src/studio/` behind `STUDIO_ENABLED`, never exposed on the public site.

---

## 15. Test checklist (derive from the ACs)

- [ ] Grep the build output for: psycholog, illustrator, hand-drawn, by hand, unlimited, one free story, money back, refund, guarantee, proof → zero hits.
- [ ] Every tale shows Title + Helps-with on landing, catalogue, tale page, both forms, reader, PDFs, admin.
- [ ] Prices read from Settings: change list price to 999 and delivery to 79 → every page updates, order review totals 678 with LAUNCH40.
- [ ] Promo bar text, reviews toggle and rate limit are editable in Settings and take effect without deploy.
- [ ] Landing phone height ≤ 5,200 px; no horizontal scroll at 320, 390, 430 px.
- [ ] How-it-works time pills align horizontally on desktop; no numeral larger than the badge.
- [ ] Pricing shows two tier cards (no table); Series card visually dominant; Free card lists three ✗ rows.
- [ ] Free form: 8 steps, refresh mid-way restores answers, story ready ≤ 10 s, three PDFs download and open.
- [ ] Rate limit: 11th story in an hour from one device shows the soft message, never a number.
- [ ] Reader: cream paper, Andika, swipe + edge tap + arrows + keyboard; Read to me highlights words; challenge page celebrates on correct answer.
- [ ] PDF: A4, fonts embedded, no UI chrome, images complete, certificate last.
- [ ] Order form: 15 steps, step 1 has struggles + "when" + "what calms", step 2 has strengths; exactly five tales enforced; photo required; consent required when loved-one photos added; review shows 949 / −380 / +69 / 638.
- [ ] Order submit creates account, sends WhatsApp template, confirmation lists four next steps with "5 days" wording.
- [ ] Sign in by WhatsApp code and by email link; wrong code 5× locks for 10 min.
- [ ] My stories: profile card, Order again pre-fills steps, tracker matches admin status within 5 s of change, WhatsApp message sent per status.
- [ ] Photos deleted on delivered_paid / cancelled; deletion row in events.
- [ ] Every event in §13 fires with correct fields; no child name/phone/photo in any event row.
- [ ] Stats funnel numbers equal counts from the CSV export.
- [ ] Alt text audit: every image's alt matches adjacent copy; IMAGE NEEDED blocks only where art is missing.
- [ ] Lighthouse mobile: perf ≥ 90, a11y ≥ 95, SEO ≥ 95 on `/`, `/tales`, `/tales/anger`.

---

## 16. Open decisions

| # | Decision | Owner | Default until decided |
|---|---|---|---|
| 1 | Has a named expert reviewed the guides? If yes, "Expert-reviewed by <name, title>" may appear. | Ayman | Not shown |
| 2 | Covers for the five tales other than Calm | Team | IMAGE NEEDED blocks |
| 3 | Series print trim size and paper | Team | Not shown on site |
| 4 | WhatsApp Business API vs manual WhatsApp for templates | Ayman | Manual with deep links; templates stored in admin |
| 5 | Email magic link provider | Build | Supabase auth OTP |

Changelog
- 1.0 (10 Oct 2026): first consolidated spec. Price 949/569/69, no refund, 15-step order form (struggles and strengths split), passwordless sign-in and order tracker, how-it-works tiles, tier cards instead of comparison table.
