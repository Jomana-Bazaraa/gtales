/** Review form fields (SPEC §5.6). Shared by the form (client) and the API. */
import { z } from "zod";

const name = /^\p{L}[\p{L} '\-.]*$/u;
export const CONSENT_DISPLAY = "I am the parent/guardian of any child shown, and I agree to GTales showing this review, photos and video on its website and social media.";
export const CONSENT_REMOVAL = "I understand I can ask for it to be removed at any time.";

export const reviewFields = z.object({
  rating: z.number().int().min(1, "Please choose 1 to 5 stars.").max(5),
  text: z.string().trim().min(1, "Please write a few words.").max(5000, "Up to 5,000 characters, please."),
  first_name: z.string().trim().min(1, "Please write your first name.").max(30).regex(name, "Letters only, please."),
  city: z.string().trim().max(40).regex(name, "Letters only, please.").optional().or(z.literal("").transform(() => undefined)),
  child_age: z.number().int().min(1).max(17).optional(),
  story_slug: z.string().max(40).optional(),
  media: z.array(z.object({ type: z.enum(["image", "video"]), path: z.string().max(120) })).max(4).default([]),
});
export type ReviewFields = z.infer<typeof reviewFields>;
