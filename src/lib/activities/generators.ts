/** Seeded procedural puzzles. Deterministic per story id so web + PDF match. */
import type { AgeBand } from "./registry";
import type { Lang } from "../types";

export function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// ---------------- maze ----------------
export interface Maze {
  w: number;
  h: number;
  /** walls[y][x] = bitmask N=1 E=2 S=4 W=8 (wall present) */
  walls: number[][];
  solution: Array<[number, number]>;
}

export function mazeSize(band: AgeBand): [number, number] {
  return band === "3-5" ? [5, 5] : band === "6-8" ? [8, 8] : [12, 12];
}

export function generateMaze(seed: string, band: AgeBand): Maze {
  const [w, h] = mazeSize(band);
  const r = rng(seed + ":maze");
  const walls: number[][] = Array.from({ length: h }, () => Array(w).fill(15));
  const seen: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false));
  const stack: Array<[number, number]> = [[0, 0]];
  seen[0][0] = true;
  const dirs: Array<[number, number, number, number]> = [
    [0, -1, 1, 4],
    [1, 0, 2, 8],
    [0, 1, 4, 1],
    [-1, 0, 8, 2],
  ];
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const opts = dirs.filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < w && ny < h && !seen[ny][nx];
    });
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const [dx, dy, bit, opp] = opts[Math.floor(r() * opts.length)];
    const nx = x + dx, ny = y + dy;
    walls[y][x] &= ~bit;
    walls[ny][nx] &= ~opp;
    seen[ny][nx] = true;
    stack.push([nx, ny]);
  }
  // solve BFS from (0,0) to (w-1,h-1)
  const prev = new Map<string, string>();
  const q: Array<[number, number]> = [[0, 0]];
  const vis = new Set(["0,0"]);
  while (q.length) {
    const [x, y] = q.shift()!;
    if (x === w - 1 && y === h - 1) break;
    for (const [dx, dy, bit] of dirs) {
      if (walls[y][x] & bit) continue;
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (vis.has(k)) continue;
      vis.add(k);
      prev.set(k, `${x},${y}`);
      q.push([nx, ny]);
    }
  }
  const solution: Array<[number, number]> = [];
  let cur = `${w - 1},${h - 1}`;
  while (cur) {
    const [x, y] = cur.split(",").map(Number);
    solution.unshift([x, y]);
    cur = prev.get(cur) ?? "";
  }
  return { w, h, walls, solution };
}

// ---------------- word search ----------------
export interface WordSearch {
  size: number;
  grid: string[][];
  words: string[];
  placements: Array<{ word: string; x: number; y: number; dx: number; dy: number }>;
}

const WORDS: Record<Lang, Record<string, string[]>> = {
  en: {
    anger: ["CALM", "BREATH", "BLUE", "SLOW", "FIRE", "COOL", "STEADY"],
    anxiety: ["BRAVE", "LIGHT", "SAFE", "FLOAT", "CLOUD", "OKAY", "TRUST"],
    friendship: ["FRIEND", "SHARE", "KIND", "SONG", "HELLO", "SMILE", "TEAM"],
    sibling: ["TURN", "FAIR", "SHARE", "LISTEN", "TEAM", "SORRY", "PEACE"],
    confidence: ["BRIGHT", "SHINE", "BRAVE", "PROUD", "GLOW", "TRY", "STRONG"],
    emotions: ["HAPPY", "SAD", "ANGRY", "SCARED", "PROUD", "SHY", "COLOR"],
    loss: ["REMEMBER", "GROW", "SPRING", "LOVE", "LEAF", "NEW", "HOPE"],
    bullied: ["STOP", "STRONG", "SHELL", "TELL", "SAFE", "BRAVE", "VOICE"],
    lying: ["TRUTH", "HONEST", "TRUST", "CLEAR", "WEB", "BRAVE", "REAL"],
    default: ["BRAVE", "KIND", "CALM", "HELP", "FRIEND", "SMILE", "TRUE"],
  },
  ar: {
    anger: ["هدوء", "نفس", "أزرق", "بالراحة", "نار", "بارد", "ثابت"],
    anxiety: ["شجاع", "خفيف", "أمان", "سحابة", "تمام", "ثقة", "نور"],
    friendship: ["صاحب", "شارك", "لطيف", "غنوة", "أهلا", "ضحكة", "فريق"],
    sibling: ["دور", "عدل", "شارك", "اسمع", "فريق", "آسف", "سلام"],
    confidence: ["نور", "لمعة", "شجاع", "فخور", "جرب", "قوي", "ضوء"],
    emotions: ["فرحان", "زعلان", "غضبان", "خايف", "فخور", "مكسوف", "لون"],
    loss: ["افتكر", "كبر", "ربيع", "حب", "ورقة", "جديد", "أمل"],
    bullied: ["بس", "قوي", "قوقعة", "قول", "أمان", "شجاع", "صوت"],
    lying: ["صدق", "أمين", "ثقة", "واضح", "شبكة", "شجاع", "حقيقي"],
    default: ["شجاع", "لطيف", "هدوء", "ساعد", "صاحب", "ضحكة", "صدق"],
  },
};

