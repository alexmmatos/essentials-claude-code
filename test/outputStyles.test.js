const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { check } = require("../src/checks/outputStyles");

function emptyProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-output-styles-"));
}

test("outputStyles: missing scores zero and recommends creating it", () => {
  const root = emptyProject();
  const result = check(root);
  assert.equal(result.raw, 0);
  assert.ok(result.recommendations.some((r) => r.includes(".claude/output-styles/")));
});

test("outputStyles: a .md file present scores full marks", () => {
  const root = emptyProject();
  fs.mkdirSync(path.join(root, ".claude", "output-styles"), { recursive: true });
  fs.writeFileSync(path.join(root, ".claude", "output-styles", "concise.md"), "# concise\n");

  const result = check(root);
  assert.equal(result.raw, 100);
  assert.deepEqual(result.recommendations, []);
});
