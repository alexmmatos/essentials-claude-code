const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { detect } = require("../src/languages");

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-lang-"));
}

test("languages: package.json alone is detected as JavaScript/TypeScript", () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "package.json"), "{}");
  const result = detect(root);
  assert.equal(result.matches[0], "node");
  assert.equal(result.primary.label, "JavaScript/TypeScript");
});

test("languages: requirements.txt is detected as Python", () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "requirements.txt"), "flask\n");
  const result = detect(root);
  assert.equal(result.primary.label, "Python");
});

test("languages: no manifest falls back to extension counts", () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "main.go"), "package main\n");
  fs.writeFileSync(path.join(root, "util.go"), "package main\n");
  const result = detect(root);
  assert.equal(result.matches.length, 0);
  assert.equal(result.primary.label, "Go");
  assert.equal(result.breakdown[0].language, "Go");
  assert.equal(result.breakdown[0].percent, 100);
});

test("languages: empty project has no primary language", () => {
  const root = tempProject();
  const result = detect(root);
  assert.equal(result.primary, null);
  assert.deepEqual(result.breakdown, []);
});

test("languages: node_modules is excluded from the extension breakdown", () => {
  const root = tempProject();
  fs.mkdirSync(path.join(root, "node_modules", "dep"), { recursive: true });
  fs.writeFileSync(path.join(root, "node_modules", "dep", "index.js"), "module.exports = {};\n");
  fs.writeFileSync(path.join(root, "app.py"), "print('hi')\n");
  const result = detect(root);
  assert.equal(result.primary.label, "Python");
});

test("languages: multiple manifests pick the one with more source files", () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "package.json"), "{}");
  fs.writeFileSync(path.join(root, "pyproject.toml"), "[tool.poetry]\n");
  fs.writeFileSync(path.join(root, "a.py"), "print(1)\n");
  fs.writeFileSync(path.join(root, "b.py"), "print(2)\n");
  fs.writeFileSync(path.join(root, "c.py"), "print(3)\n");
  fs.writeFileSync(path.join(root, "index.js"), "console.log(1)\n");
  const result = detect(root);
  assert.equal(result.matches.length, 2);
  assert.equal(result.primary.label, "Python");
});
