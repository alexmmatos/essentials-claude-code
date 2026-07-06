const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { exists } = require("../fsutil");
const { buildResult } = require("../score");

function isGitIgnored(root, relPath) {
  try {
    execFileSync("git", ["check-ignore", "-q", relPath], { cwd: root, stdio: "ignore" });
    return true;
  } catch (err) {
    // exit code 1 = not ignored, 128 = not a git repo / other git error
    return false;
  }
}

function check(root) {
  const findings = [];
  const recommendations = [];
  const personalFiles = [
    { rel: path.join(".claude", "settings.local.json"), label: ".claude/settings.local.json" },
    { rel: "CLAUDE.local.md", label: "CLAUDE.local.md" },
  ];

  const present = personalFiles.filter((f) => exists(path.join(root, f.rel)));
  if (present.length === 0) {
    findings.push({ type: "ok", message: "No personal files (settings.local.json / CLAUDE.local.md) to check." });
    return buildResult({ id: "hygiene", label: "Git hygiene", raw: 100, findings, recommendations });
  }

  let ignoredCount = 0;
  for (const f of present) {
    if (isGitIgnored(root, f.rel)) {
      ignoredCount += 1;
      findings.push({ type: "ok", message: `${f.label} exists and is correctly gitignored.` });
    } else {
      findings.push({ type: "warn", message: `${f.label} exists but is NOT gitignored.` });
      recommendations.push(`Add ${f.label} to .gitignore — it's personal configuration and shouldn't be committed.`);
    }
  }

  const raw = Math.round((100 * ignoredCount) / present.length);
  return buildResult({ id: "hygiene", label: "Git hygiene", raw, findings, recommendations });
}

module.exports = { check };
