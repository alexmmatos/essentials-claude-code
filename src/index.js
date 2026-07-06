const path = require("node:path");
const { aggregate } = require("./score");
const { detect: detectLanguages } = require("./languages");
const claudeMd = require("./checks/claudeMd");
const settings = require("./checks/settings");
const skills = require("./checks/skills");
const agents = require("./checks/agents");
const rules = require("./checks/rules");
const mcp = require("./checks/mcp");
const hygiene = require("./checks/hygiene");
const extras = require("./checks/extras");
const principles = require("./checks/principles");

const CHECKS = [claudeMd, settings, skills, agents, rules, mcp, hygiene, extras, principles];

/** Strips internal-only fields (like the RegExp in `commandSignal`) before exposing languages in the report/JSON. */
function toPublicLanguages(languages) {
  return {
    matches: languages.matches,
    breakdown: languages.breakdown,
    primary: languages.primary
      ? { id: languages.primary.id, label: languages.primary.label, exampleTools: languages.primary.exampleTools }
      : null,
  };
}

function inspect(targetPath = ".") {
  const root = path.resolve(targetPath);
  const languages = detectLanguages(root);
  const categories = CHECKS.map((mod) => mod.check(root, { languages }));
  return { root, languages: toPublicLanguages(languages), ...aggregate(categories) };
}

module.exports = { inspect };
