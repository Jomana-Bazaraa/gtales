/**
 * The team's template scripts, imported as-is (handoff rule 2). Each attaches to globalThis.GTales.
 * Order matters: render.js replaces GTales, variants.js adds applyVariants to it.
 * Bundled at build time (no fs, no vm/eval) so it also runs on Cloudflare Workers.
 */
import "../../public/gtales-book/render.js";
import "../../public/gtales-book/variants.js";

export type GTales = {
  renderBook: (story: unknown, form: Record<string, unknown>, opts: { imageBase: string }) => string;
  fill: (text: string, t: Record<string, string>) => string;
  applyVariants: <T>(story: T, variants: unknown, form: Record<string, unknown>) => T;
};

export function gtales(): GTales {
  return (globalThis as unknown as { GTales: GTales }).GTales;
}
