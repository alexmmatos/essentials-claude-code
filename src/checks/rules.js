const path = require("node:path");
const { isDir, readFileSafe, walkFiles } = require("../fsutil");
const { parseFrontmatter } = require("../frontmatter");
const { buildResult } = require("../score");

function check(root) {
  const dir = path.join(root, ".claude", "rules");
  const findings = [];
  const recommendations = [];

  if (!isDir(dir)) {
    findings.push({ type: "missing", message: "No .claude/rules/ folder found." });
    recommendations.push(
      "If CLAUDE.md is growing, split rules by topic/folder into .claude/rules/ (with paths: for scoping)."
    );
    return buildResult({ id: "rules", label: "Rules", raw: 0, findings, recommendations });
  }

  let raw = 30;
  findings.push({ type: "ok", message: ".claude/rules/ exists." });

  const ruleFiles = walkFiles(dir, (rel) => rel.toLowerCase().endsWith(".md"));
  if (ruleFiles.length === 0) {
    findings.push({ type: "warn", message: "rules/ folder exists but is empty." });
    recommendations.push("Add at least one .md file in .claude/rules/.");
    return buildResult({ id: "rules", label: "Rules", raw, findings, recommendations });
  }

  raw += 40;
  findings.push({ type: "ok", message: `${ruleFiles.length} rule(s) found.` });

  let scoped = 0;
  for (const file of ruleFiles) {
    const { data } = parseFrontmatter(readFileSafe(file) || "");
    if (data.paths !== undefined) scoped += 1;
  }
  raw += Math.round((30 * scoped) / ruleFiles.length);
  if (scoped === 0) {
    recommendations.push(
      "Use `paths:` frontmatter on language/folder-specific rules so they load only when relevant."
    );
  }

  return buildResult({ id: "rules", label: "Rules", raw, findings, recommendations });
}

module.exports = { check };
