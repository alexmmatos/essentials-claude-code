const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const CLI = path.join(__dirname, "..", "bin", "cli.js");

function runHelp(flag) {
  return execFileSync("node", [CLI, flag], { encoding: "utf8" });
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
    "--generate-essential-agents",
    "--fix-prompt",
    "--fix-basic",
    "--min-score=N",
    "--no-color",
    "--help, -h",
  ]) {
    assert.ok(output.includes(flag), `expected --help to mention "${flag}"`);
  }
});

test("--help includes usage examples", () => {
  const output = runHelp("--help");
  assert.ok(output.includes("Examples:"));
  assert.ok(output.includes("essentials-claude-code --min-score=70"));
});

test("-h is a shorthand for --help", () => {
  assert.equal(runHelp("-h"), runHelp("--help"));
});
