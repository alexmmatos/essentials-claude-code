const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { check } = require("../src/checks/skills");

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-skills-"));
}

function writeSkill(root, name, frontmatterExtra, body) {
  const dir = path.join(root, ".claude", "skills", name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "SKILL.md"),
    `---\ndescription: ${frontmatterExtra.description}\n${
      frontmatterExtra.disableModelInvocation ? "disable-model-invocation: true\n" : ""
    }---\n\n${body}\n`
  );
}

test("skills: a side-effect skill without disable-model-invocation scores lower than a safe one", () => {
  const safeRoot = tempProject();
  writeSkill(safeRoot, "changelog", { description: "Summarizes the changelog for the last release" }, "Summarize recent changes.");
  const safeResult = check(safeRoot);

  const riskyRoot = tempProject();
  writeSkill(riskyRoot, "deploy", { description: "Deploys the app to production" }, "Run deploy now.");
  const riskyResult = check(riskyRoot);

  assert.ok(riskyResult.points < safeResult.points, `expected ${riskyResult.points} < ${safeResult.points}`);
  assert.ok(riskyResult.findings.some((f) => f.type === "warn" && f.message.includes("side effect")));
});

test("skills: disable-model-invocation: true clears the side-effect warning", () => {
  const root = tempProject();
  writeSkill(
    root,
    "deploy",
    { description: "Deploys the app to production", disableModelInvocation: true },
    "Run deploy now."
  );
  const result = check(root);
  assert.ok(!result.findings.some((f) => f.type === "warn" && f.message.includes("side effect")));
});

test("skills: commands/ without skills/ gets partial credit and a migration recommendation", () => {
  const root = tempProject();
  fs.mkdirSync(path.join(root, ".claude", "commands"), { recursive: true });
  fs.writeFileSync(path.join(root, ".claude", "commands", "fix-issue.md"), "Fix the issue.\n");
  const result = check(root);

  assert.equal(result.raw, 35);
  assert.ok(result.findings.some((f) => f.message.includes("legacy command")));
  assert.ok(result.recommendations.some((r) => r.includes("skills")));
});

test("skills: neither skills/ nor commands/ scores zero", () => {
  const root = tempProject();
  const result = check(root);
  assert.equal(result.raw, 0);
});
