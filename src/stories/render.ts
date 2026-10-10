/**
 * Server-side wrapper around the team's template renderer (public/gtales-book/render.js).
 * The template is the only source of design (handoff README rule 2): we never restyle it.
 * renderBook(story, form, { imageBase }) → HTML for cover + 15 pages + back cover.
 */
import { promises as fs } from "fs";
import path from "path";
import vm from "vm";
import type { StoryForm, StoryJson } from "./schema";
import { storyFolder } from "./images";
import { ageInWords, capitaliseName } from "./fill";

type GTales = {
  renderBook: (story: unknown, form: Record<string, unknown>, opts: { imageBase: string }) => string;
  fill: (text: string, t: Record<string, string>) => string;
};

let cached: GTales | null = null;
async function template(): Promise<GTales> {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const src = await fs.readFile(path.join(process.cwd(), "public", "gtales-book", "render.js"), "utf8");
  const sandbox: { globalThis?: unknown; GTales?: GTales } = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(src, sandbox);
  cached = sandbox.GTales!;
  return cached;
}

/** Form values as render.js expects them (its `tokens()` turns a numeric age into words; "and a half" is passed as text). */
export function templateForm(form: StoryForm): Record<string, unknown> {
  return {
    name: capitaliseName(form.name),
    gender: form.gender,
    age: form.half ? ageInWords(form.age, true) : form.age,
    place: form.place.trim(),
    other: form.other ? capitaliseName(form.other) : undefined,
    sidekick: form.sidekick ? capitaliseName(form.sidekick) : undefined,
    power_word: form.power_word?.trim(),
    need: form.need,
    ask: form.ask,
    strength: form.strength?.trim().toLowerCase(),
  };
}

/** HTML for the whole book, images resolved under /stories/<folder>/<gender>/. */
export async function renderBookHtml(story: StoryJson, form: StoryForm): Promise<string> {
  const t = await template();
  const imageBase = `/stories/${storyFolder(story.slug)}/${form.gender}/`;
  return t.renderBook(story, templateForm(form), { imageBase });
}
