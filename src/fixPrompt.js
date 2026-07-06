/** Builds a plain-text, copy-pasteable prompt summarizing what's missing, ordered by score gap. */
function buildFixPrompt(result) {
  const pct = Math.round((100 * result.total) / result.maxTotal);
  const lines = [];

  lines.push(
    `I ran arthur-inspector on this project and got a Claude Code adoption score of ${result.total}/${result.maxTotal} (${pct}%).`
  );
  lines.push("Please implement the following, in priority order (biggest score gap first):");
  lines.push("");

  let n = 1;
  for (const rec of result.recommendations) {
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

  lines.push("Keep the changes minimal and focused only on what's listed above.");
  return lines.join("\n");
}

module.exports = { buildFixPrompt };
