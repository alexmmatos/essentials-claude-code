const path = require("node:path");
const { exists, readFileSafe } = require("../fsutil");
const { buildResult } = require("../score");
const { detect: detectLanguages } = require("../languages");

const COMMAND_SIGNAL = /(npm run|npm test|pnpm |yarn |make |cargo |go test|pytest|##\s|build|test|lint)/i;

function check(root, context = {}) {
  const candidates = [path.join(root, "CLAUDE.md"), path.join(root, ".claude", "CLAUDE.md")];
  const found = candidates.find(exists);
  const findings = [];
  const recommendations = [];

  if (!found) {
    findings.push({ type: "missing", message: "No CLAUDE.md found at the root or in .claude/CLAUDE.md." });
    recommendations.push(
      "Create a CLAUDE.md at the root with conventions, build/test/lint commands, and the project's architecture."
    );
    return buildResult({ id: "claude_md", label: "CLAUDE.md", raw: 0, findings, recommendations });
  }

  const content = readFileSafe(found) || "";
  const lines = content.split("\n");
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  let raw = 40;
  findings.push({ type: "ok", message: `Found at ${path.relative(root, found)}.` });

  if (nonEmptyLines.length >= 5) {
    raw += 20;
    findings.push({ type: "ok", message: `Substantial content (${nonEmptyLines.length} non-empty lines).` });
  } else {
    findings.push({ type: "warn", message: "Content is very short — looks like a placeholder." });
    recommendations.push("Fill in CLAUDE.md with real project conventions (commands, stack, rules).");
  }

  if (lines.length <= 200) {
    raw += 20;
    findings.push({ type: "ok", message: `Within the recommended limit (${lines.length}/200 lines).` });
  } else {
    raw += 8;
    findings.push({ type: "warn", message: `Has ${lines.length} lines, above the recommended 200.` });
    recommendations.push("Move reference content into .claude/rules/ or skills to keep CLAUDE.md lean.");
  }

  const languages = context.languages || detectLanguages(root);
  const profile = languages.primary;

  // When a language is detected, its specific command signal is authoritative —
  // the generic regex is loose enough (any "## " heading, bare "test"/"build")
  // that it would otherwise rubber-stamp docs that never name a real command.
  if (profile) {
    if (profile.commandSignal.test(content)) {
      raw += 20;
      findings.push({ type: "ok", message: `Contains commands specific to ${profile.label} (e.g., ${profile.exampleTools}).` });
    } else {
      findings.push({
        type: "warn",
        message: `Detected ${profile.label} in the project, but found no typical commands (e.g., ${profile.exampleTools}) in CLAUDE.md.`,
      });
      recommendations.push(`List the real ${profile.label} commands used here (e.g., ${profile.exampleTools}).`);
    }
  } else if (COMMAND_SIGNAL.test(content)) {
    raw += 20;
    findings.push({ type: "ok", message: "Contains commands or structured sections (build/test/lint)." });
  } else {
    findings.push({ type: "warn", message: "Didn't find explicit build/test/lint commands." });
    recommendations.push("List the most-used commands (build, test, lint) so Claude doesn't have to guess them.");
  }

  return buildResult({ id: "claude_md", label: "CLAUDE.md", raw, findings, recommendations });
}

module.exports = { check };
