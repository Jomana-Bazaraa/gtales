/**
 * Template engine — pure string work, no AI.
 *
 * Template file format (src/templates/<key>.<lang>.md):
 *   title: {{CHILD_NAME}} and the Red Flame
 *   cover_scene: {{CHILD_NAME}} standing next to Blaze at {{INTEREST_PLACE}} ...
 *   ---
 *   page 1 text (paragraphs separated by blank lines)
 *   ---
 *   page 2 ...
 *
 * Tokens:
 *   {{CHILD_NAME}} {{KEEPER}} {{KEEPER_TITLE}} {{SIDEKICK}}
 *   {{INTEREST_WORLD}} {{INTEREST_PLACE}} {{INTEREST_OBJECT}} {{INTEREST_ACTIVITY}}
 *   {{he|she}}  — gender fork: boy-form|girl-form (works for Arabic verbs/adjectives too: {{راح|راحت}})
 *   [[SIDEKICK: ... ]] — whole block kept only when a sidekick was provided
 *   [PERSONAL_DETAIL_SLOT]  — replaced by the AI sentence(s)
 *   [INTERACTIVE_SLOT]      — marks the challenge page position
 */
import { promises as fs } from "fs";
import path from "path";
import { KEEPERS, type KeeperId } from "./keepers";
import type { Gender, GeneratedText, Lang, StoryInput, StoryPage } from "./types";

export interface ParsedTemplate {
  title: string;
  coverScene: string;
  pages: string[]; // raw page bodies, still containing tokens
}

const cache = new Map<string, ParsedTemplate>();

export async function loadTemplate(key: string, lang: Lang): Promise<ParsedTemplate> {
  const id = `${key}.${lang}`;
  if (cache.has(id)) return cache.get(id)!;
  const file = path.join(process.cwd(), "src", "templates", `${id}.md`);
  const raw = await fs.readFile(file, "utf8");
  const parsed = parseTemplate(raw);
  cache.set(id, parsed);
  return parsed;
}

export async function templateExists(key: string, lang: Lang): Promise<boolean> {
  try {
    await fs.access(path.join(process.cwd(), "src", "templates", `${key}.${lang}.md`));
    return true;
  } catch {
    return false;
  }
}

export function parseTemplate(raw: string): ParsedTemplate {
  const [head, ...rest] = raw.split(/^---\s*$/m);
  const meta: Record<string, string> = {};
  for (const line of head.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return {
    title: meta.title ?? "",
    coverScene: meta.cover_scene ?? "",
    pages: rest.map((p) => p.trim()).filter(Boolean),
  };
}

export interface SubstitutionContext {
  childName: string;
  gender: Gender;
  keeper: KeeperId;
  lang: Lang;
  sidekick?: string;
  interest: GeneratedText["interest_phrases"];
  personalDetail?: string;
}

export function substitute(text: string, ctx: SubstitutionContext): string {
  const k = KEEPERS[ctx.keeper];
  let out = text;

  // sidekick block
  out = out.replace(/\[\[SIDEKICK:([\s\S]*?)\]\]/g, (_, inner: string) => (ctx.sidekick ? inner.trim() : ""));

  // gender forks {{a|b}} — anything containing a pipe and not an uppercase token
  out = out.replace(/\{\{([^{}|]+)\|([^{}|]+)\}\}/g, (_, boy: string, girl: string) => (ctx.gender === "boy" ? boy : girl));

  const map: Record<string, string> = {
    CHILD_NAME: ctx.childName,
    KEEPER: k.name[ctx.lang],
    KEEPER_TITLE: k.title[ctx.lang],
    SIDEKICK: ctx.sidekick ?? "",
    INTEREST_WORLD: ctx.interest.world,
    INTEREST_PLACE: ctx.interest.place,
    INTEREST_OBJECT: ctx.interest.object,
    INTEREST_ACTIVITY: ctx.interest.activity,
  };
  out = out.replace(/\{\{([A-Z_]+)\}\}/g, (m, key: string) => (key in map ? map[key] : m));

  if (ctx.personalDetail !== undefined) {
    out = out.replace(/\[PERSONAL_DETAIL_SLOT\]/g, ctx.personalDetail);
  }
  // collapse double spaces left by removed blocks
  return out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/** Extracts the sentence before/after a slot so the AI can match continuity. */
export function slotContext(pages: string[], slot: string): { before: string; after: string } {
  const joined = pages.join("\n\n");
  const i = joined.indexOf(slot);
  if (i < 0) return { before: "", after: "" };
  const before = joined.slice(Math.max(0, i - 300), i).split(/(?<=[.!?؟])\s+/).slice(-2).join(" ").trim();
  const after = joined.slice(i + slot.length, i + slot.length + 300).split(/(?<=[.!?؟])\s+/).slice(0, 2).join(" ").trim();
  return { before, after };
}

/** Turns substituted template pages into the final page structure. */
export function assemblePages(tpl: ParsedTemplate, ctx: SubstitutionContext, workshop: string[]): StoryPage[] {
  const pages: StoryPage[] = [{ kind: "cover", title: substitute(tpl.title, ctx), image: "cover" }];
  for (const raw of tpl.pages) {
    if (raw.includes("[INTERACTIVE_SLOT]")) {
      const text = substitute(raw.replace("[INTERACTIVE_SLOT]", ""), ctx);
      if (text) pages.push({ kind: "text", paragraphs: splitParas(text) });
      pages.push({ kind: "challenge" });
      continue;
    }
    pages.push({ kind: "text", paragraphs: splitParas(substitute(raw, ctx)) });
  }
  for (const a of workshop) pages.push({ kind: "activity", activity: a });
  pages.push({ kind: "badge" });
  pages.push({ kind: "parents" });
  return pages;
}

export function splitParas(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
}

/** Interest phrases used when AI is mocked/unavailable: plain chip label. */
export function fallbackInterest(input: StoryInput, lang: Lang): GeneratedText["interest_phrases"] {
  const i = input.interests[0] ?? (lang === "ar" ? "اللعب" : "playing");
  return lang === "ar"
    ? { world: `عالم ${i}`, place: `مكان ${i} المفضل`, object: `حاجة من ${i}`, activity: `بيلعب ${i}` }
    : { world: `the world of ${i}`, place: `the ${i} place`, object: `a ${i} thing`, activity: `playing ${i}` };
}
