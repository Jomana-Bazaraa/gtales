/**
 * Story JSON schema — docs/SPEC.md §7.1.
 * One file per tale in stories/<slug>.json. Wording is the team's; the app never changes it.
 */
import { z } from "zod";

export const TOKENS = ["name", "age", "place", "other", "sidekick", "power_word", "need", "ask", "strength"] as const;
export type Token = (typeof TOKENS)[number];
export const PRONOUNS = ["he", "him", "his", "He", "His"] as const;

const option = z.object({
  label: z.string().min(1),
  correct: z.boolean().default(false),
  response: z.string().default(""),
});

export const challengeSchema = z.object({
  type: z.enum(["choice", "riddle", "steps", "boxes", "say"]),
  question: z.string().min(1),
  riddle: z.array(z.string()).optional(), // riddle lines (type riddle)
  options: z.array(option).optional(), // choice, riddle
  steps: z.array(z.string()).optional(), // steps (the Combo)
  count: z.number().int().min(1).max(10).optional(), // boxes
  line: z.string().optional(), // say: the line to say out loud
});

export const pageSchema = z.object({
  n: z.number().int().min(1).max(15),
  image: z.string().regex(/^p\d{2}\.jpg$/),
  text: z.array(z.string()),
  sign: z.string().nullable().default(null),
  challenge: challengeSchema.nullable().default(null),
});

export const storySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  uses: z.array(z.enum(TOKENS)),
  need_choices: z.array(z.string()).default([]),
  ask_choices: z.array(z.string()).default([]),
  other_rule: z.enum(["not_sibling"]).nullable().default(null),
  pages: z.array(pageSchema).length(15),
});

export type Challenge = z.infer<typeof challengeSchema>;
export type StoryPageJson = z.infer<typeof pageSchema>;
export type StoryJson = z.infer<typeof storySchema>;

/** What the form collects (SPEC §7.2). */
export const RELATIONS = ["brother", "sister", "cousin", "friend", "school", "park"] as const;
export type Relation = (typeof RELATIONS)[number];
export const STRENGTHS = ["builder", "artist", "football player", "swimmer", "dancer", "helper", "reader", "singer"] as const;

export const formSchema = z.object({
  slug: z.string().min(1),
  name: z.string().trim().min(1).max(14).regex(/^[A-Za-z][A-Za-z '\-]*$/, "letters, spaces and hyphens only"),
  gender: z.enum(["boy", "girl"]),
  age: z.number().int().min(4).max(8),
  half: z.boolean().default(false), // "six and a half"
  place: z.string().trim().min(2).max(20),
  other: z.string().trim().min(1).max(14).regex(/^[A-Za-z][A-Za-z '\-]*$/).optional(),
  other_relation: z.enum(RELATIONS).optional(),
  strength: z.string().trim().min(2).max(24).optional(),
  sidekick: z.string().trim().min(1).max(12).optional(),
  power_word: z.string().trim().min(1).max(20).optional(),
  need: z.string().optional(),
  ask: z.string().optional(),
  dedication: z.string().trim().max(120).optional(),
});
export type StoryForm = z.infer<typeof formSchema>;

/** The finished, filled story (same shape, tokens replaced) plus what it was made from. */
export interface FilledStory extends StoryJson {
  gender: "boy" | "girl";
  polished: boolean;
}
