/** Client-safe helpers (no fs). Catalogue slug → story folder; image path for a page of a tale by gender set. */
export const STORY_ALIASES: Record<string, string> = { anxiety: "worry" };

export function storyFolder(slug: string): string {
  return STORY_ALIASES[slug] ?? slug;
}
/** "web" = 1200 px copies for screens (/stories-web), "print" = full-size originals for the PDF (/stories). */
export type ImageVariant = "web" | "print";
export function imageRoot(variant: ImageVariant = "web"): string {
  return variant === "print" ? "/stories" : "/stories-web";
}
export function storyImage(slug: string, gender: "boy" | "girl", file: string, variant: ImageVariant = "web"): string {
  return `${imageRoot(variant)}/${storyFolder(slug)}/${gender}/${file}`;
}
