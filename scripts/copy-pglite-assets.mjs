#!/usr/bin/env node
/**
 * After `vite build` (Nitro Vercel output):
 *  1. Copy PGLite wasm/data next to the serverless entry (missing files 500).
 *  2. Boot the function after setting BETTER_AUTH_URL from Vercel host env so
 *     email sign-in is not rejected as "Invalid origin".
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, "node_modules", "@electric-sql", "pglite", "dist");
const names = ["pglite.data", "pglite.wasm", "initdb.wasm"];

function findDirs(dir, match, found = []) {
  if (!existsSync(dir)) return found;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const next = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === match) found.push(next);
      else findDirs(next, match, found);
    }
  }
  return found;
}

const functionsRoot = join(root, ".vercel", "output", "functions");
const dests = findDirs(functionsRoot, "_libs");
if (dests.length === 0) {
  dests.push(join(functionsRoot, "__server.func", "_libs"));
}

let copied = 0;
for (const dest of dests) {
  mkdirSync(dest, { recursive: true });
  for (const name of names) {
    const from = join(srcDir, name);
    if (!existsSync(from)) continue;
    copyFileSync(from, join(dest, name));
    copied += 1;
  }
}

const funcDir = join(functionsRoot, "__server.func");
const bootPath = join(funcDir, "boot.mjs");
const vcPath = join(funcDir, ".vc-config.json");
if (existsSync(funcDir)) {
  writeFileSync(
    bootPath,
    `if (!process.env.BETTER_AUTH_URL) {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "xalmorak-hub-xalmorak.vercel.app";
  process.env.BETTER_AUTH_URL = String(host).startsWith("http")
    ? String(host)
    : \`https://\${host}\`;
}
const mod = await import("./index.mjs");
export default mod.default;
`,
  );
  if (existsSync(vcPath)) {
    const vc = JSON.parse(readFileSync(vcPath, "utf8"));
    vc.handler = "boot.mjs";
    writeFileSync(vcPath, `${JSON.stringify(vc, null, 2)}\n`);
  }
}

console.log(`[pglite] copied ${copied} asset(s) into ${dests.length} _libs dir(s); boot.mjs ready`);
