Read README.md first, then open the demo files in template/ and the PDFs in reference/ so you know what a finished book looks like. Ask me before changing anything in template/ or stories/.

You are adding personalized book generation to the GTales app.

## What already works (do not rebuild it)

- `template/render.js` has `renderBook(story, form, { imageBase })`, which returns the book's HTML, and `fitPages(root)`, which sizes each picture. It throws an error if any `{{token}}` is missing. Keep that behavior.
- `template/book.css` is the final design. Do not restyle it.
- `stories/anger.json`, `worry.json`, `bullied.json`, `lying.json`, `feelings.json` and `friendship.json` are finished story data. All six stories have boy and girl images (12 sets). Keep the "coming soon" fallback for any future story/gender without images.
- If an image set is missing, that story/gender is "coming soon" in the app. Do not substitute the other gender's pictures.

## Clean-up from the old version

- The `ask` field is removed for good. The stories here have no `{{ask}}` and no `ask_choices`. Delete any fallback that fills `{{ask}}`, and remove `ask` from the form, the form object and validation.
- Replace any older copies of `stories/*.json` with the ones in this folder.

## What to build

1. **Form → values.** Build the parent form exactly as described in `FORM_PROMPT.md`. It produces the `form` object: `name`, `gender` (`boy`|`girl`), `age` (4–8), `place`, `other`, `sidekick`, `power_word`, `need`, `strength`. Only show the fields listed in the story's `uses`.
2. **Images.** Use `images/<slug>/<gender>/`. If a girl set is missing, show an error. Never use the boy pictures for a girl.
3. **Screen version.** Render the book in the app. Make challenge options tappable and show each option's `response`. For `steps` and `boxes` challenges, show the `done` text when all are ticked.
4. **PDF version.** Render the same HTML with Playwright: A4, `printBackground: true`, zero margins, `preferCSSPageSize: true`. Wait for `document.fonts.ready`, then call `fitPages`, then print. Output 17 pages: cover, 15 story pages, back cover.
5. **Optional AI polish.** One call per book, off by default (`POLISH_PROVIDER=off|claude|gemini`), only to fix grammar around inserted values. Validate the result: same pages, same challenges, same answers, names unchanged, no sentence over 14 words. If any check fails, use the unpolished version. Never send the parent's email or phone.

## Tests (must pass before you show me anything)

- For all 6 stories, render both genders with these names: "Karim", "Jana", "Abdelrahman", "Lulu".
- No `{{` or `}}` left in any output, and no `undefined` anywhere.
- The girl book has "she/her" everywhere the boy book has "he/his", and nowhere else. For example, "Where he goes" on page 6 is about the Big Shadow and must stay "he".
- `fitPages` logs no "too much text" warnings.
- Make the PDF and put page 1, 8 and 12 side by side with the same pages of the matching PDF in `reference/` (boy and girl). The layout must match.

- The anger boy pictures are square; `fitPages` crops them, which is expected.

Show me one boy PDF and one girl PDF when done.
