const path = require("node:path");
const { isDir, walkFiles } = require("../fsutil");
const { buildResult } = require("../score");

function check(root) {
  const dir = path.join(root, ".claude", "agent-memory");
  const findings = [];
  const recommendations = [];

  const configured = isDir(dir) && walkFiles(dir, () => true).length > 0;
  if (configured) {
    findings.push({ type: "ok", message: "Configured." });
  } else {
    findings.push({ type: "warn", message: "Not configured." });
    recommendations.push("Enable memory: project on subagents that benefit from memory across runs.");
  }

  return buildResult({
    id: "agent_memory",
    label: "Agent Memory (Optional)",
    raw: configured ? 100 : 0,
    findings,
    recommendations,
    fixPromptMode: "conditional",
  });
}

module.exports = { check };
