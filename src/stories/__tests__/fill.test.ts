import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ageInWords, capitaliseName, fillStory, fillText, possessive, storyStrings } from "../fill";
import { validatePolish } from "../polish";
import { findUnsafe } from "../safety";
import { storySchema, type StoryForm } from "../schema";

const story = storySchema.parse(JSON.parse(readFileSync(path.join(__dirname, "sample.json"), "utf8")));

const base: StoryForm = {
  slug: "sample", name: "adam", gender: "boy", age: 6, half: false, place: "Maadi", other: "omar", other_relation: "brother",
  strength: "Builder", sidekick: "bolt", power_word: "Blue Calm", need: "I need a hug.", ask: "Can you sit with me?",
};

const forms: Array<Partial<StoryForm> & { label: string }> = [
  { label: "Adam boy" },
  { label: "Jana girl", name: "jana", gender: "girl", other: "Farida", other_relation: "sister" },
  { label: "Yassin", name: "Yassin", age: 7, half: true },
  { label: "Lulu", name: "lulu", gender: "girl", place: "Smouha" },
  { label: "Abdelrahman", name: "abdelrahman", sidekick: "Zigzag" },
  { label: "name ending in s", name: "Wrecks", other: "Anas" },
  { label: "double-barrel", name: "lulu-mae", gender: "girl" },
  { label: "two words", name: "abdel rahman" },
  { label: "age four", age: 4 },
  { label: "age eight girl", age: 8, gender: "girl", name: "Hana" },
  { label: "power word lowercase", power_word: "slow breath" },
  { label: "sidekick ending in s", sidekick: "Boss" },
];

for (const f of forms) {
  test(`fillStory: ${f.label}`, () => {
    const { label: _l, ...over } = f;
    void _l;
    const out = fillStory(story, { ...base, ...over });
    const all = storyStrings(out).join("\n");
    assert.ok(!/\{\{|\}\}/.test(all), "no leftover tokens");
    assert.ok(!/\(Name\)|\(Place\)/.test(all));
    const name = capitaliseName(over.name ?? base.name);
    assert.ok(all.includes(name), `name ${name} present`);
    assert.ok(out.title.startsWith(name));
    if ((over.gender ?? base.gender) === "girl") {
      assert.ok(all.includes("She was the best"), "She at sentence start");
      assert.ok(!/\bhe\b|\bhim\b|\bhis\b/i.test(all.replace(/the end/i, "")), "no male pronouns in girl book");
    } else {
      assert.ok(all.includes("He was the best"));
    }
    assert.ok(all.includes(ageInWords(over.age ?? base.age, over.half ?? base.half)));
  });
}

test("possessive rule", () => {
  assert.equal(possessive("Adam"), "Adam's");
  assert.equal(possessive("Wrecks"), "Wrecks'");
  assert.equal(possessive("Anas"), "Anas'");
  const out = fillStory(story, { ...base, name: "Wrecks" });
  assert.ok(out.pages[1].text[0].startsWith("Wrecks' room"));
  assert.ok(out.pages[1].challenge!.question.includes("Wrecks' band"));
});

test("capitals: token at sentence start, pronouns by case", () => {
  const out = fillStory(story, { ...base, strength: "builder", gender: "girl", name: "Jana" });
  assert.equal(out.pages[0].text[1], "She was the best builder in Maadi.");
  assert.equal(out.pages[1].text[0], "Jana's room went dark. Her band glowed.");
  assert.equal(out.pages[5].text[0], "She took three slow breaths.");
  assert.equal(out.pages[8].text[0], "Bolt's wings glowed. Her fear got smaller.");
});

test("capitaliseName", () => {
  assert.equal(capitaliseName("adam"), "Adam");
  assert.equal(capitaliseName("abdel rahman"), "Abdel Rahman");
  assert.equal(capitaliseName("lulu-mae"), "Lulu-Mae");
  assert.equal(capitaliseName("  yassin  "), "Yassin");
});

test("age in words", () => {
  assert.equal(ageInWords(6), "six");
  assert.equal(ageInWords(6, true), "six and a half");
  assert.throws(() => ageInWords(12));
});

test("throws on missing value and on leftover token", () => {
  assert.throws(() => fillStory(story, { ...base, sidekick: "" }), /sidekick/);
  assert.throws(() => fillStory(story, { ...base, need: "I need a pony." }), /Need/);
  assert.throws(() => fillText("Hello {{nobody}}", { name: "A" }, {}), /Unknown token/);
});

test("other_rule not_sibling is enforced", () => {
  const s = { ...story, other_rule: "not_sibling" as const };
  assert.throws(() => fillStory(s, { ...base, other_relation: "brother" }), /school or the park/);
  assert.doesNotThrow(() => fillStory(s, { ...base, other_relation: "school" }));
});

test("validatePolish accepts a harmless edit and rejects a story change", () => {
  const filled = fillStory(story, base);
  const keep = { name: "Adam", sidekick: "Bolt", power_word: "Blue Calm", place: "Maadi", other: "Omar" };
  const ok = structuredClone(filled);
  ok.pages[0].text[1] = "He was the best builder in all of Maadi.";
  assert.deepEqual(validatePolish(filled, ok, keep), []);
  const bad = structuredClone(filled);
  bad.pages[11].challenge!.steps![0] = "Wait.";
  assert.ok(validatePolish(filled, bad, keep).some((p) => p.includes("Combo")));
  const bad2 = structuredClone(filled);
  bad2.pages[2].text[0] = "\"Bolt!\" said Adam. Bolt and Karim flew to him.";
  assert.ok(validatePolish(filled, bad2, keep).some((p) => p.includes("new name")));
  const bad3 = structuredClone(filled);
  bad3.pages[0].text[0] = "It was bedtime in Maadi and the moon was high and the stars were bright and everyone was very very sleepy indeed.";
  assert.ok(validatePolish(filled, bad3, keep).some((p) => p.includes("14 words")));
});

test("safety check catches English and Franco-Arabic, passes names", () => {
  assert.equal(findUnsafe("Adam"), null);
  assert.equal(findUnsafe("Abdelrahman"), null);
  assert.equal(findUnsafe("Blue Calm"), null);
  assert.ok(findUnsafe("you are a bitch"));
  assert.ok(findUnsafe("ya 5awal"));
  assert.ok(findUnsafe("ibn el kalb"));
  assert.ok(findUnsafe("shiiiit"));
});
