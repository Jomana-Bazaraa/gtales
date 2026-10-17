#!/usr/bin/env node
/**
 * `npm run cf:preview`: locally, build the Worker and serve it on http://localhost:8787.
 * On Cloudflare's build machine (WORKERS_CI / CI set) a preview server would never exit and the
 * build times out after 30 min, so there it deploys the Worker the build step already made.
 */
import { spawnSync } from "node:child_process";

const run = (...args) => {
  const r = spawnSync("npx", ["opennextjs-cloudflare", ...args], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (process.env.WORKERS_CI || process.env.CI) {
  console.log("[cf:preview] CI detected: deploying instead of starting a preview server");
  run("deploy");
} else {
  run("build");
  run("preview");
}
