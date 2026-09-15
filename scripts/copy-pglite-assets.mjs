#!/usr/bin/env node
/**
 * After `vite build` (Nitro Vercel output):
 *  1. Copy PGLite wasm/data next to the serverless entry (missing files 500).
 *  2. Wrap index.mjs so BETTER_AUTH_URL is set from the Vercel host BEFORE
 *     Better Auth loads (otherwise public email sign-in is Invalid origin).
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, "node_modules", "@electric-sql", "pglite", "dist");
const names = ["pglite.data", "pglite.wasm", "initdb.wasm"];

function walk(dir, visit) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const next = join(dir, name.name);
    if (name.isDirectory()) walk(next, visit);
    else visit(next, name.name);
  }
}

const functionsRoot = join(root, ".vercel", "output", "functions");
const libDirs = [];
const indexFiles = [];
walk(functionsRoot, (path, name) => {
  if (name === "index.mjs") indexFiles.push(path);
  if (name === "pglite.wasm" || name === "electric-sql__pglite.mjs") {
    const dir = dirname(path);
    if (dir.endsWith("_libs") && !libDirs.includes(dir)) libDirs.push(dir);
  }
});

if (libDirs.length === 0) {
  libDirs.push(join(functionsRoot, "__server.func", "_libs"));
}

let copied = 0;
for (const dest of libDirs) {
  mkdirSync(dest, { recursive: true });
  for (const name of names) {
    const from = join(srcDir, name);
    if (!existsSync(from)) continue;
    copyFileSync(from, join(dest, name));
    copied += 1;
  }
}

const wrapSource = `if (!process.env.BETTER_AUTH_URL) {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "xalmorak-hub-xalmorak.vercel.app";
  process.env.BETTER_AUTH_URL = String(host).startsWith("http")
    ? String(host)
    : \`https://\${host}\`;
}
const mod = await import("./_app.mjs");
export default mod.default;
`;

let wraps = 0;
for (const indexPath of indexFiles) {
  const dir = dirname(indexPath);
  const appPath = join(dir, "_app.mjs");
  if (existsSync(appPath)) continue;
  renameSync(indexPath, appPath);
  writeFileSync(indexPath, wrapSource);
  wraps += 1;
}

const markerDir = join(root, ".vercel", "output", "static");
mkdirSync(markerDir, { recursive: true });
writeFileSync(
  join(markerDir, "boot-ok.txt"),
  `copied=${copied} libs=${libDirs.length} wraps=${wraps} indexes=${indexFiles.length}\n`,
);

console.log(
  `[pglite] copied=${copied} libs=${libDirs.length} wraps=${wraps} indexes=${indexFiles.length}`,
);
