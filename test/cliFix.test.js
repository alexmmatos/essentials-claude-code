const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const CLI = path.join(__dirname, "..", "bin", "cli.js");

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-fix-"));
}

function runFix(root) {
  return execFileSync("node", [CLI, root, "--fix", "--no-color"], { encoding: "utf8" });
}

test("--fix prints the paste-into-Claude-Code prompt directly, without asking anything", () => {
  const output = runFix(tempProject());
  assert.ok(output.includes("Paste this into Claude Code so it generates the files."));
});

test("--fix does not touch the filesystem — no scaffolding, no prompt", () => {
  const root = tempProject();
  runFix(root);
  assert.ok(!fs.existsSync(path.join(root, "CLAUDE.md")));
});

test("--fix does not hang waiting for stdin", () => {
  const output = execFileSync("node", [CLI, tempProject(), "--fix", "--no-color"], {
    encoding: "utf8",
    input: "",
  });
  assert.ok(output.length > 0);
});
