/**
 * fillStory — docs/SPEC.md §7.3. Pure, no AI, always works.
 * Replaces every {{token}} in a story with the form values and returns the finished story.
 * Throws if a token is left over or a used value is empty: never a book with a hole in it.
 */
import { PRONOUNS, TOKENS, type Challenge, type FilledStory, type StoryForm, type StoryJson, type Token } from "./schema";

export class FillError extends Error {
  constructor(message: string, public readonly token?: string) {
    super(message);
    this.name = "FillError";
  }
}

const AGE_WORDS: Record<number, string> = { 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine" };

export function ageInWords(age: number, half = false): string {
  const w = AGE_WORDS[age];
  if (!w) throw new FillError(`Age ${age} is out of range`, "age");
  return half ? `${w} and a half` : w;
}

/** "adam" → "Adam", "abdel rahman" → "Abdel Rahman", "lulu-mae" → "Lulu-Mae". */
export function capitaliseName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.split("-").map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join("-"))
    .join(" ");
}

/** One rule everywhere: names ending in s take a bare apostrophe ("Wrecks'"), others "'s". */
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

const PRON: Record<"boy" | "girl", Record<(typeof PRONOUNS)[number], string>> = {
  boy: { he: "he", him: "him", his: "his", He: "He", Him: "Him", His: "His" },
  girl: { he: "she", him: "her", his: "her", He: "She", Him: "Her", His: "Her" },
};

function upperFirst(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Is the character index `i` at the start of a sentence? */
function atSentenceStart(text: string, i: number): boolean {
  let j = i - 1;
  while (j >= 0 && /[\s"“‘'(]/.test(text[j])) j--;
  if (j < 0) return true;
  return /[.!?…]/.test(text[j]);
}

export function fillText(text: string, values: Record<string, string>, pron: Record<string, string>): string {
  // possessives first: {{name}}'s → Adam's / Wrecks'
  let out = text.replace(/\{\{(name|other|sidekick)\}\}'s/g, (_m, t: string) => {
    const v = values[t];
    if (!v) throw new FillError(`Missing value for ${t}`, t);
    return possessive(v);
  });
  out = out.replace(/\{\{(\w+)\}\}/g, (m, t: string, offset: number) => {
    if (t in pron) return atSentenceStart(out, offset) ? upperFirst(pron[t]) : pron[t];
    if (!(TOKENS as readonly string[]).includes(t)) throw new FillError(`Unknown token ${m}`, t);
    const v = values[t];
    if (!v) throw new FillError(`Missing value for ${t}`, t);
    return atSentenceStart(out, offset) ? upperFirst(v) : v;
  });
  if (/\{\{|\}\}/.test(out)) throw new FillError(`Leftover token in: ${out.slice(0, 60)}`);
  return out;
}

export function fillStory(story: StoryJson, form: StoryForm): FilledStory {
  const values: Record<Token, string> = {
    name: capitaliseName(form.name),
    age: ageInWords(form.age, form.half),
    place: form.place.trim(),
    other: form.other ? capitaliseName(form.other) : "",
    sidekick: form.sidekick ? capitaliseName(form.sidekick) : "",
    power_word: (form.power_word ?? "").trim(),
    need: (form.need ?? "").trim(),
    ask: (form.ask ?? "").trim(),
    strength: (form.strength ?? "").trim().toLowerCase(),
  };
  for (const t of story.uses) {
    if (!values[t]) throw new FillError(`The story needs ${t.replace("_", " ")}`, t);
  }
  if (story.other_rule === "not_sibling" && form.other_relation && ["brother", "sister"].includes(form.other_relation)) {
    throw new FillError("In this tale the other child must be from school or the park", "other_relation");
  }

  const pron = PRON[form.gender];
  const f = (s: string) => fillText(s, values, pron);
  const fillChallenge = (c: Challenge | null): Challenge | null =>
    c && {
      ...c,
      tag: c.tag ? f(c.tag) : c.tag,
      question: f(c.question),
      done: c.done ? f(c.done) : c.done,
      riddle: c.riddle?.map(f),
      options: c.options?.map((o) => ({ ...o, label: f(o.label), response: f(o.response) })),
      steps: c.steps?.map(f),
      line: c.line ? f(c.line) : c.line,
    };

  return {
    ...story,
    title: f(story.title),
    back_blurb: story.back_blurb.map(f),
    need_choices: story.need_choices.map(f),
    ask_choices: story.ask_choices.map(f),
    pages: story.pages.map((p) => ({
      ...p,
      text: p.text.map(f),
      sign: p.sign ? f(p.sign) : null,
      screen: p.screen ? f(p.screen) : p.screen,
      challenge: fillChallenge(p.challenge),
    })),
    gender: form.gender,
    polished: false,
  };
}

/** Every string in a story, for validation and length checks. */
export function storyStrings(s: StoryJson): string[] {
  const out: string[] = [s.title, ...s.back_blurb];
  for (const p of s.pages) {
    out.push(...p.text);
    if (p.sign) out.push(p.sign);
    if (p.screen) out.push(p.screen);
    const c = p.challenge;
    if (c) {
      out.push(c.question, ...(c.riddle ?? []), ...(c.steps ?? []), ...(c.line ? [c.line] : []), ...(c.tag ? [c.tag] : []), ...(c.done ? [c.done] : []));
      for (const o of c.options ?? []) out.push(o.label, o.response);
    }
  }
  return out;
}
