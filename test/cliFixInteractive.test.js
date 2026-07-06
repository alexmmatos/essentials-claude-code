const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const CLI = path.join(__dirname, "..", "bin", "cli.js");

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-fix-interactive-"));
}

function runFix(root, input) {
  return execFileSync("node", [CLI, root, "--fix", "--no-color"], { encoding: "utf8", input });
}

test("--fix explains both options before asking", () => {
  const output = runFix(tempProject(), "");
  assert.ok(output.includes("--fix-basic"));
  assert.ok(output.includes("--fix-prompt"));
  assert.ok(output.includes("Choose 1 (basic) or 2 (prompt):"));
});

test("--fix with '1' runs --fix-basic", () => {
  const root = tempProject();
  const output = runFix(root, "1\n");

  assert.ok(output.includes("Creating missing scaffolding"));
  assert.ok(fs.existsSync(path.join(root, "CLAUDE.md")));
});

test("--fix with '2' runs --fix-prompt", () => {
  const root = tempProject();
  const output = runFix(root, "2\n");

  assert.ok(output.includes("Paste this into Claude Code so it generates the files."));
  assert.ok(!fs.existsSync(path.join(root, "CLAUDE.md")));
});

test("--fix accepts the word forms too ('basic' / 'prompt')", () => {
  const root = tempProject();
  const output = runFix(root, "basic\n");
  assert.ok(output.includes("Creating missing scaffolding"));
});

test("--fix with an unrecognized answer explains how to proceed instead of crashing", () => {
  const output = runFix(tempProject(), "banana\n");
  assert.ok(output.includes("No valid choice made"));
});

test("--fix with no stdin input at all resolves instead of hanging", () => {
  const output = runFix(tempProject(), "");
  assert.ok(output.includes("No valid choice made"));
});
