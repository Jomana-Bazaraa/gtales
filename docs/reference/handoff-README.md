# GTales handoff pack

Everything Claude Code needs to build personalized books. Open `template/demo.html` in a browser to see a working book.

## What's inside

```
gtales-handoff/
  README.md                  this file
  CLAUDE_CODE_PROMPT.md      paste this into Claude Code
  stories/
    worry.json               Story 2, finished. The other stories follow the same format.
  images/
    worry/boy/               cover.jpg, p01.jpg ... p15.jpg, back.jpg
  template/
    book.css                 the page design (A4, picture on top, text at the bottom)
    render.js                fills the story with the form values and builds the pages
    demo.html                working example with (Name)-style placeholders
    fonts/                   Literata and Fredoka, embedded so print looks the same everywhere
  reference/
    worry-boy-template.pdf   what the finished book must look like
```

## Rules

1. **The JSON is the only source of story text.** Never copy text out of the PDF or the doc.
2. **The template is the only source of design.** Claude Code reuses `book.css` and `render.js`. It does not redesign pages.
3. **The PDF is only a picture to compare against.** Every new book must look like it.
4. **Images are found by name.** Each book uses `images/<story>/<boy|girl>/cover.jpg`, `p01.jpg` to `p15.jpg` and `back.jpg`.

## Image sizes

| Image | Ratio | Size (px) | Why |
|---|---|---|---|
| Story pages | 4:5 portrait | 2480 × 3100 | The picture box is about 216 × 238 mm. A 4:5 image fills it with almost no cropping. |
| Front and back cover | 5:7 portrait | 2480 × 3508 | Full A4 page with bleed |

Add these lines to every Gemini prompt:

- *"Portrait 4:5."*
- *"Keep the main characters in the middle, away from the left and right edges."*
- *"Keep the bottom fifth simple (floor, ground or sand), because it fades into white."*
- *"Covers: keep the top third simple sky for the title."*

Gemini usually makes about 1024 px images. Before printing, enlarge them with an upscaler (for example Upscayl, which is free) to the sizes above.

## Story JSON format (short version)

- `{{name}}`, `{{age}}`, `{{place}}`, `{{other}}`, `{{sidekick}}`, `{{power_word}}`, `{{need}}`, `{{ask}}`, `{{strength}}` are form values.
- `{{he}}`, `{{him}}`, `{{his}}`, `{{He}}`, `{{His}}` are the hero's pronouns. The renderer swaps them for girls.
- `(Other)` never gets a pronoun.
- `**bold**` inside a step becomes bold text.
- Challenge types: `choice`, `riddle`, `steps`, `boxes`.
