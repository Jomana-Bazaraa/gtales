/**
 * Story checker in a real browser: every story × boy/girl × age 2/5/8/10 × names Abdelrahman and Lulu, with and
 * without the silly word, rendered with the team's book.css and render.js: no "{{", no "undefined", and fitPages()
 * must not warn "too much text".
 * Needs Chrome/Chromium: PUPPETEER_EXECUTABLE_PATH (default /usr/bin/google-chrome).   npm run check:fit
 * When a page overflows, report it to the team: never shorten their text here.
 */
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { FILES } from "../src/stories/index";
import { fillStory } from "../src/stories/fill";
import { renderBookHtml } from "../src/stories/render";
import { storySchema, type StoryForm } from "../src/stories/schema";
import { applyStoryVariants } from "../src/stories/variants";

const PUBLIC = path.join(process.cwd(), "public");
const pages = new Map<string, string>();
const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (pages.has(url)) { res.writeHead(200, { "content-type": "text/html" }); res.end(pages.get(url)); return; }
  const file = path.join(PUBLIC, path.normalize(url).replace(/^(\.\.[/\\])+/, ""));
  try {
    const type = file.endsWith(".css") ? "text/css" : file.endsWith(".js") ? "text/javascript" : file.endsWith(".woff2") ? "font/woff2" : "image/jpeg";
    const body = await fs.readFile(file);
    res.writeHead(200, { "content-type": type }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

const browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox"], headless: true });
const FULL = { other: "Mohamed Ali", place: "Sheikh Zayed", sidekick: "Captain Bolt", power_word: "I'm a dinosaur! RAWR!", need: "I need some quiet time." };
let combos = 0, overflowing = 0;
try {
  for (const [slug, raw] of Object.entries(FILES)) {
    const st = storySchema.parse(raw);
    for (const name of ["Abdelrahman", "Lulu"]) for (const gender of ["boy", "girl"] as const) for (const age of [2, 5, 8, 10]) for (const fun of [true, false]) {
      // strength = the story's fixed default (the forms don't ask it)
      const form: StoryForm = { slug: st.slug, gender, age, half: false, name, strength: st.default_strength ?? "hero", other_relation: st.other_rule === "not_sibling" ? "school" : "brother", ...FULL, ...(fun ? { silly: "Sha3bolla" } : {}) };
      const html = await renderBookHtml(fillStory(applyStoryVariants(st, form), form), form, "web");
      const holes = [/\{\{|\}\}/.test(html) && "{{", /undefined/.test(html) && "undefined"].filter(Boolean);
      const key = `/__book/${slug}-${name}-${gender}-${age}-${fun}`;
      pages.set(key, `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/gtales-book/book.css"><script src="/gtales-book/render.js"></script>
        <style>html,body{margin:0;background:#fff}.gt-book{background:none}.gt-page{margin:0}</style></head><body><div class="gt-book"><div id="book">${html}</div></div></body></html>`);
      const page = await browser.newPage();
      const warnings: string[] = [];
      page.on("console", (m) => { if (m.type() === "warn" && m.text().includes("GTales")) warnings.push(m.text()); });
      await page.goto(base + key, { waitUntil: "load" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        (window as unknown as { GTales: { fitPages: (el: Element) => void } }).GTales.fitPages(document.getElementById("book")!);
      });
      await page.close();
      combos++;
      const label = `${slug} ${name} ${gender} age ${age} ${fun ? "with" : "without"} silly word`;
      warnings.push(...holes.map((h) => `contains ${h}`));
      if (warnings.length) { overflowing++; console.log(`✗ ${label}: ${warnings.join("; ")}`); } else console.log(`✓ ${label}`);
    }
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${combos} books, ${overflowing} with problems ({{, undefined or "too much text")`);
process.exit(overflowing ? 1 : 0);
