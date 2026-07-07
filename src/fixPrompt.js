/** Builds a plain-text, copy-pasteable prompt summarizing what's missing, ordered by score gap. */
function buildFixPrompt(result) {
  const pct = Math.round((100 * result.total) / result.maxTotal);
  const lines = [];

  lines.push(
    `I ran essentials-claude-code on this project and got a Claude Code adoption score of ${result.total}/${result.maxTotal} (${pct}%).`
  );
  lines.push("Please implement the following, in priority order (biggest score gap first):");
  lines.push("");

  const actionable = result.recommendations.filter((rec) => !rec.skipInFixPrompt);
  const manual = result.recommendations.filter((rec) => rec.skipInFixPrompt);

  let n = 1;
  for (const rec of actionable) {
    lines.push(`${n}. ${rec.category} (${rec.gap} point${rec.gap === 1 ? "" : "s"} missing)`);
    for (const item of rec.items) {
      lines.push(`   - ${item}`);
    }
    if (rec.explanation) {
      lines.push(`   Why this matters: ${rec.explanation}`);
    }
    lines.push("");
    n += 1;
  }

  if (manual.length > 0) {
    lines.push(
      "The following already exist and are security-sensitive Claude Code config — review and edit them yourself instead of having an agent change them automatically:"
    );
    for (const rec of manual) {
      lines.push(`- ${rec.category}`);
    }
    lines.push("");
  }

  lines.push("Keep the changes minimal and focused only on what's listed above.");
  return lines.join("\n");
}

module.exports = { buildFixPrompt };