const AR_LETTERS = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
const EN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateWordSearch(seed: string, band: AgeBand, lang: Lang, struggle: string): WordSearch {
  const r = rng(seed + ":ws");
  const size = band === "6-8" ? 8 : 10;
  const pool = (WORDS[lang][struggle] ?? WORDS[lang].default).filter((w) => [...w].length <= size);
  const words = pool.slice(0, band === "6-8" ? 5 : 7);
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const placements: WordSearch["placements"] = [];
  // Arabic: no diagonal/vertical reversed — keep horizontal (RTL reading) + vertical only
  const dirs = lang === "ar" ? [[1, 0], [0, 1]] : [[1, 0], [0, 1], [1, 1], band === "9-11" ? [1, -1] : [1, 0]];
  for (const word of words) {
    const letters = [...word];
    let placed = false;
    for (let tries = 0; tries < 200 && !placed; tries++) {
      const [dx, dy] = dirs[Math.floor(r() * dirs.length)];
      const x = Math.floor(r() * size), y = Math.floor(r() * size);
      const ex = x + dx * (letters.length - 1), ey = y + dy * (letters.length - 1);
      if (ex < 0 || ey < 0 || ex >= size || ey >= size) continue;
      let ok = true;
      for (let i = 0; i < letters.length; i++) {
        const c = grid[y + dy * i][x + dx * i];
        if (c && c !== letters[i]) { ok = false; break; }
      }
      if (!ok) continue;
      for (let i = 0; i < letters.length; i++) grid[y + dy * i][x + dx * i] = letters[i];
      placements.push({ word, x, y, dx, dy });
      placed = true;
    }
  }
  const alphabet = lang === "ar" ? AR_LETTERS : EN_LETTERS;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!grid[y][x]) grid[y][x] = alphabet[Math.floor(r() * alphabet.length)];
  return { size, grid, words: placements.map((p) => p.word), placements };
}

// ---------------- connect the dots ----------------
/** Simple closed shapes per Keeper symbol, as normalized points (0..1). */
const SHAPES: Record<string, Array<[number, number]>> = {
  flame: [[0.5, 0.05], [0.68, 0.3], [0.62, 0.42], [0.8, 0.55], [0.75, 0.8], [0.5, 0.95], [0.25, 0.8], [0.2, 0.55], [0.38, 0.42], [0.32, 0.3]],
  cloud: [[0.2, 0.7], [0.12, 0.55], [0.22, 0.4], [0.35, 0.42], [0.42, 0.25], [0.6, 0.22], [0.7, 0.38], [0.85, 0.42], [0.9, 0.6], [0.8, 0.72]],
  bird: [[0.15, 0.5], [0.3, 0.35], [0.5, 0.3], [0.62, 0.2], [0.72, 0.3], [0.68, 0.42], [0.85, 0.5], [0.7, 0.6], [0.5, 0.7], [0.3, 0.65]],
  fox: [[0.2, 0.2], [0.35, 0.45], [0.65, 0.45], [0.8, 0.2], [0.85, 0.55], [0.7, 0.8], [0.5, 0.9], [0.3, 0.8], [0.15, 0.55]],
  bolt: [[0.55, 0.05], [0.35, 0.45], [0.5, 0.45], [0.4, 0.95], [0.7, 0.4], [0.55, 0.4]],
  chameleon: [[0.1, 0.5], [0.25, 0.35], [0.5, 0.3], [0.75, 0.35], [0.9, 0.5], [0.8, 0.65], [0.6, 0.7], [0.75, 0.85], [0.6, 0.8], [0.4, 0.65], [0.25, 0.65]],
  tree: [[0.5, 0.05], [0.7, 0.3], [0.62, 0.3], [0.8, 0.55], [0.6, 0.55], [0.6, 0.9], [0.4, 0.9], [0.4, 0.55], [0.2, 0.55], [0.38, 0.3], [0.3, 0.3]],
  turtle: [[0.2, 0.6], [0.3, 0.4], [0.5, 0.3], [0.7, 0.4], [0.8, 0.6], [0.9, 0.55], [0.85, 0.7], [0.7, 0.7], [0.5, 0.75], [0.3, 0.7], [0.15, 0.7]],
  web: [[0.5, 0.1], [0.78, 0.22], [0.9, 0.5], [0.78, 0.78], [0.5, 0.9], [0.22, 0.78], [0.1, 0.5], [0.22, 0.22]],
};
export const KEEPER_SHAPE: Record<string, keyof typeof SHAPES> = {
  blaze: "flame", wisp: "cloud", pip: "bird", zigzag: "fox", bolt: "bolt", chroma: "chameleon", willow: "tree", pebble: "turtle", tangle: "web",
};

export function dotsFor(keeper: string, band: AgeBand): Array<[number, number]> {
  const base = SHAPES[KEEPER_SHAPE[keeper] ?? "flame"];
  if (band === "3-5") return base.filter((_, i) => i % 2 === 0 || base.length <= 8);
  if (band === "9-11") {
    // add midpoints for more dots
    const out: Array<[number, number]> = [];
    for (let i = 0; i < base.length; i++) {
      const a = base[i], b = base[(i + 1) % base.length];
      out.push(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    }
    return out;
  }
  return base;
}

// ---------------- hidden objects ----------------
export interface HiddenObject { x: number; y: number; icon: string; label: Record<Lang, string> }
export function hiddenObjects(seed: string): HiddenObject[] {
  const r = rng(seed + ":hidden");
  const items: Array<{ icon: string; label: Record<Lang, string> }> = [
    { icon: "⭐", label: { en: "a star", ar: "نجمة" } },
    { icon: "🔑", label: { en: "a key", ar: "مفتاح" } },
    { icon: "🐌", label: { en: "a snail", ar: "حلزونة" } },
    { icon: "🎈", label: { en: "a balloon", ar: "بالونة" } },
    { icon: "🍎", label: { en: "an apple", ar: "تفاحة" } },
    { icon: "🦋", label: { en: "a butterfly", ar: "فراشة" } },
    { icon: "🧦", label: { en: "a sock", ar: "شراب" } },
  ];
  const pick = items.sort(() => r() - 0.5).slice(0, 5);
  return pick.map((p) => ({ ...p, x: 0.08 + r() * 0.84, y: 0.08 + r() * 0.84 }));
}
