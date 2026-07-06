/**
 * One "why this matters" paragraph per scoring category, shown by `--explain`.
 * Kept separate from score.js so the scoring logic doesn't have to carry prose.
 */
const EXPLANATIONS = {
  claude_md:
    "CLAUDE.md loads into context automatically at the start of every session. Without it, Claude has to re-derive your conventions, build/test commands, and architecture from scratch each time — repeating the same mistakes and spending tokens on exploration that a few lines of context would have prevented.",
  settings:
    "Unlike CLAUDE.md, which Claude reads as guidance, settings.json's permissions and hooks are enforced by Claude Code itself. A hook always fires on its event and a permission rule always blocks or allows a command — it's the only way to guarantee behavior (lint after every edit, never run rm -rf) instead of hoping Claude follows an instruction. statusLine also helps you notice a filling context window before it degrades output quality.",
  skills:
    "A skill turns a workflow you'd otherwise re-explain every time into a single command Claude (or you) can invoke, and its description loads at near-zero cost until it's actually used. Skipping disable-model-invocation on an action skill (deploy, commit, publish) means Claude could decide to run it on its own judgment instead of yours.",
  agents:
    "Subagents isolate work in their own context window and return only a summary, so tasks that read many files or explore broadly don't fill up your main conversation. Without them, large exploratory or parallel tasks compete with your actual work for the same limited context.",
  rules:
    "Rules let you scope instructions to only the files that need them via `paths:`, instead of loading everything into every session the way CLAUDE.md does. Without this, a growing CLAUDE.md keeps consuming context on every request even when most of it is irrelevant to the current task.",
  mcp:
    "MCP is what connects Claude to systems it can't otherwise reach — a database, an internal API, Slack. Without it, Claude either can't act on that data at all or falls back on ad hoc shell commands, which is slower and less reliable. Hardcoding secrets in .mcp.json instead of referencing environment variables also risks leaking them into a file people commit.",
  hygiene:
    "settings.local.json and CLAUDE.local.md hold personal configuration — permissions or preferences that shouldn't be forced on the rest of the team. If they aren't gitignored, they get committed by accident and either leak personal setup or silently override what the team agreed on.",
  extras:
    "These are optional refinements (custom output styles, saved workflows, persistent subagent memory, worktree file copying) that smooth out specific friction points once you hit them. None are required for Claude Code to work well, so skipping them costs little until the matching need actually shows up.",
  principles:
    "Documenting the SOLID principles and GoF patterns actually used in the codebase gives Claude, and new contributors, an explicit map of design decisions already made, instead of forcing a reverse-engineering pass through scattered code — the same reasoning behind keeping CLAUDE.md itself as upfront, explicit context.",
};

module.exports = { EXPLANATIONS };
