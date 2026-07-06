const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { inspect } = require("../src/index");
const { renderTerminal, renderJson } = require("../src/report");

function emptyProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-report-"));
}

test("renderTerminal: explanations are hidden by default", () => {
  const result = inspect(emptyProject());
  const output = renderTerminal(result, { color: false });
  assert.ok(!output.includes("Why it matters"));
});

test("renderTerminal: --explain shows the 'why it matters' text for categories with gaps", () => {
  const result = inspect(emptyProject());
  const output = renderTerminal(result, { color: false, explain: true });
  assert.ok(output.includes("Why it matters"));
  assert.ok(output.includes("CLAUDE.md loads into context automatically"));
});

test("every category with a static explanation exposes it on the JSON result", () => {
  const result = inspect(emptyProject());
  for (const cat of result.categories) {
    assert.ok(cat.explanation, `expected an explanation for category "${cat.id}"`);
  }
});

test("renderJson: still valid JSON with the explanation field included", () => {
  const result = inspect(emptyProject());
  const parsed = JSON.parse(renderJson(result));
  assert.ok(parsed.categories[0].explanation);
});

test("renderTerminal: reports the manifest-detected language even with an empty extension breakdown", () => {
  const root = emptyProject();
  fs.writeFileSync(path.join(root, "package.json"), "{}");
  const result = inspect(root);
  assert.equal(result.languages.breakdown.length, 0);
  assert.equal(result.languages.primary.label, "JavaScript/TypeScript");
  const output = renderTerminal(result, { color: false });
  assert.ok(!output.includes("no programming language identified"));
  assert.ok(output.includes("JavaScript/TypeScript"));
});

test("renderTerminal: an empty project (all gaps) suggests --fix-basic, --fix-prompt, --fix, and --generate-essential-agents", () => {
  const result = inspect(emptyProject());
  const output = renderTerminal(result, { color: false });

  assert.ok(output.includes("Useful next steps"));
  assert.ok(output.includes("--fix-basic"));
  assert.ok(output.includes("--fix-prompt"));
  assert.ok(output.includes("not sure which of the two above"), "expected the --fix suggestion");
  assert.ok(output.includes("--generate-essential-agents"));
  assert.ok(output.includes("--explain"));
  assert.ok(output.includes("--verbose"));
  assert.ok(output.includes("--json"));
});

test("renderTerminal: doesn't suggest --explain or --verbose when already in use", () => {
  const result = inspect(emptyProject());
  const output = renderTerminal(result, { color: false, explain: true, verbose: true });

  assert.ok(!output.includes("--explain"));
  assert.ok(!output.includes("--verbose"));
  assert.ok(output.includes("--json"));
});

test("renderTerminal: a fully-scored result suggests neither fix flags nor --generate-essential-agents", () => {
  const result = {
    total: 100,
    maxTotal: 100,
    languages: { matches: [], breakdown: [], primary: null },
    categories: [{ id: "agents", label: "Subagents", weight: 15, points: 15, findings: [] }],
    recommendations: [],
  };
  const output = renderTerminal(result, { color: false });

  assert.ok(!output.includes("--fix-basic"));
  assert.ok(!output.includes("--fix-prompt"));
  assert.ok(!output.includes("--generate-essential-agents"));
  assert.ok(output.includes("--json"));
});
