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

/**
 * Image sets that exist in public/stories/<folder>/<gender>/ (and the stories-web copies).
 * Static so the server never touches the disk (Cloudflare Workers have none). A set missing here
 * makes that story/gender "coming soon"; `npm test` fails if this list and the folders disagree.
 */
export const IMAGE_SETS: Record<string, ReadonlyArray<"boy" | "girl">> = {
  anger: ["boy", "girl"],
  bullied: ["boy", "girl"],
  feelings: ["boy", "girl"],
  friendship: ["boy", "girl"],
  lying: ["boy", "girl"],
  worry: ["boy", "girl"],
};
export function hasImageSet(slug: string, gender: "boy" | "girl"): boolean {
  return IMAGE_SETS[storyFolder(slug)]?.includes(gender) ?? false;
}

/** The team's parent guide for a tale (public/guides/<folder>.pdf, one per story file). */
export function guideUrl(slug: string): string {
  return `/guides/${storyFolder(slug)}.pdf`;
}
