const fs = require("node:fs");
const path = require("node:path");
const { rankAgentRelevance } = require("./rankAgentRelevance");
const { recordThirdPartyNotice } = require("./thirdPartyNotice");

const DEFAULT_TERMS_PATH = path.join(__dirname, "agentTermTemplateRelevance.json");
const DEFAULT_CATALOG_PATH = path.join(__dirname, "agentTemplateCatalog.json");

function loadCatalogPaths(catalogPath) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const byName = new Map();
  for (const category of catalog.categories) {
    for (const agent of category.agents) {
      byName.set(agent.name, agent.path);
    }
  }
  return byName;
}

function copyAgentFile(root, packageRelativePath, filename) {
  const src = path.join(__dirname, "..", packageRelativePath);
  const dest = path.join(root, ".claude", "agents", filename);

  if (!fs.existsSync(src)) return "template-missing";
  if (fs.existsSync(dest)) return "skipped-exists";
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return "created";
}

/**
 * Scans the project once (via rankAgentRelevance's single-pass scan) against the
 * full term dictionary, then generates every agent template with a positive relevance
 * score — not just one flagship per language like generateEssentialAgents does.
 *
 * rankAgentRelevance transparently falls back to a pure-Node scan when ripgrep isn't
 * installed (slower, but it always works); `scanMethod` on the result tells the
 * caller which one ran so it can warn the user (see bin/cli.js).
 */
function generateAllAgents(root, { termsPath = DEFAULT_TERMS_PATH, catalogPath = DEFAULT_CATALOG_PATH } = {}) {
  const ranking = rankAgentRelevance({ termsPath, root });
  const catalogPaths = loadCatalogPaths(catalogPath);

  const created = [];
  const results = ranking.agents.map((entry) => {
    const filename = `${entry.agent}.md`;
    const relTemplatePath = catalogPaths.get(entry.agent);
    if (!relTemplatePath) {
      return { agent: entry.agent, filename, score: entry.score, status: "template-missing" };
    }
    const status = copyAgentFile(root, relTemplatePath, filename);
    if (status === "created") created.push(filename);
    return { agent: entry.agent, filename, score: entry.score, status };
  });

  recordThirdPartyNotice(root, created);
  return {
    uniqueTerms: ranking.uniqueTerms,
    matchedTerms: ranking.matchedTerms,
    scanMethod: ranking.scanMethod,
    results,
  };
}

module.exports = { generateAllAgents };
