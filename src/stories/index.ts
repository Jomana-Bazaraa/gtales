/** Story loader — docs/SPEC.md §7.1. Files live in stories/<slug>.json at the repo root. */
import { promises as fs } from "fs";
import path from "path";
import { storySchema, type StoryJson } from "./schema";

/** Catalogue slug → story file name (the brief calls the anxiety tale "worry"). */
import { STORY_ALIASES as ALIASES } from "./images";
export { storyImage } from "./images";

const cache = new Map<string, StoryJson | null>();

export async function loadStory(slug: string): Promise<StoryJson | null> {
  if (cache.has(slug) && process.env.NODE_ENV === "production") return cache.get(slug)!;
  const candidates = [slug, ALIASES[slug]].filter(Boolean) as string[];
  for (const c of candidates) {
    const file = path.join(process.cwd(), "stories", `${c}.json`);
    try {
      const raw = await fs.readFile(file, "utf8");
      const parsed = storySchema.parse(JSON.parse(raw));
      cache.set(slug, parsed);
      return parsed;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") console.error(`[stories] ${c}.json invalid:`, e instanceof Error ? e.message : e);
    }
  }
  cache.set(slug, null);
  return null;
}

