/** Re-render the PDFs of already-generated sample stories (no Gemini calls). Usage: npm run pdfs [-- <storyId>] */
import { readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import path from "node:path";
const envFile = path.join(process.cwd(), ".env.local");
if (existsSync(envFile)) for (const line of readFileSync(envFile, "utf8").split("\n")) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY; process.env.PDF_DISABLED = "";
if (!process.env.PUPPETEER_EXECUTABLE_PATH || !existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) { console.error("✗ PUPPETEER_EXECUTABLE_PATH in .env.local must point to Chrome"); process.exit(1); }
const { renderStoryPdf } = await import("../src/lib/pdf");
const { getStory } = await import("../src/lib/db");
const { spawn } = await import("node:child_process");
const only = process.argv[2];
let ids = readdirSync(path.join(".data", "stories")).map((f) => f.replace(/\.json$/, "")).filter((id) => id.startsWith("sample-"));
if (only) ids = ids.filter((id) => id === only);
// newest first; keep only the latest per struggle-lang unless an id was given
if (!only) {
  const { statSync } = await import("node:fs");
  const seen = new Set<string>();
  ids = ids.sort((a, b) => statSync(path.join(".data", "stories", `${b}.json`)).mtimeMs - statSync(path.join(".data", "stories", `${a}.json`)).mtimeMs);
  ids = ids.filter((id) => { const k = id.split("-").slice(1, 3).join("-"); if (seen.has(k)) return false; seen.add(k); return true; });
}
console.log("Stories: " + ids.join(", "));
const port = 3123;
console.log("Starting the app on port " + port + "…");
const base = `http://localhost:${port}`;
const up = async () => { try { return (await fetch(base, { signal: AbortSignal.timeout(3000) })).ok; } catch { return false; } };
let server: ReturnType<typeof spawn> | null = null;
if (await up() && process.platform === "win32") {
  // a previous run's server may still hold the port (Windows does not kill the child tree) — free it so we serve the fresh build
  const { execSync } = await import("node:child_process");
  try {
    const out = execSync(`netstat -ano -p tcp | findstr :${port}`, { encoding: "utf8" });
    for (const pid of new Set(out.split("\n").filter((l) => l.includes("LISTENING")).map((l) => l.trim().split(/\s+/).pop()).filter(Boolean))) { try { execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" }); } catch { /* */ } }
    await new Promise((r) => setTimeout(r, 1500));
  } catch { /* */ }
}
if (await up()) {
  console.log("⚠ Something is already listening on port " + port + " (an old server?) — using it. If the PDFs look stale, close it and re-run.");
} else {
  const win = process.platform === "win32";
  server = spawn(win ? "cmd.exe" : "npx", win ? ["/c", "npx", "next", "start", "-p", String(port)] : ["next", "start", "-p", String(port)], { stdio: ["ignore", "inherit", "inherit"] });
  let ok = false;
  for (let i = 0; i < 90 && !ok; i++) { ok = await up(); if (!ok) await new Promise((r) => setTimeout(r, 1000)); }
  if (!ok) { console.error("✗ The app did not start on port " + port); server.kill(); process.exit(1); }
}
mkdirSync("samples", { recursive: true });
for (const id of ids) {
  const s = await getStory(id);
  if (!s?.assembled) continue;
  const tag = id.split("-").slice(1, 3).join("-");
  try {
    const c = await renderStoryPdf(id, "color", base), l = await renderStoryPdf(id, "lineart", base);
    const src = (u: string) => path.join(process.cwd(), ".data", "files", u.replace(/^\/api\/files\//, ""));
    copyFileSync(src(c), path.join("samples", `${tag}-book.pdf`)); copyFileSync(src(l), path.join("samples", `${tag}-activity.pdf`));
    console.log(`✓ samples/${tag}-book.pdf`);
  } catch (e) { console.log(`✗ ${id}: ${e instanceof Error ? e.message : e}`); }
}
if (server) {
  if (process.platform === "win32" && server.pid) { const { execSync } = await import("node:child_process"); try { execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" }); } catch { /* */ } }
  else server.kill();
}
process.exit(0);
