const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { inspect } = require("../src/index");
const { buildFixPrompt } = require("../src/fixPrompt");
const { renderFixPrompt } = require("../src/report");

function emptyProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-fixprompt-"));
}

test("buildFixPrompt: mentions the score and lists every category with a gap", () => {
  const result = inspect(emptyProject());
  const prompt = buildFixPrompt(result);
  assert.ok(prompt.includes(`${result.total}/${result.maxTotal}`));
  for (const rec of result.recommendations) {
    assert.ok(prompt.includes(rec.category));
    assert.ok(prompt.includes(rec.explanation));
  }
});

test("buildFixPrompt: orders categories by gap, biggest first", () => {
  const result = inspect(emptyProject());
  const prompt = buildFixPrompt(result);
  const positions = result.recommendations.map((rec) => prompt.indexOf(rec.category));
  const sorted = [...positions].sort((a, b) => a - b);
  assert.deepEqual(positions, sorted);
});

test("buildFixPrompt: a fully-scored project has nothing to list", () => {
  const result = { total: 100, maxTotal: 100, recommendations: [] };
  const prompt = buildFixPrompt(result);
  assert.ok(prompt.includes("100/100"));
  assert.ok(prompt.includes("Keep the changes minimal"));
});

test("buildFixPrompt: an existing settings.json is flagged for manual review, not auto-edited", () => {
  const root = emptyProject();
  fs.mkdirSync(path.join(root, ".claude"), { recursive: true });
  fs.writeFileSync(path.join(root, ".claude", "settings.json"), JSON.stringify({ hooks: {} }, null, 2));

  const result = inspect(root);
  const prompt = buildFixPrompt(result);

  const settingsRec = result.recommendations.find((rec) => rec.id === "settings");
  assert.ok(settingsRec.skipInFixPrompt);
  assert.ok(!prompt.includes("Configure permissions.allow/deny"));
  assert.ok(!prompt.includes("Consider configuring statusLine"));
  assert.ok(prompt.includes("security-sensitive Claude Code config"));
  assert.ok(prompt.includes(settingsRec.category));
});

test("renderFixPrompt: appends the attention banner in English", () => {
  const rendered = renderFixPrompt("some prompt body", { color: false });
  assert.ok(rendered.includes("some prompt body"));
  assert.ok(rendered.includes("Paste this into Claude Code so it generates the files."));
});

test("renderFixPrompt: banner uses color codes unless disabled", () => {
  const colored = renderFixPrompt("x", { color: true });
  const plain = renderFixPrompt("x", { color: false });
  assert.ok(colored.includes("\x1b["));
  assert.ok(!plain.includes("\x1b["));
});
