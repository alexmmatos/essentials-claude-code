const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { generateAllAgents } = require("../src/generateAllAgents");

const FIXTURE_CATALOG = {
  categories: [
    {
      category: "fixtures",
      agents: [
        { name: "docker-expert", path: "test/fixtures/fake-agent-templates/docker-expert.md" },
        { name: "kubernetes-specialist", path: "test/fixtures/fake-agent-templates/kubernetes-specialist.md" },
      ],
    },
  ],
};

function tempFixtures() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arthur-generate-all-"));
  const termsPath = path.join(dir, "terms.json");
  const catalogPath = path.join(dir, "catalog.json");
  fs.writeFileSync(
    termsPath,
    JSON.stringify({
      docker: [{ template: "docker-expert", relevance: 8 }],
      dockerfile: [{ template: "docker-expert", relevance: 10 }],
      kubernetes: [{ template: "kubernetes-specialist", relevance: 10 }],
    })
  );
  fs.writeFileSync(catalogPath, JSON.stringify(FIXTURE_CATALOG));
  return { termsPath, catalogPath };
}

function tempProject(content) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "arthur-generate-all-project-"));
  fs.writeFileSync(path.join(root, "README.md"), content);
  return root;
}

test("generateAllAgents: generates every agent with a positive relevance score", () => {
  const { termsPath, catalogPath } = tempFixtures();
  const root = tempProject("This project uses Docker and a Dockerfile for builds.");

  const gen = generateAllAgents(root, { termsPath, catalogPath });

  const created = gen.results.filter((r) => r.status === "created").map((r) => r.agent);
  assert.deepEqual(created, ["docker-expert"]);
  assert.ok(fs.existsSync(path.join(root, ".claude", "agents", "docker-expert.md")));
  assert.ok(!fs.existsSync(path.join(root, ".claude", "agents", "kubernetes-specialist.md")));
});

test("generateAllAgents: an agent with no matching term is not generated", () => {
  const { termsPath, catalogPath } = tempFixtures();
  const root = tempProject("Nothing container-related is mentioned here at all.");

  const gen = generateAllAgents(root, { termsPath, catalogPath });

  assert.equal(gen.results.filter((r) => r.status === "created").length, 0);
});

test("generateAllAgents: never overwrites an agent file that already exists", () => {
  const { termsPath, catalogPath } = tempFixtures();
  const root = tempProject("Docker and Kubernetes are both used in this project.");
  fs.mkdirSync(path.join(root, ".claude", "agents"), { recursive: true });
  fs.writeFileSync(path.join(root, ".claude", "agents", "docker-expert.md"), "my customized version\n");

  const gen = generateAllAgents(root, { termsPath, catalogPath });

  const dockerResult = gen.results.find((r) => r.agent === "docker-expert");
  assert.equal(dockerResult.status, "skipped-exists");
  assert.equal(
    fs.readFileSync(path.join(root, ".claude", "agents", "docker-expert.md"), "utf8"),
    "my customized version\n"
  );
});

test("generateAllAgents: writes THIRD_PARTY_NOTICES.md crediting the MIT source", () => {
  const { termsPath, catalogPath } = tempFixtures();
  const root = tempProject("Kubernetes manifests live in this repository.");

  generateAllAgents(root, { termsPath, catalogPath });

  const notice = fs.readFileSync(path.join(root, ".claude", "agents", "THIRD_PARTY_NOTICES.md"), "utf8");
  assert.ok(notice.includes("MIT"));
  assert.ok(notice.includes("kubernetes-specialist.md"));
});

test("generateAllAgents: uses the real bundled dictionary and catalog by default", () => {
  const root = tempProject("This is a TypeScript project using npm and eslint.");
  const gen = generateAllAgents(root);
  assert.ok(gen.uniqueTerms > 100, "expected the real dictionary to have well over 100 unique terms");
});
