const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { check } = require("../src/checks/worktreeInclude");

function emptyProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-worktree-include-"));
}

test("worktreeInclude: missing scores zero and recommends creating it", () => {
  const root = emptyProject();
  const result = check(root);
  assert.equal(result.raw, 0);
  assert.ok(result.recommendations.some((r) => r.includes(".worktreeinclude")));
});

test("worktreeInclude: .worktreeinclude present scores full marks", () => {
  const root = emptyProject();
  fs.writeFileSync(path.join(root, ".worktreeinclude"), ".env\n");

  const result = check(root);
  assert.equal(result.raw, 100);
  assert.deepEqual(result.recommendations, []);
});
