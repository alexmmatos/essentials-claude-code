const path = require("node:path");
const { readJsonSafe } = require("../fsutil");
const { buildResult } = require("../score");

const SECRET_KEY_SIGNAL = /(token|key|secret|password|pat)$/i;
const PLACEHOLDER_VALUE = /^\$\{[^}]+\}$/;

function findHardcodedSecrets(servers) {
  const offenders = [];
  for (const [serverName, config] of Object.entries(servers)) {
    const env = config && typeof config === "object" ? config.env : null;
    if (!env || typeof env !== "object") continue;
    for (const [key, value] of Object.entries(env)) {
      if (SECRET_KEY_SIGNAL.test(key) && typeof value === "string" && !PLACEHOLDER_VALUE.test(value)) {
        offenders.push(`${serverName}.${key}`);
      }
    }
  }
  return offenders;
}

function check(root) {
  const file = path.join(root, ".mcp.json");
  const { ok, exists, data, error } = readJsonSafe(file);
  const findings = [];
  const recommendations = [];

  if (!exists) {
    findings.push({ type: "missing", message: "No .mcp.json found." });
    recommendations.push(
      "If the team depends on external data (database, Slack, APIs), configure MCP servers in .mcp.json."
    );
    return buildResult({ id: "mcp", label: "MCP", raw: 0, findings, recommendations });
  }

  let raw = 30;
  findings.push({ type: "ok", message: ".mcp.json exists." });

  if (!ok) {
    findings.push({ type: "warn", message: `Invalid JSON: ${error}` });
    recommendations.push("Fix the JSON syntax in .mcp.json.");
    return buildResult({ id: "mcp", label: "MCP", raw, findings, recommendations });
  }
  raw += 20;
  findings.push({ type: "ok", message: "Valid JSON." });

  const servers = data.mcpServers && typeof data.mcpServers === "object" ? data.mcpServers : {};
  const serverNames = Object.keys(servers);
  if (serverNames.length > 0) {
    raw += 30;
    findings.push({ type: "ok", message: `${serverNames.length} MCP server(s) configured: ${serverNames.join(", ")}.` });

    const offenders = findHardcodedSecrets(servers);
    if (offenders.length > 0) {
      findings.push({
        type: "warn",
        message: `env value that looks like a hardcoded secret (not using \${VAR}): ${offenders.join(", ")}.`,
      });
      recommendations.push(
        "Use environment variable references (e.g., ${GITHUB_TOKEN}) for secrets in .mcp.json instead of literal values."
      );
    } else {
      raw += 20;
      findings.push({ type: "ok", message: "No hardcoded secrets found in the servers' environment variables." });
    }
  } else {
    findings.push({ type: "warn", message: "mcpServers is empty or missing." });
    recommendations.push("Add at least one server to mcpServers inside .mcp.json.");
  }

  return buildResult({ id: "mcp", label: "MCP", raw, findings, recommendations });
}

module.exports = { check };
