const path = require("node:path");
const { isDir, readFileSafe, walkFiles } = require("../fsutil");
const { parseFrontmatter } = require("../frontmatter");
const { buildResult } = require("../score");

// Deliberately excludes ambiguous nouns-that-are-also-verbs like "release" or bare "push"
// ("last release", "push notification") to keep the false-positive rate low.
const SIDE_EFFECT_SIGNAL = /\b(deploy|publish|commit|delete|remove|send|merge|rollback|drop table|rm -rf|git push|npm publish|release to production)\b/i;

function isDisabledForModel(data) {
  return String(data["disable-model-invocation"]).toLowerCase() === "true";
}

function checkSideEffectSafety(skillFiles, dir, findings, recommendations) {
  let risky = 0;
  for (const file of skillFiles) {
    const content = readFileSafe(file) || "";
    const { data, body } = parseFrontmatter(content);
    const name = path.relative(dir, path.dirname(file)) || path.basename(file);
    const looksActionable = SIDE_EFFECT_SIGNAL.test(`${data.description || ""} ${body}`);
    if (looksActionable && !isDisabledForModel(data)) {
      risky += 1;
      findings.push({
        type: "warn",
        message: `Skill "${name}" looks like it has a side effect (deploy/commit/push/...) but doesn't set disable-model-invocation: true.`,
      });
    }
  }
  if (risky > 0) {
    recommendations.push(
      "Add disable-model-invocation: true to skills with side effects (deploy, commit, sending a message) so only you trigger them."
    );
    return 0;
  }
  return 1;
}

function checkLegacyCommandsOnly(root, findings, recommendations) {
  const commandsDir = path.join(root, ".claude", "commands");
  const commandFiles = walkFiles(commandsDir, (rel) => rel.toLowerCase().endsWith(".md"));
  if (commandFiles.length === 0) {
    findings.push({ type: "missing", message: "No .claude/skills/ folder (nor .claude/commands/) found." });
    recommendations.push("Create skills (.claude/skills/<name>/SKILL.md) for workflows you repeat manually.");
    return 0;
  }
  findings.push({
    type: "warn",
    message: `Found ${commandFiles.length} legacy command(s) in .claude/commands/, but no skill in .claude/skills/.`,
  });
  recommendations.push(
    "Commands still work, but new workflows should become skills (.claude/skills/<name>/SKILL.md) — same mechanism, with support for bundled files."
  );
  return 35;
}

function check(root) {
  const dir = path.join(root, ".claude", "skills");
  const findings = [];
  const recommendations = [];

  if (!isDir(dir)) {
    const raw = checkLegacyCommandsOnly(root, findings, recommendations);
    return buildResult({ id: "skills", label: "Skills", raw, findings, recommendations });
  }

  let raw = 15;
  findings.push({ type: "ok", message: ".claude/skills/ exists." });

  const skillFiles = walkFiles(dir, (rel) => rel.toLowerCase().endsWith("skill.md"));
  if (skillFiles.length === 0) {
    findings.push({ type: "warn", message: "skills/ folder exists but no SKILL.md was found." });
    recommendations.push("Add at least one skill: a folder with SKILL.md inside .claude/skills/.");
    return buildResult({ id: "skills", label: "Skills", raw, findings, recommendations });
  }

  raw += 25;
  findings.push({ type: "ok", message: `${skillFiles.length} skill(s) found.` });

  let withDescription = 0;
  for (const file of skillFiles) {
    const { data } = parseFrontmatter(readFileSafe(file) || "");
    const name = path.relative(dir, path.dirname(file)) || path.basename(file);
    if (data.description && data.description.length > 10) {
      withDescription += 1;
    } else {
      findings.push({ type: "warn", message: `Skill "${name}" has no clear description in its frontmatter.` });
    }
  }
  raw += Math.round((25 * withDescription) / skillFiles.length);
  if (withDescription < skillFiles.length) {
    recommendations.push(
      "Add a clear description in the frontmatter of every SKILL.md — it's what Claude uses to decide when to invoke it."
    );
  }

  raw += Math.min(15, Math.round((15 * skillFiles.length) / 3));
  if (skillFiles.length < 3) {
    recommendations.push("Consider capturing more repeated workflows as skills (target: 3+).");
  }

  raw += 20 * checkSideEffectSafety(skillFiles, dir, findings, recommendations);

  return buildResult({ id: "skills", label: "Skills", raw, findings, recommendations });
}

module.exports = { check };
