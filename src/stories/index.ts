/**
 * Story loader — docs/SPEC.md §7.1. Files live in stories/<slug>.json at the repo root.
 * Imported at build time (not read from disk) so the app runs where there is no filesystem (Cloudflare Workers).
 * A new story file must be added to FILES below; `npm test` fails if one is missing.
 */
import anger from "../../stories/anger.json";
import bullied from "../../stories/bullied.json";
import feelings from "../../stories/feelings.json";
import friendship from "../../stories/friendship.json";
import lying from "../../stories/lying.json";
import worry from "../../stories/worry.json";
import { storySchema, type StoryJson } from "./schema";

/** Catalogue slug → story file name (the brief calls the anxiety tale "worry"). */
import { STORY_ALIASES as ALIASES } from "./images";
export { storyImage } from "./images";

export const FILES: Record<string, unknown> = { anger, bullied, feelings, friendship, lying, worry };

const cache = new Map<string, StoryJson | null>();

export async function loadStory(slug: string): Promise<StoryJson | null> {
  if (cache.has(slug)) return cache.get(slug)!;
  const candidates = [slug, ALIASES[slug]].filter(Boolean) as string[];
  for (const c of candidates) {
    if (!Object.hasOwn(FILES, c)) continue;
    try {
      const parsed = storySchema.parse(FILES[c]);
      cache.set(slug, parsed);
      return parsed;
    } catch (e) {
      console.error(`[stories] ${c}.json invalid:`, e instanceof Error ? e.message : e);
    }
  }
  cache.set(slug, null);
  return null;
}
