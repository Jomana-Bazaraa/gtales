/** Client-safe helpers (no fs). Catalogue slug → story folder; image path for a page of a tale by gender set. */
export const STORY_ALIASES: Record<string, string> = { anxiety: "worry" };

export function storyFolder(slug: string): string {
  return STORY_ALIASES[slug] ?? slug;
}
export function storyImage(slug: string, gender: "boy" | "girl", file: string): string {
  return `/stories/${storyFolder(slug)}/${gender}/${file}`;
}
