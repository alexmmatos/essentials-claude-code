const COLOR = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function scoreColor(pct) {
  if (pct >= 80) return COLOR.green;
  if (pct >= 50) return COLOR.yellow;
  return COLOR.red;
}

function bar(points, weight, width = 20) {
  const filled = weight === 0 ? 0 : Math.round((width * points) / weight);
  return "█".repeat(filled) + "░".repeat(Math.max(0, width - filled));
}

function icon(type) {
  if (type === "ok") return "✔";
  if (type === "warn") return "⚠";
  return "✘";
}

function renderLanguages(languages) {
  if (!languages || (!languages.primary && languages.breakdown.length === 0)) {
    return "Detected languages: no programming language identified.";
  }
  if (languages.breakdown.length === 0) {
    // Manifest-only detection (e.g., a package.json with no source files yet): no
    // extension counts to report a percentage breakdown from, but we do know the language.
    return `Detected languages: ${languages.primary.label} (via manifest)`;
  }
  const top = languages.breakdown
    .slice(0, 4)
    .map((b) => `${b.language} (${b.percent}%)`)
    .join(", ");
  return `Detected languages: ${top}`;
}

function renderTerminal(result, { verbose = false, color = true, explain = false } = {}) {
  const c = color ? COLOR : Object.fromEntries(Object.keys(COLOR).map((k) => [k, ""]));
  const pct = Math.round((100 * result.total) / result.maxTotal);
  const lines = [];

  lines.push(`${c.bold}Arthur Inspector — Claude Code Adoption Score${c.reset}`);
  lines.push("");
  lines.push(`${c.bold}Overall score: ${scoreColor(pct)}${result.total}/${result.maxTotal} (${pct}%)${c.reset}`);
  lines.push("");
  lines.push(`${c.dim}${renderLanguages(result.languages)}${c.reset}`);
  lines.push("");

  for (const cat of result.categories) {
    const catPct = cat.weight === 0 ? 0 : Math.round((100 * cat.points) / cat.weight);
    lines.push(
      `${scoreColor(catPct)}${bar(cat.points, cat.weight)}${c.reset} ${cat.label.padEnd(16)} ${cat.points}/${cat.weight}`
    );
    if (verbose) {
      for (const f of cat.findings) {
        const fc = f.type === "ok" ? c.green : f.type === "warn" ? c.yellow : c.red;
        lines.push(`   ${fc}${icon(f.type)}${c.reset} ${f.message}`);
      }
    }
  }

  if (result.recommendations.length > 0) {
    lines.push("");
    lines.push(`${c.bold}Top recommendations${c.reset}`);
    let shown = 0;
    for (const rec of result.recommendations) {
      if (shown >= 8) break;
      const remaining = 8 - shown;
      const items = rec.items.slice(0, remaining);
      for (const item of items) {
        lines.push(`  ${c.cyan}→${c.reset} [${rec.category}] ${item}`);
      }
      shown += items.length;
      if (explain && rec.explanation) {
        lines.push(`    ${c.dim}Why it matters: ${rec.explanation}${c.reset}`);
      }
    }
  }

  const hasGaps = result.total < result.maxTotal;
  const agentsCategory = result.categories.find((cat) => cat.id === "agents");
  const agentsIncomplete = agentsCategory && agentsCategory.points < agentsCategory.weight;

  const tips = [];
  if (!explain) tips.push(["--explain", "see the longer reasoning behind each recommendation"]);
  if (!verbose) tips.push(["--verbose, -v", "see full detail for every category, not just the summary"]);
  tips.push(["--json", "machine-readable output, for CI or scripts"]);
  if (hasGaps) {
    tips.push(["--fix-basic", "create the missing scaffolding automatically (CLAUDE.md, settings.json, folders) — never overwrites anything"]);
    tips.push(["--fix-prompt", "get a ready-to-paste prompt for Claude Code to write the real content instead"]);
    tips.push(["--fix", "not sure which of the two above? this asks and explains both"]);
  }
  if (agentsIncomplete) {
    tips.push(["--generate-essential-agents", "add a subagent matched to this project's language — Subagents isn't at full score yet"]);
  }

  if (tips.length > 0) {
    lines.push("");
    lines.push(`${c.bold}Useful next steps${c.reset}`);
    for (const [flag, desc] of tips) {
      lines.push(`  ${c.cyan}→${c.reset} ${c.bold}${flag}${c.reset} — ${desc}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function renderJson(result) {
  return JSON.stringify(result, null, 2);
}

function renderFixPrompt(promptText, { color = true } = {}) {
  const c = color ? COLOR : Object.fromEntries(Object.keys(COLOR).map((k) => [k, ""]));
  const banner = `${c.bold}${c.yellow}⚠ Paste this into Claude Code so it generates the files.${c.reset}`;
  return `${promptText}\n\n${banner}\n`;
}

module.exports = { renderTerminal, renderJson, renderFixPrompt };
