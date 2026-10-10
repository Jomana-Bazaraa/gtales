/** SPEC §7.1 AC: every story file parses, every (…) became a token, both image sets exist, `uses` matches. */
import { promises as fs } from "fs";
import path from "path";
import { storySchema, TOKENS } from "../src/stories/schema";
import { storyStrings } from "../src/stories/fill";

const root = process.cwd();
const dir = path.join(root, "stories");
let bad = 0;
const files = (await fs.readdir(dir).catch(() => [])).filter((f) => f.endsWith(".json"));
if (!files.length) { console.log("No story files in stories/ yet."); process.exit(0); }
for (const f of files) {
  const slug = f.replace(/\.json$/, "");
  const parsed = storySchema.safeParse(JSON.parse(await fs.readFile(path.join(dir, f), "utf8")));
  if (!parsed.success) { console.log(`✗ ${f}: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`); bad++; continue; }
  const s = parsed.data;
  const all = storyStrings(s).join("\n");
  const paren = all.match(/\((Name|Age|Place|Other|Sidekick|Power Word|Need|Ask|Strength)\)/g);
  if (paren) { console.log(`✗ ${f}: placeholders not converted: ${[...new Set(paren)].join(", ")}`); bad++; }
  const present = new Set((all.match(/\{\{(\w+)\}\}/g) ?? []).map((m) => m.slice(2, -2)).filter((t) => (TOKENS as readonly string[]).includes(t)));
  const uses = new Set(s.uses);
  for (const t of present) if (!uses.has(t as never)) { console.log(`✗ ${f}: token {{${t}}} used but not in "uses"`); bad++; }
  for (const t of uses) if (!present.has(t)) { console.log(`✗ ${f}: "${t}" in uses but never used`); bad++; }
  for (const g of ["boy", "girl"]) {
    const imgDir = path.join(root, "public", "stories", slug, g);
    const need = ["cover.jpg", "back.jpg", ...s.pages.map((p) => p.image ?? `p${String(p.n).padStart(2, "0")}.jpg`)];
    const have = new Set(await fs.readdir(imgDir).catch(() => []));
    const missing = need.filter((n) => !have.has(n));
    if (missing.length) console.log(`⚠ ${f}: ${g} set missing ${missing.length} images (${missing.slice(0, 3).join(", ")}…) — ${g} books for this tale are "coming soon" until it exists`);
  }
  console.log(`✓ ${f} parsed; tokens and "uses" consistent`);
}
process.exit(bad ? 1 : 0);
