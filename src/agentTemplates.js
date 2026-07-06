const fs = require("node:fs");
const path = require("node:path");
const { exists } = require("./fsutil");
const { recordThirdPartyNotice, SOURCE_URL } = require("./thirdPartyNotice");

const TEMPLATES_ROOT = path.join(__dirname, "..", "template-agents", "awesome-claude-code-subagents-main", "categories");

/** One flagship language-specialist template per detected language id (see src/languages.js PROFILES). */
const LANGUAGE_AGENT_TEMPLATES = {
  node: (root) =>
    exists(path.join(root, "tsconfig.json"))
      ? "02-language-specialists/typescript-pro.md"
      : "02-language-specialists/javascript-pro.md",
  python: () => "02-language-specialists/python-pro.md",
  go: () => "02-language-specialists/golang-pro.md",
  rust: () => "02-language-specialists/rust-engineer.md",
  ruby: () => "02-language-specialists/rails-expert.md",
  java: () => "02-language-specialists/java-architect.md",
  php: () => "02-language-specialists/php-pro.md",
  dotnet: () => "02-language-specialists/dotnet-core-expert.md",
  elixir: () => "02-language-specialists/elixir-expert.md",
};

/** Generated regardless of language, since code review applies to every project. */
const UNIVERSAL_AGENT_TEMPLATES = ["04-quality-security/code-reviewer.md"];

function pickTemplates(root, languages) {
  const picks = [...UNIVERSAL_AGENT_TEMPLATES];
  const id = languages && languages.primary ? languages.primary.id : null;
  const picker = id && LANGUAGE_AGENT_TEMPLATES[id];
  if (picker) picks.push(picker(root));
  return picks;
}

function copyTemplate(root, relTemplatePath) {
  const src = path.join(TEMPLATES_ROOT, relTemplatePath);
  const filename = path.basename(relTemplatePath);
  const dest = path.join(root, ".claude", "agents", filename);

  if (!fs.existsSync(src)) {
    return { status: "template-missing", filename };
  }
  if (fs.existsSync(dest)) {
    return { status: "skipped-exists", filename };
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return { status: "created", filename };
}

function generateEssentialAgents(root, languages) {
  const picks = pickTemplates(root, languages);
  const results = picks.map((rel) => copyTemplate(root, rel));
  const created = results.filter((r) => r.status === "created").map((r) => r.filename);
  recordThirdPartyNotice(root, created);
  return results;
}

module.exports = { generateEssentialAgents, pickTemplates, LANGUAGE_AGENT_TEMPLATES, UNIVERSAL_AGENT_TEMPLATES, SOURCE_URL };
