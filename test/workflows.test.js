const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { check } = require("../src/checks/workflows");

function emptyProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-workflows-"));
}

test("workflows: missing scores zero and recommends creating it", () => {
  const root = emptyProject();
  const result = check(root);
  assert.equal(result.raw, 0);
  assert.ok(result.recommendations.some((r) => r.includes(".claude/workflows/")));
});

test("workflows: a .js workflow present scores full marks", () => {
  const root = emptyProject();
  fs.mkdirSync(path.join(root, ".claude", "workflows"), { recursive: true });
  fs.writeFileSync(path.join(root, ".claude", "workflows", "release.js"), "module.exports = {};\n");

  const result = check(root);
  assert.equal(result.raw, 100);
  assert.deepEqual(result.recommendations, []);
});
