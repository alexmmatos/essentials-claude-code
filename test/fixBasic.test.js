const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { fixBasic } = require("../src/fixBasic");

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arthur-fixbasic-"));
}

test("fixBasic: creates CLAUDE.md, settings.json, and the three .claude subfolders on an empty project", () => {
  const root = tempProject();
  const actions = fixBasic(root);

  assert.ok(fs.existsSync(path.join(root, "CLAUDE.md")));
  assert.ok(fs.existsSync(path.join(root, ".claude", "settings.json")));
  assert.ok(fs.statSync(path.join(root, ".claude", "rules")).isDirectory());
  assert.ok(fs.statSync(path.join(root, ".claude", "skills")).isDirectory());
  assert.ok(fs.statSync(path.join(root, ".claude", "agents")).isDirectory());

  const created = actions.filter((a) => a.status === "created").map((a) => a.target);
  assert.deepEqual(
    created.sort(),
    ["CLAUDE.md", ".claude/agents/", ".claude/rules/", ".claude/settings.json", ".claude/skills/"].sort()
  );
});

test("fixBasic: settings.json is valid JSON with empty permissions/hooks skeletons", () => {
  const root = tempProject();
  fixBasic(root);
  const data = JSON.parse(fs.readFileSync(path.join(root, ".claude", "settings.json"), "utf8"));
  assert.deepEqual(data.permissions, { allow: [], deny: [] });
  assert.deepEqual(data.hooks, {});
});

test("fixBasic: never overwrites files/folders that already exist", () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "CLAUDE.md"), "my own content\n");
  fs.mkdirSync(path.join(root, ".claude", "skills"), { recursive: true });

  const actions = fixBasic(root);

  assert.equal(fs.readFileSync(path.join(root, "CLAUDE.md"), "utf8"), "my own content\n");
  const claudeMdAction = actions.find((a) => a.target === "CLAUDE.md");
  const skillsAction = actions.find((a) => a.target === ".claude/skills/");
  assert.equal(claudeMdAction.status, "skipped-exists");
  assert.equal(skillsAction.status, "skipped-exists");
});

test("fixBasic: also works when CLAUDE.md already exists at .claude/CLAUDE.md", () => {
  const root = tempProject();
  fs.mkdirSync(path.join(root, ".claude"), { recursive: true });
  fs.writeFileSync(path.join(root, ".claude", "CLAUDE.md"), "nested content\n");

  const actions = fixBasic(root);

  assert.ok(!fs.existsSync(path.join(root, "CLAUDE.md")));
  const claudeMdAction = actions.find((a) => a.target === "CLAUDE.md");
  assert.equal(claudeMdAction.status, "skipped-exists");
});

test("fixBasic: adds ungitignored personal files to .gitignore", () => {
  const root = tempProject();
  // Use CLAUDE.local.md, not .claude/settings.local.json: Claude Code itself writes
  // a global git-ignore rule for the latter the first time it creates one (see
  // ~/.config/git/ignore), which would make this test's outcome machine-dependent.
  require("node:child_process").execSync("git init -q", { cwd: root });
  fs.writeFileSync(path.join(root, "CLAUDE.local.md"), "private notes\n");

  const actions = fixBasic(root);

  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  assert.ok(gitignore.includes("CLAUDE.local.md"));
  assert.ok(actions.some((a) => a.target.includes("CLAUDE.local.md")));
});

test("fixBasic: CLAUDE.md template hints at the detected language's commands", () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "requirements.txt"), "flask\n");
  fixBasic(root);
  const content = fs.readFileSync(path.join(root, "CLAUDE.md"), "utf8");
  assert.ok(content.includes("pytest"));
});
