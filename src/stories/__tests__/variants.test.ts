import { test } from "node:test";
import assert from "node:assert/strict";
import { FILES } from "../index";
import { fillStory } from "../fill";
import { renderBookHtml } from "../render";
import { challengeSchema, storySchema, type StoryForm, type StoryJson } from "../schema";
import { applyStoryVariants, VARIANTS } from "../variants";

// Age variants + fun lines (stories/variants). Layout ("too much text") is checked in a browser: npm run check:fit.
type Variants = { fun: { page: number; requires: string[]; text: string }[]; little: Record<string, unknown> };

const FULL = { name: "Abdelrahman", other: "Mohamed Ali", place: "Sheikh Zayed", sidekick: "Captain Bolt", power_word: "I'm a dinosaur! RAWR!", snack: "ice cream", silly: "Fasoolya", need: "I need some quiet time." };
const formFor = (st: StoryJson, gender: "boy" | "girl", age: number, fun: boolean): StoryForm => {
  const { snack, silly, ...rest } = FULL;
  return { slug: st.slug, gender, age, half: false, strength: "builder", other_relation: st.other_rule === "not_sibling" ? "school" : "brother", ...rest, ...(fun ? { snack, silly } : {}) };
};
const textOf = (s: StoryJson) => s.pages.flatMap((p) => p.text).join("\n");

for (const [slug, raw] of Object.entries(FILES)) {
  const st = storySchema.parse(raw);
  const v = VARIANTS[slug] as Variants | undefined;

  test(`${slug}: variants file exists and its little challenges are valid challenges`, () => {
    assert.ok(v, `stories/variants/${slug}.json`);
    for (const [n, ch] of Object.entries(v!.little)) {
      assert.ok(challengeSchema.safeParse(ch).success, `little page ${n}`);
      assert.ok(st.pages.find((p) => p.n === Number(n))?.challenge, `page ${n} has a challenge to replace`);
    }
  });

  for (const gender of ["boy", "girl"] as const) {
    for (const age of [2, 4, 8, 10]) {
      for (const fun of [true, false]) {
        test(`${slug} ${gender} age ${age} ${fun ? "with" : "without"} snack/silly: renders with no holes`, async () => {
          const form = formFor(st, gender, age, fun);
          const filled = fillStory(applyStoryVariants(st, form), form);
          for (const variant of ["web", "print"] as const) {
            const html = await renderBookHtml(filled, form, variant);
            assert.ok(!/\{\{|\}\}/.test(html), "no {{ or }}");
            assert.ok(!/undefined/.test(html), "no undefined");
            assert.equal((html.match(/class="gt-page/g) ?? []).length, 17, "cover + 15 + back");
          }
          const text = textOf(filled);
          const lines = st.pages.reduce((a, p) => a + p.text.length, 0) + (fun ? v!.fun.length : 0);
          assert.equal(filled.pages.reduce((a, p) => a + p.text.length, 0), lines, fun ? "both fun lines inserted" : "no fun lines");
          assert.equal(/Fasoolya/.test(text), fun && v!.fun.some((f) => f.requires.includes("silly")), "silly word");
          assert.equal(/ice cream/i.test(text), fun && v!.fun.some((f) => f.requires.includes("snack")), "snack");
        });
      }
    }
  }

  test(`${slug}: ages 2–5 get the little challenges, 6–10 keep the originals`, () => {
    for (const age of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const form = formFor(st, "girl", age, true);
      const varied = applyStoryVariants(st, form);
      for (const p of st.pages.filter((x) => x.challenge)) {
        const little = v!.little[String(p.n)];
        const expected = age <= 5 && little ? challengeSchema.parse(little) : p.challenge;
        assert.equal(challengeSchema.parse(varied.pages[p.n - 1].challenge).question, expected!.question, `age ${age} page ${p.n}`);
      }
    }
  });

  test(`${slug}: applyVariants never changes the story it was given`, () => {
    const before = JSON.stringify(st);
    applyStoryVariants(st, formFor(st, "boy", 4, true));
    assert.equal(JSON.stringify(st), before);
  });
}

test("a tale without a variants file is returned unchanged", () => {
  const st = storySchema.parse(FILES.anger);
  const other = { ...st, slug: "no-such-tale" };
  assert.equal(applyStoryVariants(other, formFor(other, "boy", 4, true)), other);
});
