/**
 * Age variants and fun lines (stories/variants/<slug>.json), written by hand by the team.
 * Applied with the template's GTales.applyVariants before fillStory: `fun` lines only when the form has
 * every value they need (snack, silly), `little` challenges for ages 5 and under. The story JSON is never changed.
 * Imported, not read from disk (no filesystem on Cloudflare Workers); `npm test` fails if a file is missing here.
 */
import anger from "../../stories/variants/anger.json";
import bullied from "../../stories/variants/bullied.json";
import feelings from "../../stories/variants/feelings.json";
import friendship from "../../stories/variants/friendship.json";
import lying from "../../stories/variants/lying.json";
import worry from "../../stories/variants/worry.json";
import { storyFolder } from "./images";
import type { StoryForm, StoryJson } from "./schema";
import { gtales } from "./template";

export const VARIANTS: Record<string, unknown> = { anger, bullied, feelings, friendship, lying, worry };

/** A new story with the variants for this form applied; the same story when the tale has no variants file. */
export function applyStoryVariants(story: StoryJson, form: StoryForm): StoryJson {
  const v = VARIANTS[storyFolder(story.slug)];
  if (!v) return story;
  return gtales().applyVariants(story, v, form as unknown as Record<string, unknown>);
}
