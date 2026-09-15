#!/usr/bin/env node
/**
 * Nitro's Vercel output sometimes omits PGLite's wasm payload. Without
 * pglite.data the deployed server 500s on every page that touches the DB.
 * Copy the files next to the serverless entry after `vite build`.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, "node_modules", "@electric-sql", "pglite", "dist");
const names = ["pglite.data", "pglite.wasm", "initdb.wasm"];

function findLibDirs(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const next = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "_libs") found.push(next);
      else findLibDirs(next, found);
    }
  }
  return found;
}

const dests = findLibDirs(join(root, ".vercel", "output", "functions"));
if (dests.length === 0) {
  dests.push(join(root, ".vercel", "output", "functions", "__server.func", "_libs"));
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

console.log(`[pglite] copied ${copied} asset(s) into ${dests.length} _libs dir(s)`);
