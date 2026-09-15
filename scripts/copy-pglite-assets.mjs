#!/usr/bin/env node
/**
 * After `vite build` (Nitro Vercel output):
 *  1. Copy PGLite wasm/data next to the serverless entry (missing files 500).
 *  2. Boot the function after setting BETTER_AUTH_URL from Vercel host env so
 *     email sign-in is not rejected as "Invalid origin".
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
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
const vcFiles = [];
walk(functionsRoot, (path, name) => {
  if (name === ".vc-config.json") vcFiles.push(path);
});
walk(functionsRoot, (path, name) => {
  /* collect dirs named _libs via parent of files inside them */
});
walk(join(root, ".vercel", "output"), (path, name) => {
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

const bootSource = `if (!process.env.BETTER_AUTH_URL) {
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
`;

let boots = 0;
const configs = vcFiles.length
  ? vcFiles
  : [join(functionsRoot, "__server.func", ".vc-config.json")];
for (const vcPath of configs) {
  const dir = dirname(vcPath);
  writeFileSync(join(dir, "boot.mjs"), bootSource);
  boots += 1;
  if (existsSync(vcPath)) {
    const vc = JSON.parse(readFileSync(vcPath, "utf8"));
    vc.handler = "boot.mjs";
    writeFileSync(vcPath, `${JSON.stringify(vc, null, 2)}\n`);
  }
}

const markerDir = join(root, ".vercel", "output", "static");
mkdirSync(markerDir, { recursive: true });
writeFileSync(
  join(markerDir, "boot-ok.txt"),
  `copied=${copied} libs=${libDirs.length} boots=${boots} vc=${vcFiles.length}\n`,
);

console.log(
  `[pglite] copied=${copied} libs=${libDirs.length} boots=${boots} vc=${vcFiles.length}`,
);
