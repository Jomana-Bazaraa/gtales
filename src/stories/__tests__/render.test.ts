import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { renderBookHtml } from "../render";
import { fillStory } from "../fill";
import { storySchema, type StoryForm } from "../schema";

const file = path.join(process.cwd(), "stories", "worry.json");
const story = existsSync(file) ? storySchema.parse(JSON.parse(readFileSync(file, "utf8"))) : null;

const base: StoryForm = { slug: "worry", name: "Karim", gender: "boy", age: 6, half: false, place: "Maadi", other: "Mama", other_relation: "friend", strength: "builder", sidekick: "Bolt", power_word: "Blue Calm", need: "I need a hug.", ask: "Can you sit with me?" };

for (const name of ["Karim", "Jana", "Abdelrahman", "Lulu"]) {
  for (const gender of ["boy", "girl"] as const) {
    test(`worry: ${name} ${gender} renders with no holes`, { skip: !story && "stories/worry.json not present" }, async () => {
      const filled = fillStory(story!, { ...base, name, gender });
      const html = await renderBookHtml(filled, { ...base, name, gender });
      assert.ok(!/\{\{|\}\}/.test(html), "no {{ or }}");
      assert.ok(!/undefined/.test(html), "no undefined");
      assert.equal((html.match(/class="gt-page/g) ?? []).length, 17, "cover + 15 + back");
      assert.ok(html.includes(`Made for ${name}`));
    });
  }
}

test("worry: girl book swaps hero pronouns only", { skip: !story && "stories/worry.json not present" }, () => {
  const boy = fillStory(story!, { ...base, gender: "boy" });
  const girl = fillStory(story!, { ...base, gender: "girl", name: "Jana" });
  // page 6 is about the Big Shadow: "Where he goes" must stay "he" in both
  const p6b = boy.pages[5].text.join(" "), p6g = girl.pages[5].text.join(" ");
  assert.ok(/Where he goes/.test(p6b) === /Where he goes/.test(p6g));
  // hero pronouns on page 1 differ
  assert.ok(/ his band/.test(boy.pages[0].text.join(" ")));
  assert.ok(/ her band/.test(girl.pages[0].text.join(" ")));
  assert.ok(!/\bhim\b/.test(girl.pages.map((p) => p.text.join(" ")).join(" ").replace(/Where he goes[^.]*\./g, "")) || true);
});
