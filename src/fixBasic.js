const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { exists, isDir } = require("./fsutil");
const { detect: detectLanguages } = require("./languages");

function claudeMdTemplate(languages) {
  const profile = languages && languages.primary;
  // `exampleTools` isn't guaranteed to be in build/test/lint order (it varies per
  // language), so it's only shown as a hint — never mapped positionally into the slots.
  const hint = profile ? `\n<!-- Detected ${profile.label}. Typical tools: ${profile.exampleTools} -->\n` : "";
  return `# Project conventions
${hint}
## Commands
- Build:
- Test:
- Lint:

## Stack
-

## Rules
-
`;
}

function createFile(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}

function isGitIgnored(root, relPath) {
  try {
    execFileSync("git", ["check-ignore", "-q", relPath], { cwd: root, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function ensureGitignoreEntries(root) {
  const personalFiles = [path.join(".claude", "settings.local.json"), "CLAUDE.local.md"];
  const needsEntry = personalFiles.filter((rel) => exists(path.join(root, rel)) && !isGitIgnored(root, rel));
  if (needsEntry.length === 0) return [];

  const gitignorePath = path.join(root, ".gitignore");
  const existing = exists(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
  const toAdd = needsEntry.filter((rel) => !existing.includes(rel));
  if (toAdd.length === 0) return [];

  const separator = existing && !existing.endsWith("\n") ? "\n" : "";
  fs.writeFileSync(gitignorePath, existing + separator + toAdd.join("\n") + "\n");
  return toAdd;
}

/** Creates the minimal missing scaffolding (files/folders), never overwriting anything that already exists. */
function fixBasic(root) {
  const actions = [];
  const languages = detectLanguages(root);

  const claudeMdPath = path.join(root, "CLAUDE.md");
  const claudeMdAltPath = path.join(root, ".claude", "CLAUDE.md");
  if (!exists(claudeMdPath) && !exists(claudeMdAltPath)) {
    createFile(claudeMdPath, claudeMdTemplate(languages));
    actions.push({ status: "created", target: "CLAUDE.md" });
  } else {
    actions.push({ status: "skipped-exists", target: "CLAUDE.md" });
  }

  const settingsPath = path.join(root, ".claude", "settings.json");
  if (!exists(settingsPath)) {
    createFile(settingsPath, JSON.stringify({ permissions: { allow: [], deny: [] }, hooks: {} }, null, 2) + "\n");
    actions.push({ status: "created", target: ".claude/settings.json" });
  } else {
    actions.push({ status: "skipped-exists", target: ".claude/settings.json" });
  }

  for (const dir of ["rules", "skills", "agents"]) {
    const dirPath = path.join(root, ".claude", dir);
    if (!isDir(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      actions.push({ status: "created", target: `.claude/${dir}/` });
    } else {
      actions.push({ status: "skipped-exists", target: `.claude/${dir}/` });
    }
  }

  for (const rel of ensureGitignoreEntries(root)) {
    actions.push({ status: "created", target: `.gitignore entry for ${rel}` });
  }

  return actions;
}

module.exports = { fixBasic };
