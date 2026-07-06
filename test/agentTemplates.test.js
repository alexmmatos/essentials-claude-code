const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  generateEssentialAgents,
  pickTemplates,
  LANGUAGE_AGENT_TEMPLATES,
} = require("../src/agentTemplates");

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-agent-templates-"));
}

function fakeLanguages(id) {
  return { matches: id ? [id] : [], breakdown: [], primary: id ? { id, label: id } : null };
}

test("every mapped language template file actually exists in template-agents/", () => {
  const root = tempProject();
  for (const id of Object.keys(LANGUAGE_AGENT_TEMPLATES)) {
    const rel = LANGUAGE_AGENT_TEMPLATES[id](root);
    const abs = path.join(__dirname, "..", "template-agents", "awesome-claude-code-subagents-main", "categories", rel);
    assert.ok(fs.existsSync(abs), `missing template for "${id}": ${rel}`);
  }
});

test("generateEssentialAgents: creates the universal agent even with no detected language", () => {
  const root = tempProject();
  const results = generateEssentialAgents(root, fakeLanguages(null));
  const created = results.filter((r) => r.status === "created").map((r) => r.filename);
  assert.deepEqual(created, ["code-reviewer.md"]);
  assert.ok(fs.existsSync(path.join(root, ".claude", "agents", "code-reviewer.md")));
});

test("generateEssentialAgents: adds a language-specific agent when a language is detected", () => {
  const root = tempProject();
  const results = generateEssentialAgents(root, fakeLanguages("python"));
  const created = results.filter((r) => r.status === "created").map((r) => r.filename);
  assert.deepEqual(created.sort(), ["code-reviewer.md", "python-pro.md"]);
});

test("generateEssentialAgents: node picks typescript-pro.md when tsconfig.json is present", () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "tsconfig.json"), "{}");
  const results = generateEssentialAgents(root, fakeLanguages("node"));
  const created = results.map((r) => r.filename);
  assert.ok(created.includes("typescript-pro.md"));
  assert.ok(!created.includes("javascript-pro.md"));
});

test("generateEssentialAgents: node picks javascript-pro.md without a tsconfig.json", () => {
  const root = tempProject();
  const results = generateEssentialAgents(root, fakeLanguages("node"));
  const created = results.map((r) => r.filename);
  assert.ok(created.includes("javascript-pro.md"));
});

test("generateEssentialAgents: does not overwrite an existing agent file", () => {
  const root = tempProject();
  fs.mkdirSync(path.join(root, ".claude", "agents"), { recursive: true });
  fs.writeFileSync(path.join(root, ".claude", "agents", "code-reviewer.md"), "custom content\n");
  const results = generateEssentialAgents(root, fakeLanguages(null));
  const skipped = results.find((r) => r.filename === "code-reviewer.md");
  assert.equal(skipped.status, "skipped-exists");
  assert.equal(fs.readFileSync(path.join(root, ".claude", "agents", "code-reviewer.md"), "utf8"), "custom content\n");
});

test("generateEssentialAgents: writes a THIRD_PARTY_NOTICES.md attributing the MIT source", () => {
  const root = tempProject();
  generateEssentialAgents(root, fakeLanguages("go"));
  const notice = fs.readFileSync(path.join(root, ".claude", "agents", "THIRD_PARTY_NOTICES.md"), "utf8");
  assert.ok(notice.includes("MIT"));
  assert.ok(notice.includes("VoltAgent/awesome-claude-code-subagents"));
  assert.ok(notice.includes("golang-pro.md"));
});

test("pickTemplates: unknown/unmapped language id falls back to the universal agent only", () => {
  const root = tempProject();
  const picks = pickTemplates(root, fakeLanguages("cobol"));
  assert.equal(picks.length, 1);
});
