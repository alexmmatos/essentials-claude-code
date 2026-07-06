# essentials-claude-code

CLI that evaluates how well a project takes advantage of Claude Code's
extensions (CLAUDE.md, settings.json, skills, subagents, rules, MCP) and
produces a 0-100 score with recommendations.

## Commands
- Tests: `npm test` (runs `node --test`, auto-discovers `test/*.test.js`)
- Run the CLI locally: `node bin/cli.js [path] [--json|--verbose|--min-score=N]`

## Stack
- Plain Node.js (CommonJS, `require`), **no npm runtime dependencies**
- Tests with `node:test` + `node:assert/strict`; fixtures in `test/fixtures/`
- `--generate-all-agents` uses the external `ripgrep` (`rg`) binary when available,
  for speed, but transparently falls back to a pure-Node scan (`runPureNodeScan`
  in `src/rankAgentRelevance.js`) when it isn't installed — `rg` is optional
  everywhere in this package, never a hard requirement

## Architecture
- `bin/cli.js`: argument parsing and CLI entrypoint
- `src/index.js`: orchestrates the checks (`CHECKS`) and aggregates the result
- `src/checks/*.js`: one module per scoring category (`claudeMd`, `settings`,
  `skills`, `agents`, `rules`, `mcp`, `hygiene`, `extras`, `principles`); each
  exports `check(root, context)` and returns its result via `buildResult()`
- `src/score.js`: weights (`WEIGHTS`, always summing to 100) and aggregation (`aggregate`)
- `src/report.js`: terminal (colored) and JSON rendering
- `src/languages.js`: detects the project's language(s) via manifest files and
  file-extension counts; consumed by `claudeMd.js` to require language-specific commands
- `src/agentTemplates.js`: `--generate-essential-agents` — one flagship agent per
  detected language, plus `code-reviewer.md`, copied from `template-agents/`
- `src/rankAgentRelevance.js`: generic single-ripgrep-scan term-relevance ranker
  (also runnable standalone: `node src/rankAgentRelevance.js <terms-json> <root>`)
- `src/generateAllAgents.js`: `--generate-all-agents` — feeds
  `src/agentTermTemplateRelevance.json` (term → template weights) and
  `src/agentTemplateCatalog.json` (template name → file path) through
  `rankAgentRelevance` and copies every template with a positive score
- `src/thirdPartyNotice.js`: shared `THIRD_PARTY_NOTICES.md` writer for both
  agent generators (MIT attribution requirement)
- `src/fixBasic.js` / `src/fixPrompt.js`: `--fix-basic` (mechanical scaffolding)
  and `--fix-prompt` (paste-into-Claude-Code prompt text)

## Rules
- Every check in `src/checks/` must return via `buildResult` from `src/score.js`,
  never hand-build the result object
- New category = new `id` in `WEIGHTS` (redistribute weights so the sum stays 100),
  registered in `CHECKS` (`src/index.js`), with at least one test covering it
- Don't add npm runtime dependencies — the package must run on plain Node only
- Anything that could shell out to `rg` must keep working without it (fall back
  to `runPureNodeScan`), so tests never need to skip based on whether it's installed
- Test fixtures (`test/fixtures/`) use original content, never copied
  verbatim from Claude Code's official documentation
