Build the GTales parent form. It collects the values that `template/render.js` puts into the story (`form.name`, `form.sidekick`, and so on). Read `stories/*.json` first: each story's `uses` list says which fields that story needs. Only show those fields.

## Who fills it in

Egyptian parents of children aged 4–8. Many read English as a second language, and most will use a phone. So:

- One question per screen, with a progress bar ("3 of 9").
- Short, everyday English. No product words like "sidekick", "Power Word" or "personalization".
- Every question shows an example, so the parent knows what a good answer looks like.
- Big tap targets (at least 48 px). Choices are tappable cards, not dropdowns.
- Show a live preview of the book cover with the child's name as soon as the name is filled in.

## The questions, in this order

Use the exact wording below. `→` shows how each answer is saved.

### 1. Struggle (picks the story)

**What would you like help with right now?**

Cards, one choice: Anger and hitting (`anger`) · Fears and worries (`worry`) · Being bullied (`bullied`) · "coming soon" cards for the rest, greyed out → picks `stories/<slug>.json`

### 2. Child's name → `name`

**What's your child's name?**

Example in the box: `e.g. Adam, Jana, Yassin`
Rules: 1–14 letters, written in English letters. Capitalize the first letter automatically. If they type Arabic letters, show: "Please write the name in English letters, like Mariam."

### 3. Boy or girl → `gender`

**Is your child a boy or a girl?**

Two cards: Boy · Girl. (This picks the pictures and he/she in the story.)

### 4. Age → `age`

**How old is your child?**

Five round buttons: 4 · 5 · 6 · 7 · 8

### 5. Where you live → `place`

**Where do you live?**

Free text. Example in the box: `e.g. Maadi, Zamalek, Smouha, Sheikh Zayed`
Help line: "Your area or city. It will appear in the story."
Rules: 2–20 characters, English letters.

### 6. Someone from home or school → `other`

The question changes with the story. Always free text, 1–14 letters.

- **Anger and hitting, Fears and worries:**
  **Who is often with your child at home?**
  Example: `e.g. his brother Omar, her sister Lina, cousin Yousef` → save only the name.
  Ask "Brother, sister or cousin?" as small chips above the box (saved for later, not used in the text yet).

- **Being bullied:**
  **What name should we use for the child who is unkind?**
  Help line: "You can use a made-up name. It does not have to be the real child."
  Pre-fill with a made-up name (`Sam`) the parent can change.

### 7. Favourite friend, pet or toy → `sidekick`

**What's the name of your child's favourite toy, pet or best friend?**

Example: `e.g. Teddy, Lucky, Bolt, Ziad`
Help line: "In the story, a little robot friend will have this name."
Rules: 1–12 letters. If left empty, use `Bolt`.

### 8. Words that make them feel strong → `power_word`

**What does your child say to feel strong or brave?**

Tappable examples (tap fills the box, editable):
`I'm Superman!` · `I'm a lion!` · `I'm a genius!` · `I can do it!` · `Yalla, hero!` · `I'm strong!`
Help line: "Your child will say this out loud in the story, at the brave moment."
Rules: 2–24 characters. Add `!` at the end if there's no punctuation.

### 9. What helps when they're upset → `need`

Only for stories whose `uses` includes `need`.

**When your child is sad or in a bad mood, what helps most?**

Cards, one choice. Each card saves a short sentence the child says in the story:

| Card label | Saved as `need` |
|---|---|
| A hug | `I need a hug.` |
| Talking about it | `I need to talk.` |
| Some time alone | `I need some quiet time.` |
| Doing something else for a bit | `I need to do something else for a bit.` |
| Having you close by | `I need you to stay with me.` |
| Their favourite toy or blanket | `I need my teddy.` |

### 10. What they're great at → `strength`

**What is your child great at?**

Cards, one choice. The story ends with "Best ___ in Maadi", so each card saves a noun:

| Card | Saved as `strength` |
|---|---|
| Drawing | `artist` |
| Football | `football player` |
| Building and Lego | `builder` |
| Swimming | `swimmer` |
| Dancing | `dancer` |
| Reading | `reader` |
| Singing | `singer` |
| Helping others | `helper` |
| Running | `runner` |
| Something else | free text, must fit "Best ___", e.g. `chess player` |

### 11. Dedication (optional)

**Would you like to add a message for your child?**

Example: `For Adam, who builds the tallest towers. We love you. Mama & Baba`
Max 120 characters. Skip button is as big as Next.

### 12. Email

**Where should we send the story?**

## Rules for every field

- Trim spaces. Never allow empty values for fields the story uses (use the defaults above where given).
- Check every free-text answer (name, place, other, sidekick, power word, "something else", dedication) for rude or unsafe words in English and Franco-Arabic. If found, show "Please choose another word." Never print it.
- Never ask for a phone number, school name or photo in the free story.
- The `ask` field is gone. The last-page lines are now written into each story, so do not add it back.
- Save progress in the browser so a parent who leaves can continue.

## Review screen

Before making the book, show one screen that reads like a sentence the parent can check:

> **Adam**, 6, lives in **Maadi**. His robot friend is called **Bolt**. When he wants to feel strong he says **"I'm Superman!"**. When he's upset, **a hug** helps most. He's great at **building**.

Each bold part is tappable to go back and edit. Button: **Make Adam's story**.

## Done means

- The form works one-handed on a 390 px wide phone.
- Each story only asks the questions in its `uses` list.
- The values feed `renderBook()` with no missing tokens, for every story, boy and girl (where that image set exists).
- Show me screenshots of every step on a phone.
