const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const CLI = path.join(__dirname, "..", "bin", "cli.js");

function runHelp(flag) {
  return execFileSync("node", [CLI, flag], { encoding: "utf8" });
}

function emptyProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-cli-"));
}

function run(args) {
  return execFileSync("node", [CLI, ...args], { encoding: "utf8" });
}

test("--help lists the path argument", () => {
  const output = runHelp("--help");
  assert.ok(output.includes("Arguments:"));
  assert.ok(output.includes("path"));
  assert.ok(output.includes("default: current directory"));
});

test("--help lists every supported flag", () => {
  const output = runHelp("--help");
  for (const flag of [
    "--json",
    "--verbose, -v",
    "--explain",
    "--no-explain",
    "--generate-essential-agents",
    "--fix",
    "--fix-basic",
    "--min-score=N",
    "--no-color",
    "--help, -h",
  ]) {
    assert.ok(output.includes(flag), `expected --help to mention "${flag}"`);
  }
});

test("running with no flags explains by default but is not verbose", () => {
  const output = run([emptyProject(), "--no-color"]);
  assert.ok(output.includes("Why it matters"), "expected --explain output by default");
  assert.ok(
    !output.includes("✔") && !output.includes("⚠") && !output.includes("✘"),
    "expected no per-finding detail unless --verbose is passed"
  );
});

test("--verbose shows per-category findings", () => {
  const output = run([emptyProject(), "--no-color", "--verbose"]);
  assert.ok(output.includes("✔") || output.includes("⚠") || output.includes("✘"));
});

test("--no-explain hides the why-it-matters reasoning", () => {
  const output = run([emptyProject(), "--no-color", "--no-explain"]);
  assert.ok(!output.includes("Why it matters"));
});

test("--help includes usage examples", () => {
  const output = runHelp("--help");
  assert.ok(output.includes("Examples:"));
  assert.ok(output.includes("essentials-claude-code --min-score=70"));
});

test("-h is a shorthand for --help", () => {
  assert.equal(runHelp("-h"), runHelp("--help"));
});
