import { z } from "zod";
import { STRUGGLES } from "./keepers";

export const storyInputSchema = z.object({
  childName: z.string().trim().min(1).max(30),
  age: z.number().int().min(3).max(12),
  gender: z.enum(["boy", "girl"]),
  appearance: z.object({
    skinTone: z.string().max(20),
    hairStyle: z.string().max(20),
    hairColor: z.string().max(20),
    details: z.string().trim().max(120).optional(),
  }),
  interests: z.array(z.string().trim().min(1).max(40)).min(1).max(5),
  sidekick: z
    .object({ name: z.string().trim().min(1).max(30), relation: z.enum(["sibling", "friend", "pet", "cousin"]) })
    .optional(),
  struggle: z.enum(STRUGGLES.map((s) => s.id) as [string, ...string[]]),
  struggleOther: z.string().trim().max(600).optional(),
  challengeType: z.enum(["maze", "riddle", "math", "wordsearch", "dots", "choose_path", "coloring", "hidden_objects"]),
  vibe: z.enum(["funny", "magical", "mysterious", "fantasy"]),
  favoriteBook: z.string().trim().max(80).optional(),
  personalDetail: z.string().trim().min(3).max(400),
  parentName: z.string().trim().min(1).max(60),
  parentEmail: z.string().trim().email().max(120),
  parentPhone: z.string().trim().max(20).optional(),
  language: z.enum(["en", "ar"]),
  consent: z.literal(true),
  website: z.string().max(0).optional(), // honeypot
}).refine((d) => d.struggle !== "other" || (d.struggleOther && d.struggleOther.length >= 10), {
  message: "Please describe the struggle",
  path: ["struggleOther"],
});

export const physicalOrderSchema = z.object({
  storyId: z.string().min(1),
  recipientName: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(60),
  governorate: z.string().trim().min(2).max(40),
  phone: z.string().trim().min(8).max(20),
  notes: z.string().trim().max(300).optional(),
  confirm: z.literal(true),
});
