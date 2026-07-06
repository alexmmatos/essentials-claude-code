const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { check } = require("../src/checks/mcp");

function writeMcpJson(contents) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "arthur-mcp-"));
  fs.writeFileSync(path.join(root, ".mcp.json"), JSON.stringify(contents, null, 2));
  return root;
}

test("mcp: hardcoded secret in env scores lower and warns", () => {
  const root = writeMcpJson({
    mcpServers: {
      github: { command: "npx", args: ["-y", "server"], env: { GITHUB_TOKEN: "ghp_abcdef123456" } },
    },
  });
  const result = check(root);
  assert.ok(result.points < result.weight);
  assert.ok(result.findings.some((f) => f.type === "warn" && f.message.includes("hardcoded secret")));
});

test("mcp: ${VAR} placeholder in env scores full marks", () => {
  const root = writeMcpJson({
    mcpServers: {
      github: { command: "npx", args: ["-y", "server"], env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" } },
    },
  });
  const result = check(root);
  assert.equal(result.points, result.weight);
});

test("mcp: no env block at all is not penalized", () => {
  const root = writeMcpJson({ mcpServers: { fixture: { command: "npx", args: ["-y", "server"] } } });
  const result = check(root);
  assert.equal(result.points, result.weight);
});

test("mcp: non-secret env keys are not flagged", () => {
  const root = writeMcpJson({
    mcpServers: { fixture: { command: "npx", args: ["-y", "server"], env: { NODE_ENV: "production" } } },
  });
  const result = check(root);
  assert.equal(result.points, result.weight);
});
