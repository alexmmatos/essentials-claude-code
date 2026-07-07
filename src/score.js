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
  output_styles: 1,
  workflows: 1,
  agent_memory: 2,
  worktree_include: 1,
  principles: 10,
};

/**
 * How a category's recommendations should be handled by the generated --fix prompt:
 * - "auto": safe for an agent to implement directly.
 * - "conditional": depends on context only the user knows (team practices, whether a
 *   feature is even wanted) — the agent should ask, not assume, and never fabricate
 *   scaffolding just to satisfy the score.
 * - "manual": touches a security-sensitive file that already exists (e.g. permissions
 *   in settings.json) — the user should review and edit it themselves.
 */
const FIX_PROMPT_MODES = ["auto", "conditional", "manual"];

/**
 * Builds a normalized category result.
 * `raw` is a 0-100 score for the category; `points` is scaled by its weight.
 */
function buildResult({ id, label, raw, findings, recommendations, fixPromptMode = "auto" }) {
  const weight = WEIGHTS[id];
  if (weight === undefined) throw new Error(`Unknown category id: ${id}`);
  if (!FIX_PROMPT_MODES.includes(fixPromptMode)) {
    throw new Error(`Unknown fixPromptMode: ${fixPromptMode}`);
  }
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
    fixPromptMode,
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
      fixPromptMode: c.fixPromptMode,
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

module.exports = { WEIGHTS, FIX_PROMPT_MODES, buildResult, aggregate };
