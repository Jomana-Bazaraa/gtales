import { readFileSync, readdirSync } from "node:fs";
const dir = "src/templates";
let bad = 0;
for (const f of readdirSync(dir).sort()) {
  const raw = readFileSync(`${dir}/${f}`, "utf8");
  const [head, ...pages] = raw.split(/^---\s*$/m);
  const errs = [];
  if (!/^title:/m.test(head)) errs.push("no title");
  if (!/^cover_scene:/m.test(head)) errs.push("no cover_scene");
  const body = pages.join("\n");
  if ((body.match(/\[PERSONAL_DETAIL_SLOT\]/g) || []).length !== 1) errs.push("PERSONAL_DETAIL_SLOT count≠1");
  if ((body.match(/\[INTERACTIVE_SLOT\]/g) || []).length !== 1) errs.push("INTERACTIVE_SLOT count≠1");
  if (!/\[\[SIDEKICK:[\s\S]*?\]\]/.test(body)) errs.push("no SIDEKICK block");
  for (const t of ["INTEREST_PLACE", "INTEREST_OBJECT", "INTEREST_ACTIVITY", "CHILD_NAME"]) if (!body.includes(`{{${t}}}`)) errs.push(`missing {{${t}}}`);
  const unknown = [...body.matchAll(/\{\{([A-Z_]+)\}\}/g)].map((m) => m[1]).filter((t) => !["CHILD_NAME","KEEPER","KEEPER_TITLE","SIDEKICK","INTEREST_WORLD","INTEREST_PLACE","INTEREST_OBJECT","INTEREST_ACTIVITY"].includes(t));
  if (unknown.length) errs.push("unknown tokens " + [...new Set(unknown)]);
  const badForks = [...body.matchAll(/\{\{[^{}]*\}\}/g)].map((m) => m[0]).filter((t) => !/^\{\{[A-Z_]+\}\}$/.test(t) && !/^\{\{[^|{}]+\|[^|{}]+\}\}$/.test(t));
  if (badForks.length) errs.push("malformed forks " + badForks.slice(0, 3));
  if (pages.length < 8 || pages.length > 11) errs.push(`pages=${pages.length}`);
  const pdIdx = pages.findIndex((p) => p.includes("[PERSONAL_DETAIL_SLOT]")), skIdx = pages.findIndex((p) => p.includes("[[SIDEKICK")), itIdx = pages.findIndex((p) => p.includes("[INTERACTIVE_SLOT]"));
  if (!(pdIdx < skIdx && skIdx < itIdx)) errs.push(`slot order pd=${pdIdx} sk=${skIdx} it=${itIdx}`);
  if (f.endsWith(".ar.md")) {
    // crude fusha smell test
    for (const w of [" قالت الأم", "يذهب", "ذهبت", "لماذا", "ماذا", "هل ", "سوف", "ليس ", "الذي", "التي "]) if (body.includes(w)) errs.push(`fusha? "${w.trim()}"`);
  }
  if (errs.length) { bad++; console.log(`✗ ${f}: ${errs.join("; ")}`); } else console.log(`✓ ${f} (${pages.length} pages)`);
}
process.exit(bad ? 1 : 0);
