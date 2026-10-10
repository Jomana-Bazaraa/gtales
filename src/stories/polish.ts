/**
 * Optional AI polish — docs/SPEC.md §7.4. One call per book, validated in code,
 * plain filled story used if any check fails. Never sends parent email, phone or photo.
 *
 * POLISH_PROVIDER=claude|gemini|off   POLISH_MODEL=<model id>   POLISH_TEMPERATURE (default 0.25)
 */
import { promises as fs } from "fs";
import path from "path";
import { storyStrings } from "./fill";
import { storySchema, type FilledStory, type StoryJson } from "./schema";

export type PolishResult = { story: FilledStory; polished: boolean; rejected?: string[] };

const PROMPT_PATH = path.join(process.cwd(), "src", "stories", "polish-prompt.md");

export function polishProvider(): "claude" | "gemini" | "off" {
  const p = (process.env.POLISH_PROVIDER || "off").toLowerCase();
  return p === "claude" || p === "gemini" ? p : "off";
}

export async function polishStory(filled: FilledStory, keep: { name: string; sidekick?: string; power_word?: string; place: string; other?: string }): Promise<PolishResult> {
  const provider = polishProvider();
  if (provider === "off") return { story: filled, polished: false };
  try {
    const prompt = await fs.readFile(PROMPT_PATH, "utf8");
    const raw = await callModel(provider, prompt, JSON.stringify(stripMeta(filled)));
    const parsed = storySchema.safeParse(extractJson(raw));
    if (!parsed.success) return reject(filled, ["invalid JSON or schema: " + parsed.error.issues[0]?.message]);
    const problems = validatePolish(filled, parsed.data, keep);
    if (problems.length) return reject(filled, problems);
    return { story: { ...parsed.data, gender: filled.gender, polished: true }, polished: true };
  } catch (e) {
    return reject(filled, ["call failed: " + (e instanceof Error ? e.message : String(e))]);
  }
}

function stripMeta(s: FilledStory): StoryJson {
  const { gender: _g, polished: _p, ...rest } = s;
  void _g; void _p;
  return rest;
}

async function callModel(provider: "claude" | "gemini", system: string, user: string): Promise<string> {
  const temperature = Number(process.env.POLISH_TEMPERATURE || 0.25);
  if (provider === "claude") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = process.env.POLISH_MODEL || "claude-sonnet-4-5";
    const res = await client.messages.create({ model, max_tokens: 8000, temperature, system, messages: [{ role: "user", content: user }] });
    return res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  }
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.POLISH_MODEL || "gemini-2.5-flash";
  const res = await ai.models.generateContent({ model, contents: user, config: { systemInstruction: system, temperature, responseMimeType: "application/json" } });
  return res.text ?? "";
}

function extractJson(raw: string): unknown {
  const t = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(t); } catch { return null; }
}

/** The checks from SPEC §7.4. Returns a list of problems (empty = accepted). */
export function validatePolish(before: StoryJson, after: StoryJson, keep: { name: string; sidekick?: string; power_word?: string; place: string; other?: string }): string[] {
  const p: string[] = [];
  if (after.pages.length !== before.pages.length) p.push("page count changed");
  before.pages.forEach((bp, i) => {
    const ap = after.pages[i];
    if (!ap) return;
    if (ap.n !== bp.n || ap.image !== bp.image) p.push(`page ${bp.n}: n/image changed`);
    if (!!bp.challenge !== !!ap.challenge) p.push(`page ${bp.n}: challenge added/removed`);
    if (bp.challenge && ap.challenge) {
      const b = bp.challenge, a = ap.challenge;
      if (a.type !== b.type) p.push(`page ${bp.n}: challenge type changed`);
      if ((a.options?.length ?? 0) !== (b.options?.length ?? 0)) p.push(`page ${bp.n}: option count changed`);
      b.options?.forEach((o, k) => { if (a.options?.[k]?.correct !== o.correct) p.push(`page ${bp.n}: correct answer changed`); });
      if (JSON.stringify(a.steps ?? []) !== JSON.stringify(b.steps ?? [])) p.push(`page ${bp.n}: Combo steps changed`);
      if ((a.count ?? 0) !== (b.count ?? 0)) p.push(`page ${bp.n}: box count changed`);
    }
    if (ap.text.length !== bp.text.length) p.push(`page ${bp.n}: paragraph count changed`);
    const bl = bp.text.join(" ").length, al = ap.text.join(" ").length;
    if (al > bl * 1.15 + 10) p.push(`page ${bp.n}: more than 15% longer`);
    // every inserted detail that was on this page must still be there
    for (const v of [keep.name, keep.sidekick, keep.power_word, keep.place, keep.other].filter(Boolean) as string[]) {
      if (bp.text.join(" ").includes(v) && !ap.text.join(" ").includes(v)) p.push(`page ${bp.n}: "${v}" disappeared`);
    }
  });
  // sentence length ≤ 14 words
  for (const s of storyStrings(after)) {
    for (const sent of s.split(/(?<=[.!?…])\s+/)) {
      if (sent.trim().split(/\s+/).length > 14) { p.push(`sentence over 14 words: "${sent.slice(0, 40)}…"`); break; }
    }
  }
  // no new capitalised words (names, places, characters) that were not in the original
  const caps = (s: StoryJson) => new Set(storyStrings(s).join(" ").match(/\b[A-Z][a-z]+/g) ?? []);
  const bc = caps(before);
  for (const w of caps(after)) if (!bc.has(w)) { p.push(`new name or place: ${w}`); break; }
  if (/\{\{\w+\}\}/.test(JSON.stringify(after))) p.push("token left in polished text");
  return p;
}

async function reject(filled: FilledStory, problems: string[]): Promise<PolishResult> {
  try {
    const dir = path.join(process.cwd(), ".data");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, "polish-rejected.ndjson"), JSON.stringify({ at: new Date().toISOString(), slug: filled.slug, problems }) + "\n");
  } catch {}
  console.warn("[polish] rejected:", problems.join("; "));
  return { story: filled, polished: false, rejected: problems };
}
