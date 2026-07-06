const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { check } = require("../src/checks/claudeMd");

function writeProject({ manifest, claudeMdBody }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "arthur-claudemd-"));
  if (manifest) fs.writeFileSync(path.join(root, manifest.name), manifest.content);
  fs.writeFileSync(path.join(root, "CLAUDE.md"), claudeMdBody);
  return root;
}

test("claudeMd: recommends language-specific commands when a manifest is detected but missing", () => {
  const root = writeProject({
    manifest: { name: "requirements.txt", content: "flask\n" },
    claudeMdBody: "# Conventions\n\n## Stack\n- Some backend service\n\n## Rules\n- Keep functions small\n",
  });
  const result = check(root);
  assert.ok(result.findings.some((f) => f.type === "warn" && f.message.includes("Python")));
  assert.ok(result.recommendations.some((r) => r.includes("pytest")));
});

test("claudeMd: passes when it mentions the detected language's real tools", () => {
  const root = writeProject({
    manifest: { name: "requirements.txt", content: "flask\n" },
    claudeMdBody: "# Conventions\n\n## Commands\n- Test: `pytest`\n- Lint: `ruff check .`\n",
  });
  const result = check(root);
  assert.ok(result.findings.some((f) => f.type === "ok" && f.message.includes("Python")));
});

test("claudeMd: generic build/test wording still passes when no language is detected", () => {
  const root = writeProject({
    manifest: null,
    claudeMdBody: "# Conventions\n\n## Commands\n- build: `make all`\n- test: `make test`\n",
  });
  const result = check(root);
  const commandFinding = result.findings.find((f) => f.message.includes("build/test/lint"));
  assert.ok(commandFinding);
  assert.equal(commandFinding.type, "ok");
});
