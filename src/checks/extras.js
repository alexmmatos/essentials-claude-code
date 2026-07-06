const path = require("node:path");
const { exists, isDir, walkFiles } = require("../fsutil");
const { buildResult } = require("../score");

function check(root) {
  const findings = [];
  const recommendations = [];
  let raw = 0;

  const outputStyles = path.join(root, ".claude", "output-styles");
  if (isDir(outputStyles) && walkFiles(outputStyles, (rel) => rel.endsWith(".md")).length > 0) {
    raw += 25;
    findings.push({ type: "ok", message: "Has custom output-styles/." });
  } else {
    recommendations.push("Optional: create .claude/output-styles/ if the team shares a specific response mode.");
  }

  const workflows = path.join(root, ".claude", "workflows");
  if (isDir(workflows) && walkFiles(workflows, (rel) => rel.endsWith(".js")).length > 0) {
    raw += 25;
    findings.push({ type: "ok", message: "Has dynamic workflows/ configured." });
  } else {
    recommendations.push("Optional: use /workflows to save multi-subagent orchestrations in .claude/workflows/.");
  }

  const agentMemory = path.join(root, ".claude", "agent-memory");
  if (isDir(agentMemory) && walkFiles(agentMemory, () => true).length > 0) {
    raw += 25;
    findings.push({ type: "ok", message: "Subagents with persistent memory (.claude/agent-memory/) in use." });
  } else {
    recommendations.push("Optional: enable memory: project on subagents that benefit from memory across runs.");
  }

  const worktreeInclude = path.join(root, ".worktreeinclude");
  if (exists(worktreeInclude)) {
    raw += 25;
    findings.push({ type: "ok", message: ".worktreeinclude configured for worktrees." });
  } else {
    recommendations.push("Optional: if you use git worktrees, create .worktreeinclude to copy .env and similar files.");
  }

  return buildResult({ id: "extras", label: "Extras", raw, findings, recommendations });
}

module.exports = { check };
