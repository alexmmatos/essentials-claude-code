const path = require("node:path");
const { isDir, readFileSafe, walkFiles } = require("../fsutil");
const { parseFrontmatter } = require("../frontmatter");
const { buildResult } = require("../score");

function check(root) {
  const dir = path.join(root, ".claude", "agents");
  const findings = [];
  const recommendations = [];

  if (!isDir(dir)) {
    findings.push({ type: "missing", message: "No .claude/agents/ folder found." });
    recommendations.push(
      "Create subagents (.claude/agents/*.md) for isolated tasks: code review, research, specialized workers."
    );
    return buildResult({ id: "agents", label: "Subagents", raw: 0, findings, recommendations });
  }

  let raw = 20;
  findings.push({ type: "ok", message: ".claude/agents/ exists." });

  const agentFiles = walkFiles(dir, (rel) => rel.toLowerCase().endsWith(".md"));
  if (agentFiles.length === 0) {
    findings.push({ type: "warn", message: "agents/ folder exists but no .md file was found." });
    recommendations.push("Add at least one subagent in .claude/agents/*.md.");
    return buildResult({ id: "agents", label: "Subagents", raw, findings, recommendations });
  }

  raw += 30;
  findings.push({ type: "ok", message: `${agentFiles.length} subagent(s) found.` });

  let withDescriptionAndTools = 0;
  for (const file of agentFiles) {
    const { data } = parseFrontmatter(readFileSafe(file) || "");
    const name = path.basename(file, ".md");
    const hasDescription = data.description && data.description.length > 10;
    const hasTools = data.tools !== undefined;
    if (hasDescription && hasTools) {
      withDescriptionAndTools += 1;
    } else {
      const missing = [!hasDescription && "description", !hasTools && "tools"].filter(Boolean).join(" and ");
      findings.push({ type: "warn", message: `Subagent "${name}" is missing ${missing} in its frontmatter.` });
    }
  }
  raw += Math.round((30 * withDescriptionAndTools) / agentFiles.length);
  if (withDescriptionAndTools < agentFiles.length) {
    recommendations.push(
      "Define description (so Claude knows when to delegate) and tools (to restrict access) on every subagent."
    );
  }

  raw += Math.min(20, Math.round((20 * agentFiles.length) / 3));
  if (agentFiles.length < 3) {
    recommendations.push("Consider creating more specialized subagents as isolable tasks come up.");
  }

  return buildResult({ id: "agents", label: "Subagents", raw, findings, recommendations });
}

module.exports = { check };
