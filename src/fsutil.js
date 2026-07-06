const fs = require("node:fs");
const path = require("node:path");

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function readJsonSafe(p) {
  const raw = readFileSafe(p);
  if (raw === null) return { ok: false, exists: false, data: null, error: null };
  try {
    return { ok: true, exists: true, data: JSON.parse(raw), error: null };
  } catch (err) {
    return { ok: false, exists: true, data: null, error: err.message };
  }
}

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".next", ".turbo", "vendor"]);

/** Recursively collect files under `dir` matching `predicate(relativePath)`. Skips heavy/irrelevant dirs. */
function walkFiles(dir, predicate, base = dir) {
  const results = [];
  if (!isDir(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, predicate, base));
    } else if (entry.isFile()) {
      const rel = path.relative(base, full);
      if (!predicate || predicate(rel, full)) results.push(full);
    }
  }
  return results;
}

module.exports = { exists, isDir, readFileSafe, readJsonSafe, walkFiles };
