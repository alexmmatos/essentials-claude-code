const path = require("node:path");
const { exists } = require("../fsutil");
const { buildResult } = require("../score");

function check(root) {
  const file = path.join(root, ".worktreeinclude");
  const findings = [];
  const recommendations = [];

  const configured = exists(file);
  if (configured) {
    findings.push({ type: "ok", message: "Configured." });
  } else {
    findings.push({ type: "warn", message: "Not configured." });
    recommendations.push("If you use git worktrees, create .worktreeinclude to copy .env and similar files.");
  }

  return buildResult({
    id: "worktree_include",
    label: "Worktree Include (Optional)",
    raw: configured ? 100 : 0,
    findings,
    recommendations,
    fixPromptMode: "conditional",
  });
}

module.exports = { check };
