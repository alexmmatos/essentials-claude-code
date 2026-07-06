const path = require("node:path");
const { readJsonSafe } = require("../fsutil");
const { buildResult } = require("../score");

function check(root) {
  const file = path.join(root, ".claude", "settings.json");
  const { ok, exists, data, error } = readJsonSafe(file);
  const findings = [];
  const recommendations = [];

  if (!exists) {
    findings.push({ type: "missing", message: "No .claude/settings.json found." });
    recommendations.push(
      "Create .claude/settings.json with permissions (allow/deny) and hooks to automate guardrails."
    );
    return buildResult({ id: "settings", label: "settings.json", raw: 0, findings, recommendations });
  }

  let raw = 35;
  findings.push({ type: "ok", message: ".claude/settings.json exists." });

  if (!ok) {
    findings.push({ type: "warn", message: `Invalid JSON: ${error}` });
    recommendations.push("Fix the JSON syntax in .claude/settings.json.");
    return buildResult({ id: "settings", label: "settings.json", raw, findings, recommendations });
  }
  raw += 15;
  findings.push({ type: "ok", message: "Valid JSON." });

  const perms = data.permissions;
  const hasPerms =
    perms && ((Array.isArray(perms.allow) && perms.allow.length > 0) || (Array.isArray(perms.deny) && perms.deny.length > 0));
  if (hasPerms) {
    raw += 20;
    findings.push({ type: "ok", message: "Has permissions (allow/deny) rules configured." });
  } else {
    findings.push({ type: "warn", message: "No permissions.allow/deny configured." });
    recommendations.push("Configure permissions.allow/deny to make the commands Claude runs predictable.");
  }

  const hasHooks = data.hooks && Object.keys(data.hooks).length > 0;
  if (hasHooks) {
    raw += 20;
    findings.push({ type: "ok", message: "Has hooks configured." });
  } else {
    findings.push({ type: "warn", message: "No hooks configured." });
    recommendations.push("Consider a hook (e.g., post-edit lint) for guardrails that need to run every time.");
  }

  if (typeof data.statusLine !== "undefined") {
    raw += 10;
    findings.push({ type: "ok", message: "statusLine configured — helps track context usage." });
  } else {
    recommendations.push(
      "Consider configuring statusLine in settings.json to continuously track context usage."
    );
  }

  return buildResult({ id: "settings", label: "settings.json", raw, findings, recommendations });
}

module.exports = { check };
