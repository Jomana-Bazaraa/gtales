import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { FILES } from "../index";
import { IMAGE_SETS } from "../images";
import { VARIANTS } from "../variants";

// The server reads stories and image sets from static lists (no filesystem on Cloudflare Workers).
// These tests keep the lists honest against the repo.
const root = path.join(__dirname, "..", "..", "..");

test("every stories/*.json is imported in src/stories/index.ts", () => {
  const onDisk = readdirSync(path.join(root, "stories")).filter((f) => f.endsWith(".json") && f !== "builder-options.json").map((f) => f.replace(/\.json$/, "")).sort();
  assert.deepEqual(Object.keys(FILES).sort(), onDisk);
});

test("every stories/variants/*.json is imported in src/stories/variants.ts", () => {
  const onDisk = readdirSync(path.join(root, "stories", "variants")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
  assert.deepEqual(Object.keys(VARIANTS).sort(), onDisk);
});

test("IMAGE_SETS matches the image folders (full size and web copies)", () => {
  for (const tree of ["stories", "stories-web"]) {
    const found: Record<string, string[]> = {};
    for (const folder of readdirSync(path.join(root, "public", tree))) {
      const genders = (["boy", "girl"] as const).filter((g) => existsSync(path.join(root, "public", tree, folder, g, "cover.jpg")));
      if (genders.length) found[folder] = [...genders];
    }
    const listed = Object.fromEntries(Object.entries(IMAGE_SETS).filter(([, g]) => g.length).map(([k, g]) => [k, [...g].sort()]));
    assert.deepEqual(found, listed, `public/${tree}`);
  }
});
