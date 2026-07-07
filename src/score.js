const { EXPLANATIONS } = require("./explanations");

/** Category weights, summing to 100. */
const WEIGHTS = {
  claude_md: 20,
  settings: 15,
  skills: 15,
  agents: 15,
  rules: 10,
  mcp: 5,
  hygiene: 5,
  extras: 5,
  principles: 10,
};

/**
 * Builds a normalized category result.
 * `raw` is a 0-100 score for the category; `points` is scaled by its weight.
 */
function buildResult({ id, label, raw, findings, recommendations, skipInFixPrompt = false }) {
  const weight = WEIGHTS[id];
  if (weight === undefined) throw new Error(`Unknown category id: ${id}`);
  const clamped = Math.max(0, Math.min(100, raw));
  const points = Math.round((weight * clamped) / 100);
  return {
    id,
    label,
    weight,
    raw: Math.round(clamped),
    points,
    findings,
    recommendations,
    explanation: EXPLANATIONS[id] || null,
    skipInFixPrompt,
  };
}

function aggregate(categoryResults) {
  const total = categoryResults.reduce((sum, c) => sum + c.points, 0);
  const maxTotal = categoryResults.reduce((sum, c) => sum + c.weight, 0);
  const recommendations = categoryResults
    .map((c) => ({
      id: c.id,
      category: c.label,
      gap: c.weight - c.points,
      items: c.recommendations,
      explanation: c.explanation,
      skipInFixPrompt: c.skipInFixPrompt,
    }))
    .filter((c) => c.items.length > 0)
    .sort((a, b) => b.gap - a.gap);

  return {
    total: Math.round(total),
    maxTotal,
    categories: categoryResults,
    recommendations,
  };
}

module.exports = { WEIGHTS, buildResult, aggregate };
