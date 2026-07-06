const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { rankAgentRelevance, buildRipgrepPattern, runPureNodeScan } = require("../src/rankAgentRelevance");

function makeTempProject() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "agent-rank-"));
  const root = path.join(temp, "project");
  fs.mkdirSync(root);
  fs.writeFileSync(
    path.join(root, "README.md"),
    [
      "This service exposes an OpenAPI document.",
      "The API has several endpoint definitions and API versioning notes.",
      "Docker images are built from a Dockerfile for container deployment.",
      "TypeScript type safety matters for this codebase.",
    ].join("\n")
  );
  fs.writeFileSync(
    path.join(temp, "agent-terms.json"),
    JSON.stringify(
      {
        api: [
            { template: "api-designer", relevance: 4 },
            { template: "api-documenter", relevance: 2 },
        ],
        openapi: [{ template: "api-designer", relevance: 10 }],
        endpoint: [{ template: "api-designer", relevance: 3 }],
        "api versioning": [{ template: "api-designer", relevance: 8 }],
        docker: [{ template: "docker-expert", relevance: 8 }],
        dockerfile: [{ template: "docker-expert", relevance: 10 }],
        container: [{ template: "docker-expert", relevance: 3 }],
        typescript: [{ template: "typescript-pro", relevance: 10 }],
        "type safety": [{ template: "typescript-pro", relevance: 6 }],
      },
      null,
      2
    )
  );
  return { root, termsPath: path.join(temp, "agent-terms.json") };
}

test("buildRipgrepPattern combines all terms into one case-insensitive-ready boundary regex", () => {
  assert.equal(buildRipgrepPattern(["api", "type safety"]), "\\b(type safety|api)\\b");
});

test("rankAgentRelevance scans once and ranks agents by weighted literal matches (rg or the Node fallback)", () => {
  const { root, termsPath } = makeTempProject();
  const result = rankAgentRelevance({ termsPath, root, topTerms: 3 });

  assert.ok(["ripgrep", "node-fallback"].includes(result.scanMethod));
  assert.equal(result.uniqueTerms, 9);
  assert.ok(result.matchedTerms >= 7);
  assert.equal(result.agents[0].agent, "api-designer");
  assert.ok(result.agents[0].score > result.agents[1].score);
  assert.ok(result.agents.some((agent) => agent.agent === "api-documenter"));
  assert.deepEqual(result.agents[0].topTerms.map((term) => term.term), ["openapi", "api versioning", "api"]);
});

test("runPureNodeScan (fallback) finds the same term occurrences a ripgrep scan would", () => {
  const { root } = makeTempProject();
  const pattern = buildRipgrepPattern(["docker", "dockerfile", "typescript", "type safety", "nonexistent-term-xyz"]);
  const { termCounts } = runPureNodeScan(root, pattern);

  assert.equal(termCounts.get("docker"), 1);
  assert.equal(termCounts.get("dockerfile"), 1);
  assert.equal(termCounts.get("typescript"), 1);
  assert.equal(termCounts.get("type safety"), 1);
  assert.equal(termCounts.has("nonexistent-term-xyz"), false);
});

test("runPureNodeScan skips binary-looking files (containing a NUL byte)", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-rank-binary-"));
  fs.writeFileSync(path.join(root, "notes.txt"), "mentions docker here");
  fs.writeFileSync(path.join(root, "fake.bin"), Buffer.from([0x44, 0x00, 0x6f, 0x63, 0x6b, 0x65, 0x72]));

  const pattern = buildRipgrepPattern(["docker"]);
  const { termCounts, termFiles } = runPureNodeScan(root, pattern);

  assert.equal(termCounts.get("docker"), 1);
  const files = [...termFiles.get("docker").keys()];
  assert.ok(files.every((f) => !f.endsWith("fake.bin")));
});
