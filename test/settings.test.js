const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { check } = require("../src/checks/settings");

function writeSettings(contents) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "arthur-settings-"));
  fs.mkdirSync(path.join(root, ".claude"), { recursive: true });
  fs.writeFileSync(path.join(root, ".claude", "settings.json"), JSON.stringify(contents, null, 2));
  return root;
}

const BASE = {
  permissions: { allow: ["Bash(npm test)"] },
  hooks: { PostToolUse: [{ matcher: "Edit", hooks: [{ type: "command", command: "echo ok" }] }] },
};

test("settings: statusLine configured scores full marks", () => {
  const root = writeSettings({ ...BASE, statusLine: { type: "command", command: "echo status" } });
  const result = check(root);
  assert.equal(result.points, result.weight);
});

test("settings: no statusLine scores lower and recommends adding one", () => {
  const root = writeSettings(BASE);
  const result = check(root);
  assert.ok(result.points < result.weight);
  assert.ok(result.recommendations.some((r) => r.includes("statusLine")));
});
