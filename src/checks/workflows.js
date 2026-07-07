const path = require("node:path");
const { isDir, walkFiles } = require("../fsutil");
const { buildResult } = require("../score");

function check(root) {
  const dir = path.join(root, ".claude", "workflows");
  const findings = [];
  const recommendations = [];

  const configured = isDir(dir) && walkFiles(dir, (rel) => rel.endsWith(".js")).length > 0;
  if (configured) {
    findings.push({ type: "ok", message: "Configured." });
  } else {
    findings.push({ type: "warn", message: "Not configured." });
    recommendations.push("Use /workflows to save multi-subagent orchestrations in .claude/workflows/.");
  }

  return buildResult({
    id: "workflows",
    label: "Workflows (Optional)",
    raw: configured ? 100 : 0,
    findings,
    recommendations,
    fixPromptMode: "conditional",
  });
}

module.exports = { check };
