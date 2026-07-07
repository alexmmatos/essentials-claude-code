const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { check } = require("../src/checks/agentMemory");

function emptyProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-agent-memory-"));
}

test("agentMemory: missing scores zero and recommends enabling it", () => {
  const root = emptyProject();
  const result = check(root);
  assert.equal(result.raw, 0);
  assert.ok(result.recommendations.some((r) => r.includes("memory: project")));
});

test("agentMemory: a populated agent-memory/ dir scores full marks", () => {
  const root = emptyProject();
  fs.mkdirSync(path.join(root, ".claude", "agent-memory", "check-writer"), { recursive: true });
  fs.writeFileSync(path.join(root, ".claude", "agent-memory", "check-writer", "MEMORY.md"), "# memory\n");

  const result = check(root);
  assert.equal(result.raw, 100);
  assert.deepEqual(result.recommendations, []);
});
