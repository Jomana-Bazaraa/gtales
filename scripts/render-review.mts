import { writeFileSync } from "node:fs";
import { loadTemplate, substitute, assemblePages } from "../src/lib/template-engine";
import { KEEPERS, STRUGGLES } from "../src/lib/keepers";
const out: Record<string, string> = {};
for (const s of STRUGGLES) {
  if (!s.template) continue;
  let md = "";
  for (const lang of ["en", "ar"] as const) {
    const tpl = await loadTemplate(s.template, lang);
    const ar = lang === "ar";
    const ctx = { childName: ar ? "آدم" : "Adam", gender: "boy" as const, keeper: s.keeper!, lang, sidekick: ar ? "عمر" : "Omar",
      interest: ar ? { world: "عالم الكورة", place: "ملعب الكورة اللي ورا البيت", object: "كورته المفضلة", activity: "بيتمرن على ضربات الجزاء" } : { world: "the world of football", place: "the football pitch behind the house", object: "his favourite football", activity: "practising penalties" },
      personalDetail: ar ? "**[جملة الذكاء الاصطناعي — التفصيلة الشخصية من الأهل]**" : "**[AI sentence — the parent's personal detail goes here]**" };
    const pages = assemblePages(tpl, ctx, []);
    md += `### ${ar ? "عربي" : "English"} — ${substitute(tpl.title, ctx)}\n\n`;
    let n = 0;
    for (const p of pages) {
      if (p.kind === "text") { n++; md += `**${ar ? "صفحة" : "Page"} ${n}**\n\n${p.paragraphs!.join("\n\n")}\n\n`; }
      else if (p.kind === "challenge") md += `*${ar ? "[هنا صفحة التحدي — متاهة/لغز/اختيار حسب اختيار الأهل]" : "[Challenge page here — maze / riddle / choose-the-path, per the parent's choice]"}*\n\n`;
    }
  }
  out[s.template] = md;
}
writeFileSync("/tmp/claude-0/-home-claude/c142683f-b853-5f2c-81c6-5da416c8f0b5/scratchpad/review.json", JSON.stringify(out));
console.log(Object.keys(out).length, Object.values(out).reduce((a, b) => a + b.length, 0));
