const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { inspect } = require("../src/index");
const { renderTerminal, renderJson } = require("../src/report");

function emptyProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-report-"));
}

test("renderTerminal: explanations are hidden by default", () => {
  const result = inspect(emptyProject());
  const output = renderTerminal(result, { color: false });
  assert.ok(!output.includes("Why it matters"));
});

test("renderTerminal: --explain shows the 'why it matters' text for categories with gaps", () => {
  const result = inspect(emptyProject());
  const output = renderTerminal(result, { color: false, explain: true });
  assert.ok(output.includes("Why it matters"));
  assert.ok(output.includes("CLAUDE.md loads into context automatically"));
});

test("every category with a static explanation exposes it on the JSON result", () => {
  const result = inspect(emptyProject());
  for (const cat of result.categories) {
    assert.ok(cat.explanation, `expected an explanation for category "${cat.id}"`);
  }
});

test("renderJson: still valid JSON with the explanation field included", () => {
  const result = inspect(emptyProject());
  const parsed = JSON.parse(renderJson(result));
  assert.ok(parsed.categories[0].explanation);
});

test("renderTerminal: reports the manifest-detected language even with an empty extension breakdown", () => {
  const root = emptyProject();
  fs.writeFileSync(path.join(root, "package.json"), "{}");
  const result = inspect(root);
  assert.equal(result.languages.breakdown.length, 0);
  assert.equal(result.languages.primary.label, "JavaScript/TypeScript");
  const output = renderTerminal(result, { color: false });
  assert.ok(!output.includes("no programming language identified"));
  assert.ok(output.includes("JavaScript/TypeScript"));
});
