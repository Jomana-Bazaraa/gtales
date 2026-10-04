import { loadTemplate, substitute, assemblePages } from "../src/lib/template-engine";
const keys = ["blaze-anger","blaze-violence","blaze-bullying","wisp-anxiety","pip-friendship","zigzag-sibling","bolt-confidence","chroma-emotions","willow-loss","pebble-bullied","tangle-lying"] as const;
const keeperOf: Record<string, string> = { blaze: "blaze", wisp: "wisp", pip: "pip", zigzag: "zigzag", bolt: "bolt", chroma: "chroma", willow: "willow", pebble: "pebble", tangle: "tangle" };
let bad = 0;
for (const key of keys) for (const lang of ["en", "ar"] as const) for (const gender of ["boy", "girl"] as const) for (const sidekick of [undefined, lang === "ar" ? "عمر" : "Omar"]) {
  const tpl = await loadTemplate(key, lang);
  const ctx = { childName: lang === "ar" ? "آدم" : "Adam", gender, keeper: keeperOf[key.split("-")[0]] as never, lang, sidekick, interest: lang === "ar" ? { world: "عالم الكورة", place: "ملعب الكورة", object: "كورته", activity: "بيلعب كورة" } : { world: "the world of football", place: "the football pitch", object: "his football", activity: "practising penalties" }, personalDetail: "PD." };
  const pages = assemblePages(tpl, ctx, ["maze"]);
  const text = pages.map((p) => (p.paragraphs ?? []).join("\n")).join("\n") + substitute(tpl.title, ctx);
  const leftovers = text.match(/\{\{|\}\}|\[\[|\]\]|\[PERSONAL|\[INTERACTIVE/g);
  if (leftovers) { bad++; console.log(`✗ ${key}.${lang} ${gender} sk=${!!sidekick}: leftovers ${[...new Set(leftovers)]}`); }
}
console.log(bad ? `${bad} failures` : "all renders clean");
process.exit(bad ? 1 : 0);
