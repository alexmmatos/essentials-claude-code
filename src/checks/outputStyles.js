const path = require("node:path");
const { isDir, walkFiles } = require("../fsutil");
const { buildResult } = require("../score");

function check(root) {
  const dir = path.join(root, ".claude", "output-styles");
  const findings = [];
  const recommendations = [];

  const configured = isDir(dir) && walkFiles(dir, (rel) => rel.endsWith(".md")).length > 0;
  if (configured) {
    findings.push({ type: "ok", message: "Configured." });
  } else {
    findings.push({ type: "warn", message: "Not configured." });
    recommendations.push("Create .claude/output-styles/ if the team shares a specific response mode.");
  }

  return buildResult({
    id: "output_styles",
    label: "Output Styles (Optional)",
    raw: configured ? 100 : 0,
    findings,
    recommendations,
    fixPromptMode: "conditional",
  });
}

module.exports = { check };
