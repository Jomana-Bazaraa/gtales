/**
 * Rude / unsafe word check for free text that goes into a book — docs/SPEC.md §7.2.
 * English and Franco-Arabic (Arabic in Latin letters). On a hit the parent is asked to change it.
 * The list is deliberately short and matched on whole words after normalisation; extend in one place.
 */

const ENGLISH = [
  "fuck", "fucking", "shit", "bitch", "bastard", "asshole", "dick", "cock", "pussy", "cunt", "whore", "slut",
  "damn", "crap", "nigger", "nigga", "fag", "faggot", "retard", "rape", "porn", "sex", "sexy", "nude", "naked",
  "kill", "murder", "suicide", "drugs", "cocaine", "heroin", "weed", "hitler", "nazi", "terrorist", "bomb", "gun",
];

// Franco-Arabic (Egyptian) insults and unsafe words, common spellings.
const FRANCO = [
  "kos", "koss", "kosomak", "kosomk", "kosommak", "kos omak", "ahbal", "ahbl", "sharmota", "sharmoota", "shrmota",
  "zeb", "zebi", "zoby", "zobr", "khawal", "5awal", "5wal", "ya5wal", "manyak", "manyok", "manyak", "mtnak", "metnak",
  "3ars", "3rs", "ya3ars", "ibn el kalb", "ebn el kalb", "ibn kalb", "kalb", "7mar", "homar", "7omar", "ya7mar",
  "wes5", "wesekh", "wese5", "zbala", "zebala", "ya zebala", "ghabi", "ghaby", "8aby", "8abi", "tez", "teez", "tizak",
  "labwa", "lboa", "3ahera", "3ahira", "mra", "m3ras", "me3ras", "mo5anas", "mokhanas", "shaz", "shath",
  "7ashish", "hashish", "bango", "tramadol",
];

const ALL = new Set([...ENGLISH, ...FRANCO].map(normalise));

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s]/g, " ")
    .replace(/(.)\1{2,}/g, "$1") // "shiiit" → "shit"
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns the offending word, or null when the text is clean. */
export function findUnsafe(text: string): string | null {
  const n = normalise(text);
  if (!n) return null;
  const words = n.split(" ");
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (ALL.has(w)) return w;
    const two = `${w} ${words[i + 1] ?? ""}`.trim();
    if (ALL.has(two)) return two;
    const three = `${two} ${words[i + 2] ?? ""}`.trim();
    if (ALL.has(three)) return three;
    // leet-ish collapses: 5→kh, 3→a, 7→h, 8→gh handled by listing variants above
  }
  return null;
}

export function assertSafe(fields: Record<string, string | undefined>): void {
  for (const [k, v] of Object.entries(fields)) {
    if (!v) continue;
    const hit = findUnsafe(v);
    if (hit) throw new SafetyError(k, hit);
  }
}

export class SafetyError extends Error {
  constructor(public readonly field: string, public readonly word: string) {
    super(`Please change "${word}" in ${field.replace("_", " ")}.`);
    this.name = "SafetyError";
  }
}
