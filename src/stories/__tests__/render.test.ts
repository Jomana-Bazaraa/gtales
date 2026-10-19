import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { renderBookHtml } from "../render";
import { fillStory } from "../fill";
import { storySchema, type StoryForm } from "../schema";

import { readdirSync } from "node:fs";
import { storyFolder } from "../images";

const file = path.join(process.cwd(), "stories", "worry.json");
const story = existsSync(file) ? storySchema.parse(JSON.parse(readFileSync(file, "utf8"))) : null;

const base: StoryForm = { slug: "worry", name: "Karim", gender: "boy", age: 6, half: false, place: "Maadi", other: "Mama", other_relation: "friend", strength: "builder", sidekick: "Bolt", power_word: "Blue Calm", need: "I need a hug." };

// Every story, both genders, the four names from the handoff brief. Rendering needs no images;
// a missing image set only makes that story/gender "coming soon" in the app (checked separately).
const storiesDir = path.join(process.cwd(), "stories");
const slugs = existsSync(storiesDir) ? readdirSync(storiesDir).filter((f) => f.endsWith(".json") && f !== "builder-options.json").map((f) => f.replace(/\.json$/, "")) : [];
const formFor = (st: ReturnType<typeof storySchema.parse>, name: string, gender: "boy" | "girl"): StoryForm =>
  ({ ...base, slug: st.slug, name, gender, other_relation: st.other_rule === "not_sibling" ? "school" : "friend", need: "I need a hug." });
const PRON: Record<string, string[]> = { he: ["she"], him: ["her"], his: ["her", "hers"], He: ["She"], Him: ["Her"], His: ["Her"] };

for (const slug of slugs) {
  const st = storySchema.parse(JSON.parse(readFileSync(path.join(storiesDir, `${slug}.json`), "utf8")));
  for (const gender of ["boy", "girl"] as const) {
    for (const name of ["Karim", "Jana", "Abdelrahman", "Lulu"]) {
      test(`${slug} ${gender}: ${name} renders with no holes`, async () => {
        const form = formFor(st, name, gender);
        const filled = fillStory(st, form);
        for (const variant of ["web", "print"] as const) {
          const html = await renderBookHtml(filled, form, variant);
          assert.ok(!/\{\{|\}\}/.test(html), "no {{ or }}");
          assert.ok(!/undefined/.test(html), "no undefined");
          assert.equal((html.match(/class="gt-page/g) ?? []).length, 17, "cover + 15 + back");
          assert.ok(html.includes(`Made for ${name}`));
          assert.ok(html.includes(`${variant === "print" ? "/stories" : "/stories-web"}/${storyFolder(slug)}/${gender}/cover.jpg`), `${variant} image base`);
        }
      });
    }
  }
  test(`${slug}: girl book differs from boy book only in the hero's pronouns`, () => {
    const boy = fillStory(st, formFor(st, "Lulu", "boy"));
    const girl = fillStory(st, formFor(st, "Lulu", "girl"));
    const words = (f: typeof boy) => JSON.stringify({ t: f.title, b: f.back_blurb, p: f.pages.map((p) => [p.text, p.sign, p.screen, p.challenge]) }).split(/\b/);
    const wb = words(boy), wg = words(girl);
    assert.equal(wb.length, wg.length, "same word count");
    let swaps = 0;
    for (let i = 0; i < wb.length; i++) {
      if (wb[i] === wg[i]) continue;
      assert.ok(PRON[wb[i]]?.includes(wg[i]), `only pronouns may change: "${wb[i]}" → "${wg[i]}"`);
      swaps++;
    }
    assert.ok(swaps > 0, "the girl book has she/her somewhere");
  });
  for (const gender of ["boy", "girl"] as const) {
    test(`${slug} ${gender}: image set is complete or absent (never partial)`, () => {
      for (const root of ["stories", "stories-web"]) {
        const dir = path.join(process.cwd(), "public", root, storyFolder(slug), gender);
        if (!existsSync(dir)) continue;
        const need = ["cover.jpg", "back.jpg", ...st.pages.map((p) => p.image ?? `p${String(p.n).padStart(2, "0")}.jpg`)];
        for (const f of need) assert.ok(existsSync(path.join(dir, f)), `${root}/${storyFolder(slug)}/${gender}/${f}`);
      }
    });
  }
}

test("worry: 'Where he goes' on page 6 is about the Big Shadow and stays 'he' for a girl", { skip: !story && "stories/worry.json not present" }, () => {
  const boy = fillStory(story!, { ...base, gender: "boy" });
  const girl = fillStory(story!, { ...base, gender: "girl", name: "Jana" });
  const p6b = boy.pages[5].text.join(" "), p6g = girl.pages[5].text.join(" ");
  assert.ok(/Where he goes/.test(p6b) && /Where he goes/.test(p6g));
  assert.ok(/ his band/.test(boy.pages[0].text.join(" ")));
  assert.ok(/ her band/.test(girl.pages[0].text.join(" ")));
});
